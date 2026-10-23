/* eslint-disable @typescript-eslint/no-require-imports -- Node's native test runner loads this CJS bridge without extra dependencies. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const typescript = require("typescript");

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

const { getLocalLeagueAnalysis } = require("../lib/league-analysis.ts");

const fixtures = [
  ["Premier League", "Manchester City FC", "Arsenal FC"],
  ["Serie A de Italia", "AC Milan", "Inter Milan"],
  ["LaLiga de España", "FC Barcelona", "Real Madrid CF"],
  ["Ligue 1 de Francia", "Paris Saint-Germain FC", "OGC Nice"],
  ["Bundesliga de Alemania", "VfB Stuttgart", "Borussia Monchengladbach"],
];

test("cada liga devuelve probabilidades y mercados matemáticamente coherentes", async () => {
  for (const [competition, home, away] of fixtures) {
    const analysis = await getLocalLeagueAnalysis(competition, home, away, "2026-10-24");
    assert.ok(analysis, `${competition} debe producir análisis local`);
    assert.equal(analysis.probabilities.home + analysis.probabilities.draw + analysis.probabilities.away, 100);
    assert.ok(analysis.markets.goals.over15 >= analysis.markets.goals.over25);
    assert.ok(analysis.markets.goals.over25 >= analysis.markets.goals.over35);
    assert.equal(analysis.markets.btts.yes + analysis.markets.btts.no, 100);
    assert.ok(analysis.over25Probability >= 0 && analysis.over25Probability <= 100);
    assert.ok(analysis.expectedGoals.total > 0);
    assert.equal(analysis.calibration.applied, true);
  }
});

test("la temporada actual no se usa antes de que se hayan jugado sus partidos", async () => {
  for (const [competition, home, away] of fixtures) {
    const analysis = await getLocalLeagueAnalysis(competition, home, away, "2026-08-01");
    assert.ok(analysis, `${competition} debe conservar el análisis histórico`);
    assert.equal(analysis.currentSeasonHomeSample, 0, `${competition}: no debe usar partidos posteriores como local`);
    assert.equal(analysis.currentSeasonAwaySample, 0, `${competition}: no debe usar partidos posteriores como visitante`);
  }
});

test("los mapas de calibración son monótonos y permanecen dentro de 0–1", () => {
  const document = JSON.parse(readFileSync("data/processed/calibration-model.json", "utf8"));
  for (const [slug, league] of Object.entries(document.leagues)) {
    const maps = [
      ...Object.values(league.result1X2),
      league.goalsOver25,
      league.bttsYes,
      league.cornersOver85,
      league.shotsTotalOver75,
    ].filter(Boolean);
    for (const map of maps) {
      for (let index = 0; index < map.bins.length; index += 1) {
        const rate = map.bins[index].calibratedRate;
        assert.ok(rate >= 0 && rate <= 1, `${slug}: tasa fuera de rango`);
        if (index > 0) assert.ok(map.bins[index - 1].calibratedRate <= rate, `${slug}: calibración no monótona`);
      }
    }
  }
});
