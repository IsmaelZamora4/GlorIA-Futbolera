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
  { id: "premier-league", name: "Premier League", teams: [{ name: "Man City" }, { name: "Liverpool" }, { name: "Brighton" }, { name: "Man United" }, { name: "Chelsea" }] },
  { id: "la-liga", name: "LaLiga", teams: [{ name: "Barcelona" }, { name: "Real Madrid" }, { name: "Ath Madrid" }, { name: "Getafe" }] },
];

function resolveBankFootballLeg(competitionId, homeTeam, awayTeam) {
  const competition = footballOptions.find((item) => item.id === competitionId);
  if (!competition) return { error: "Selecciona una competición disponible." };
  if (!homeTeam || !awayTeam) return { error: "Selecciona los equipos local y visitante." };
  if (homeTeam === awayTeam) return { error: "El equipo local y el visitante deben ser distintos." };
  const valid = new Set(competition.teams.map((team) => team.name));
  if (!valid.has(homeTeam) || !valid.has(awayTeam)) return { error: "Los equipos seleccionados no pertenecen a esa competición." };
  return { competition: competition.name, homeTeam, awayTeam };
}

const onePickTicket = (overrides = {}) => ({
  oddsMode: "per_pick",
  stake: 12.5,
  totalOdds: null,
  legs: [{ competition: "premier-league", homeTeam: "Man City", awayTeam: "Liverpool", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: 1.4 }] }],
  ...overrides,
});

function makeClient() {
  return {
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    rpc: async (name, args) => {
      state.rpcs.push({ name, args });
      return state.rpcResult ?? { data: "ticket-a", error: null };
    },

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
            maybeSingle: async () => ({
              data: table === "bank_bet_legs" ? state.legacyLeg : table === "bank_bet_picks" ? state.pendingPick : state.bank,
              error: state.bankError ?? null,
            }),
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
  if (request === "@/features/bank/services/football-options") return { resolveBankFootballLeg };
  if (request === "next/cache") return { revalidatePath: (path) => state.revalidated.push(path) };
  return originalLoad.call(this, request, parent, isMain);
};
const { createAdjustment, createBank, createBet, settleBet, settleTicketPick } = require("../features/bank/actions.ts");
Module._load = originalLoad;

function reset(overrides = {}) {
  state = {
    user: { id: "user-a" },
    bank: { id: "bank-a" },
    bankError: null,
    insertError: null,
    settleResult: { data: { id: "bet-a" }, error: null },
    legacyLeg: { id: "leg-a" },
    pendingPick: { id: "pick-a" },
    rpcResult: { data: true, error: null },
    rpcs: [],
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

test("crea un ticket con varios partidos y picks en una única llamada atómica", async () => {
  reset();
  const ticket = onePickTicket({ legs: [
    { competition: "premier-league", homeTeam: "Man City", awayTeam: "Liverpool", picks: [
      { market: "Goles", selection: "Más de 1.5", decimalOdds: 1.4 },
      { market: "Tiros a puerta", selection: "Más de 7.5", decimalOdds: 1.7 },
    ] },
    { competition: "la-liga", homeTeam: "Real Madrid", awayTeam: "Barcelona", picks: [
      { market: "Ambos anotan", selection: "Sí", decimalOdds: 1.8 },
      { market: "Goles", selection: "Más de 3.5", decimalOdds: 2.2 },
    ] },
    { competition: "la-liga", homeTeam: "Ath Madrid", awayTeam: "Getafe", picks: [
      { market: "Resultado", selection: "Empate", decimalOdds: 3.1 },
    ] },
  ] });
  const result = await createBet(form({ ticket: JSON.stringify(ticket), user_id: "user-b" }));
  assert.equal(result.success, "Ticket registrado.");
  assert.ok(state.filters.some((filter) => filter.table === "banks" && filter.column === "user_id" && filter.value === "user-a"));
  assert.equal(state.writes.length, 0);
  assert.equal(state.rpcs.length, 1);
  assert.equal(state.rpcs[0].name, "create_bank_ticket");
  assert.equal(state.rpcs[0].args.p_bank_id, "bank-a");
  assert.equal(state.rpcs[0].args.p_odds_mode, "per_pick");
  assert.deepEqual(state.rpcs[0].args.p_legs.map((leg) => leg.picks.length), [2, 2, 1]);
  assert.equal(state.rpcs[0].args.p_legs[2].competition, "LaLiga");
});

test("crea ticket de cuota total y no envía cuotas individuales", async () => {
  reset();
  const ticket = onePickTicket({ oddsMode: "combined", totalOdds: 9.75, legs: [
    { competition: "premier-league", homeTeam: "Man City", awayTeam: "Liverpool", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: null }] },
  ] });
  const result = await createBet(form({ ticket: JSON.stringify(ticket) }));
  assert.equal(result.success, "Ticket registrado.");
  assert.equal(state.rpcs[0].args.p_total_odds, 9.75);
  assert.equal(state.rpcs[0].args.p_legs[0].picks[0].decimalOdds, undefined);
});

test("ticket bloqueado por el límite compartido muestra respuesta acotada", async () => {
  reset({ rpcResult: { data: null, error: { message: "rate_limit_exceeded" } } });
  const ticket = onePickTicket();
  const result = await createBet(form({ ticket: JSON.stringify(ticket) }));
  assert.match(result.error, /límite de apuestas/i);
  assert.equal(state.rpcs[0].name, "create_bank_ticket");
});

test("rechaza el mismo equipo como local y visitante y no crea ticket", async () => {
  reset();
  const ticket = onePickTicket({ legs: [{ competition: "premier-league", homeTeam: "Man City", awayTeam: "Man City", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: 1.4 }] }] });
  const result = await createBet(form({ ticket: JSON.stringify(ticket) }));
  assert.match(result.error, /distintos/i);
  assert.equal(state.rpcs.length, 0);
});

