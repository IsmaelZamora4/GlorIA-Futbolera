/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads the TypeScript domain module. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const typescript = require("typescript");

require.extensions[".ts"] = (module, fileName) => {
  const compiled = typescript.transpileModule(readFileSync(fileName, "utf8"), { compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 } }).outputText;
  module._compile(compiled, fileName);
};

const { calculateBankSummary, calculateBetProfit, validateAdjustmentInput, validateBankInput, validateBetDetails, validateBetInput } = require("../features/bank/services/calculations.ts");

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
