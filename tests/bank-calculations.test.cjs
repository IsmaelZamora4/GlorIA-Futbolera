/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads the TypeScript domain module. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const typescript = require("typescript");

require.extensions[".ts"] = (module, fileName) => {
  const compiled = typescript.transpileModule(readFileSync(fileName, "utf8"), { compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 } }).outputText;
  module._compile(compiled, fileName);
};

const { calculateBankSummary, calculateBetProfit, deriveBankTicketStatus, getEffectiveBankTicketOdds, parseBankTicketDraft, validateAdjustmentInput, validateBankInput, validateBetDetails, validateBetInput } = require("../features/bank/services/calculations.ts");

test("calcula beneficios por estado", () => {
  assert.equal(calculateBetProfit({ stake: 10, decimalOdds: 2.5, status: "won" }), 15);
  assert.equal(calculateBetProfit({ stake: 10, decimalOdds: 2.5, status: "lost" }), -10);
  assert.equal(calculateBetProfit({ stake: 10, decimalOdds: 2.5, status: "void" }), 0);
  assert.equal(calculateBetProfit({ stake: 10, decimalOdds: 2.5, status: "pending" }), 0);
});

test("calcula saldo, pendiente y yield sin contar anuladas", () => {
  const summary = calculateBankSummary(
    { initialCapital: 100, currency: "PEN" },
    [
      { stake: 20, decimalOdds: 2, status: "won" },
      { stake: 10, decimalOdds: 1.8, status: "lost" },
      { stake: 15, decimalOdds: 3, status: "pending" },
      { stake: 8, decimalOdds: 2, status: "void" },
    ],
    [{ amount: 50, kind: "deposit" }, { amount: 10, kind: "withdrawal" }],
  );
  assert.deepEqual(summary, { capitalTotal: 150, pendingAmount: 15, availableBalance: 135, netProfit: 10, yieldPercent: 33.33, resolvedStake: 30, totalBets: 4, wonBets: 1, lostBets: 1, voidBets: 1, winRatePercent: 50 });
});

test("devuelve Sin datos mediante yield nulo cuando no hay apuestas resueltas", () => {
  assert.equal(calculateBankSummary({ initialCapital: 100, currency: "EUR" }, [{ stake: 5, decimalOdds: 2, status: "pending" }], []).yieldPercent, null);
});

test("valida moneda, capital, importe y cuota", () => {
  assert.deepEqual(validateBankInput({ initialCapital: -1, currency: "GBP" }).length, 2);
  assert.equal(validateBetInput({ stake: 0, decimalOdds: 1 }).length, 2);
  assert.equal(validateBetInput({ stake: 5, decimalOdds: 1.5 }).length, 0);
});

test("rechaza montos que la escala numeric de Supabase redondearía", () => {
  assert.equal(validateBankInput({ initialCapital: 9_999_999_999.99, currency: "PEN" }).length, 0);
  assert.equal(validateBankInput({ initialCapital: 10_000_000_000, currency: "PEN" }).length, 1);
  assert.equal(validateBankInput({ initialCapital: 10.001, currency: "PEN" }).length, 1);
  assert.equal(validateBetInput({ stake: 1.001, decimalOdds: 1.0019 }).length, 2);
  assert.equal(validateBetInput({ stake: 1.01, decimalOdds: 1.001 }).length, 0);
});

test("valida campos textuales de apuesta contra límites de la base", () => {
  assert.equal(validateBetDetails({ sport: "Fútbol", event: " Partido ", market: "Goles", selection: "Más de 2.5" }).length, 0);
  assert.equal(validateBetDetails({ sport: " ", event: " ", market: "x".repeat(121), selection: "Sí" }).length, 3);
});

