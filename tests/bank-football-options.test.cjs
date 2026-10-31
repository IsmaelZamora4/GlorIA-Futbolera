/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads the TypeScript options service. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const typescript = require("typescript");

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  const resolvedRequest = request.startsWith("@/") ? path.join(__dirname, "..", request.slice(2)) : request;
  return resolveFilename.call(this, resolvedRequest, parent, isMain, options);
};

require.extensions[".ts"] = (module, fileName) => {
  const source = readFileSync(fileName, "utf8");
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      resolveJsonModule: true,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(compiled, fileName);
};

const { getBankFootballOptions, resolveBankFootballEvent } = require("../features/bank/services/football-options.ts");

test("las opciones del Bank muestran las cinco ligas con equipos actuales y escudo", async () => {
  const options = await getBankFootballOptions();
  assert.deepEqual(options.map(({ id }) => id), ["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"]);
  for (const competition of options) {
    assert.ok(competition.teams.length > 0, `${competition.name} debe tener equipos`);
    assert.ok(competition.teams.every((team) => team.crest.startsWith("https://crests.football-data.org/")), `${competition.name}: cada equipo tiene escudo`);
  }
  assert.ok(options.find((item) => item.id === "premier-league").teams.some((team) => team.name === "Brighton"));
});

test("el evento se deriva de liga y equipos válidos y rechaza un mismo equipo", async () => {
  assert.deepEqual(await resolveBankFootballEvent("premier-league", "Man City", "Brighton"), {
    event: "Premier League · Man City vs Brighton",
  });
  assert.match((await resolveBankFootballEvent("premier-league", "Man City", "Man City")).error, /distintos/i);
  assert.match((await resolveBankFootballEvent("premier-league", "Man City", "Barcelona")).error, /no pertenecen/i);
  assert.match((await resolveBankFootballEvent("unknown", "Man City", "Brighton")).error, /competición/i);
});
