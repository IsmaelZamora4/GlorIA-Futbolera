/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads the TypeScript domain module. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const typescript = require("typescript");

require.extensions[".ts"] = (module, fileName) => {
  const compiled = typescript.transpileModule(readFileSync(fileName, "utf8"), { compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 } }).outputText;
  module._compile(compiled, fileName);
};

const { calculateBankSummary, calculateBetProfit, validateBankInput, validateBetInput } = require("../features/bank/services/calculations.ts");

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
  assert.deepEqual(summary, { capitalTotal: 150, pendingAmount: 15, availableBalance: 135, netProfit: 10, yieldPercent: 33.33, resolvedStake: 30 });
});

test("devuelve Sin datos mediante yield nulo cuando no hay apuestas resueltas", () => {
  assert.equal(calculateBankSummary({ initialCapital: 100, currency: "EUR" }, [{ stake: 5, decimalOdds: 2, status: "pending" }], []).yieldPercent, null);
});

test("valida moneda, capital, importe y cuota", () => {
  assert.deepEqual(validateBankInput({ initialCapital: -1, currency: "GBP" }).length, 2);
  assert.equal(validateBetInput({ stake: 0, decimalOdds: 1 }).length, 2);
  assert.equal(validateBetInput({ stake: 5, decimalOdds: 1.5 }).length, 0);
});