test("deriva la liquidación del ticket y recalcula cuotas individuales tras anulaciones", () => {
  assert.equal(deriveBankTicketStatus("per_pick", ["won", "void", "won"]), "won");
  assert.equal(getEffectiveBankTicketOdds([1.5, 9, 2], ["won", "void", "won"], "per_pick"), 3);
  assert.equal(deriveBankTicketStatus("per_pick", ["won", "pending"]), "pending");
  assert.equal(deriveBankTicketStatus("per_pick", ["won", "lost", "pending"]), "lost");
  assert.equal(deriveBankTicketStatus("per_pick", ["void", "void"]), "void");
  assert.equal(deriveBankTicketStatus("combined", ["won", "void"]), "void");
  assert.equal(getEffectiveBankTicketOdds([2, 3], ["won", "void"], "combined"), null);
});

test("valida ticket multi-partido y calcula cuota por pronóstico a tres decimales", () => {
  const parsed = parseBankTicketDraft({
    oddsMode: "per_pick",
    stake: 10,
    totalOdds: null,
    legs: [
      { competition: "Premier League", homeTeam: "Man City", awayTeam: "Liverpool", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: "1.4" }, { market: "Corners", selection: "Más de 7.5", decimalOdds: "1.7" }] },
      { competition: "LaLiga", homeTeam: "Real Madrid", awayTeam: "Barcelona", picks: [{ market: "Ambos anotan", selection: "Sí", decimalOdds: "1.8" }] },
    ],
  });
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.draft.legs.length, 2);
  assert.equal(Math.round(parsed.draft.legs.flatMap((leg) => leg.picks).reduce((total, pick) => total * pick.decimalOdds, 1) * 1000) / 1000, 4.284);
});

test("valida modo cuota total e impide mezclar cuotas por pick", () => {
  const valid = parseBankTicketDraft({ oddsMode: "combined", stake: 10, totalOdds: 8.5, legs: [{ competition: "Premier League", homeTeam: "Man City", awayTeam: "Liverpool", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: null }] }] });
  assert.equal(valid.errors.length, 0);
  const invalid = parseBankTicketDraft({ oddsMode: "combined", stake: 10, totalOdds: 8.5, legs: [{ competition: "Premier League", homeTeam: "Man City", awayTeam: "Liverpool", picks: [{ market: "Goles", selection: "Más de 1.5", decimalOdds: 1.4 }] }] });
  assert.match(invalid.errors[0], /deja vacías/i);
});

test("rechaza ticket sin picks, equipos iguales y límites excedidos", () => {
  const empty = parseBankTicketDraft({ oddsMode: "combined", stake: 10, totalOdds: 2, legs: [] });
  assert.match(empty.errors[0], /entre 1 y 20 partidos/i);
  const overLimit = parseBankTicketDraft({ oddsMode: "per_pick", stake: 10, legs: Array.from({ length: 21 }, () => ({})) });
  assert.match(overLimit.errors[0], /entre 1 y 20/i);
});

test("valida montos y notas de aportes y retiros en servidor", () => {
  assert.equal(validateAdjustmentInput({ amount: 20, kind: "withdrawal", note: "Retiro" }).length, 0);
  assert.equal(validateAdjustmentInput({ amount: 0.001, kind: "transfer", note: "x".repeat(241) }).length, 3);
});

test("resume apuestas resueltas, anuladas y porcentaje de acierto", () => {
  const summary = calculateBankSummary(
    { initialCapital: 100, currency: "PEN" },
    [
      { stake: 20, decimalOdds: 2, status: "won" },
      { stake: 10, decimalOdds: 1.8, status: "lost" },
      { stake: 8, decimalOdds: 2, status: "void" },
      { stake: 15, decimalOdds: 3, status: "pending" },
    ],
    [],
  );
  assert.deepEqual(
    { totalBets: summary.totalBets, wonBets: summary.wonBets, lostBets: summary.lostBets, voidBets: summary.voidBets, winRatePercent: summary.winRatePercent },
    { totalBets: 4, wonBets: 1, lostBets: 1, voidBets: 1, winRatePercent: 50 },
  );
});
