/* eslint-disable @typescript-eslint/no-require-imports -- Load server actions with a mocked Supabase client. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const typescript = require("typescript");

require.extensions[".ts"] = (module, fileName) => {
  const compiled = typescript.transpileModule(readFileSync(fileName, "utf8"), {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
  }).outputText;
  module._compile(compiled, fileName);
};

let state;
const footballOptions = [
  { id: "premier-league", name: "Premier League", teams: [{ name: "Man City" }, { name: "Liverpool" }, { name: "Brighton" }] },
  { id: "la-liga", name: "LaLiga", teams: [{ name: "Barcelona" }, { name: "Real Madrid" }] },
];

function resolveBankFootballEvent(competitionId, homeTeam, awayTeam) {
  const competition = footballOptions.find((item) => item.id === competitionId);
  if (!competition) return { error: "Selecciona una competición disponible." };
  if (!homeTeam || !awayTeam) return { error: "Selecciona los equipos local y visitante." };
  if (homeTeam === awayTeam) return { error: "El equipo local y el visitante deben ser distintos." };
  const valid = new Set(competition.teams.map((team) => team.name));
  if (!valid.has(homeTeam) || !valid.has(awayTeam)) return { error: "Los equipos seleccionados no pertenecen a esa competición." };
  return { event: `${competition.name} · ${homeTeam} vs ${awayTeam}` };
}

function makeClient() {
  return {
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from(table) {
      return {
        insert(values) {
          state.writes.push({ table, values });
          return Promise.resolve({ error: state.insertError ?? null });
        },
        select() {
          const query = {
            eq(column, value) {
              state.filters.push({ table, column, value });
              return query;
            },
            maybeSingle: async () => ({ data: state.bank, error: state.bankError ?? null }),
          };
          return query;
        },
        update(values) {
          state.updates.push({ table, values });
          const query = {
            eq(column, value) {
              state.filters.push({ table, column, value });
              return query;
            },
            select() {
              return query;
            },
            maybeSingle: async () => state.settleResult ?? { data: null, error: null },
          };
          return query;
        },
      };
    },
  };
}

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@/lib/supabase/server") return { createClient: async () => makeClient() };
  if (request === "@/features/bank/services/calculations") {
    return originalLoad.call(this, require.resolve("../features/bank/services/calculations.ts"), parent, isMain);
  }
  if (request === "@/features/bank/services/football-options") return { resolveBankFootballEvent };
  if (request === "next/cache") return { revalidatePath: (path) => state.revalidated.push(path) };
  return originalLoad.call(this, request, parent, isMain);
};
const { createAdjustment, createBank, createBet, settleBet } = require("../features/bank/actions.ts");
Module._load = originalLoad;

function reset(overrides = {}) {
  state = {
    user: { id: "user-a" },
    bank: { id: "bank-a" },
    bankError: null,
    insertError: null,
    settleResult: { data: { id: "bet-a" }, error: null },
    writes: [],
    updates: [],
    filters: [],
    revalidated: [],
    ...overrides,
  };
}

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, String(value));
  return data;
}

test("sin sesión no se escribe en Supabase", async () => {
  reset({ user: null });
  const result = await createBank(form({ initialCapital: 100, currency: "PEN" }));
  assert.match(result.error, /sesión/i);
  assert.equal(state.writes.length, 0);
});

test("el propietario del Bank procede de la sesión y no del formulario", async () => {
  reset();
  const result = await createBank(form({ initialCapital: 100, currency: "PEN", user_id: "user-b" }));
  assert.equal(result.success, "Bank creado correctamente.");
  assert.deepEqual(state.writes[0], { table: "banks", values: { user_id: "user-a", currency: "PEN", initial_capital: 100 } });
  assert.deepEqual(state.revalidated, ["/home/bank"]);
});

test("la apuesta consulta el Bank propio y persiste el user_id autenticado", async () => {
  reset();
  const result = await createBet(form({ competition: "premier-league", homeTeam: "Man City", awayTeam: "Brighton", market: "Goles", selection: "Más de 2.5", stake: 12.5, decimalOdds: 2.1, user_id: "user-b" }));
  assert.equal(result.success, "Apuesta registrada.");
  assert.ok(state.filters.some((filter) => filter.table === "banks" && filter.column === "user_id" && filter.value === "user-a"));
  assert.deepEqual(state.writes[0], {
    table: "bets",
    values: { bank_id: "bank-a", user_id: "user-a", sport: "Fútbol", event: "Premier League · Man City vs Brighton", market: "Goles", selection: "Más de 2.5", stake: 12.5, decimal_odds: 2.1 },
  });
});

test("rechaza el mismo equipo como local y visitante y no inserta", async () => {
  reset();
  const result = await createBet(form({ competition: "premier-league", homeTeam: "Man City", awayTeam: "Man City", market: "Goles", selection: "Más de 2.5", stake: 12, decimalOdds: 2 }));
  assert.match(result.error, /deben ser distintos/i);
  assert.equal(state.writes.length, 0);
});

test("rechaza equipos que no pertenecen a la competición enviada", async () => {
  reset();
  const result = await createBet(form({ competition: "premier-league", homeTeam: "Man City", awayTeam: "Barcelona", market: "Goles", selection: "Más de 2.5", stake: 12, decimalOdds: 2 }));
  assert.match(result.error, /no pertenecen/i);
  assert.equal(state.writes.length, 0);
});

test("rechaza importes con precisión inválida antes de insertar", async () => {
  reset();
  const result = await createBet(form({ competition: "premier-league", homeTeam: "Man City", awayTeam: "Brighton", market: "Goles", selection: "Sí", stake: 1.001, decimalOdds: 2 }));
  assert.match(result.error, /decimales/i);
  assert.equal(state.writes.length, 0);
});

test("el ajuste se vincula al Bank de la sesión y normaliza la nota", async () => {
  reset();
  const result = await createAdjustment(form({ amount: 20, kind: "deposit", note: "  Aporte  ", user_id: "user-b" }));
  assert.equal(result.success, "Aporte registrado.");
  assert.deepEqual(state.writes[0], { table: "bank_adjustments", values: { bank_id: "bank-a", user_id: "user-a", amount: 20, kind: "deposit", note: "Aporte" } });
});

test("la liquidación actualiza solo una apuesta propia todavía pendiente", async () => {
  reset();
  const result = await settleBet(form({ betId: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", status: "won" }));
  assert.equal(result.success, "Apuesta liquidada.");
  assert.deepEqual(state.filters, [
    { table: "bets", column: "id", value: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e" },
    { table: "bets", column: "user_id", value: "user-a" },
    { table: "bets", column: "status", value: "pending" },
  ]);
  assert.deepEqual(state.revalidated, ["/home/bank"]);
});

test("no revela si una apuesta ajena existe y rechaza UUID malformado", async () => {
  reset({ settleResult: { data: null, error: null } });
  const result = await settleBet(form({ betId: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", status: "won" }));
  assert.match(result.error, /ya fue liquidada o no existe/i);

  reset();
  const invalid = await settleBet(form({ betId: "not-an-id", status: "won" }));
  assert.match(invalid.error, /no válida/i);
  assert.equal(state.updates.length, 0);
});