test("rechaza equipos que no pertenecen a su liga antes de crear ticket", async () => {
  reset();
  const ticket = onePickTicket({ legs: [{ competition: "premier-league", homeTeam: "Man City", awayTeam: "Barcelona", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: 1.4 }] }] });
  const result = await createBet(form({ ticket: JSON.stringify(ticket) }));
  assert.match(result.error, /no pertenecen/i);
  assert.equal(state.rpcs.length, 0);
});

test("rechaza cuota individual inválida antes de crear ticket", async () => {
  reset();
  const ticket = onePickTicket({ legs: [{ competition: "premier-league", homeTeam: "Man City", awayTeam: "Liverpool", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: 1.0009 }] }] });
  const result = await createBet(form({ ticket: JSON.stringify(ticket) }));
  assert.match(result.error, /1\.001/i);
  assert.equal(state.rpcs.length, 0);
});

test("el ajuste se vincula al Bank de la sesión y normaliza la nota", async () => {
  reset();
  const result = await createAdjustment(form({ amount: 20, kind: "deposit", note: "  Aporte  ", user_id: "user-b" }));
  assert.equal(result.success, "Aporte registrado.");
  assert.deepEqual(state.rpcs, [{ name: "create_bank_adjustment", args: { p_bank_id: "bank-a", p_amount: 20, p_kind: "deposit", p_note: "Aporte" } }]);
  assert.equal(state.writes.length, 0);
});

test("ajuste bloqueado por el límite compartido muestra respuesta acotada", async () => {
  reset({ rpcResult: { data: null, error: { message: "rate_limit_exceeded" } } });
  const result = await createAdjustment(form({ amount: 20, kind: "deposit", note: "Aporte" }));
  assert.match(result.error, /límite de ajustes/i);
  assert.deepEqual(state.rpcs[0].args, { p_bank_id: "bank-a", p_amount: 20, p_kind: "deposit", p_note: "Aporte" });
});

test("un pick del ticket se liquida mediante RPC autenticado y revalida el Bank", async () => {
  reset();
  const result = await settleTicketPick(form({ pickId: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", result: "won" }));
  assert.equal(result.success, "Pronóstico liquidado; se actualizó el estado del ticket.");
  assert.deepEqual(state.rpcs, [{ name: "settle_bank_ticket_pick", args: { p_pick_id: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", p_result: "won" } }]);
  assert.deepEqual(state.revalidated, ["/home/bank"]);
});

test("los tickets antiguos se liquidan a través de su pick preservado", async () => {
  reset();
  const result = await settleBet(form({ betId: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", status: "won" }));
  assert.equal(result.success, "Apuesta liquidada.");
  assert.deepEqual(state.rpcs, [{ name: "settle_bank_ticket_pick", args: { p_pick_id: "pick-a", p_result: "won" } }]);
  assert.ok(state.filters.some((filter) => filter.table === "bank_bet_legs" && filter.column === "is_legacy" && filter.value === true));
  assert.deepEqual(state.revalidated, ["/home/bank"]);
});

test("no revela si un pick ajeno existe y rechaza UUID o resultado malformado", async () => {
  reset({ rpcResult: { data: false, error: null } });
  const result = await settleTicketPick(form({ pickId: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", result: "won" }));
  assert.match(result.error, /ticket ya fue liquidado/i);

  reset();
  const invalid = await settleTicketPick(form({ pickId: "not-an-id", result: "won" }));
  assert.match(invalid.error, /no válido/i);
  const invalidResult = await settleTicketPick(form({ pickId: "4f11c060-41fa-4ced-83c7-8b1e5cf22a3e", result: "refund" }));
  assert.match(invalidResult.error, /resultado/i);
  assert.equal(state.rpcs.length, 0);
});
