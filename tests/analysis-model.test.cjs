/* eslint-disable @typescript-eslint/no-require-imports -- Node's native test runner loads this CJS bridge without extra dependencies. */
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
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
const { getLocalMatchDetailContext, getMatchRecentForms, getMatchSeasonStatistics, getLocalStandings, getHeadToHead } = require("../lib/match-detail.ts");
const { resolveTeamIdentity } = require("../lib/team-identity.ts");
const { getKnownTeamCrest } = require("../data/team-crests.ts");
const { getTeamVenue, resolveFixtureVenue } = require("../data/team-venues.ts");
const { getLocalVenuePhoto } = require("../lib/venue-photos.ts");
const aliasesByCompetition = require("../data/team-aliases.json");

const fixtures = [
  ["Premier League", "Manchester City FC", "Arsenal FC"],
  ["Serie A de Italia", "AC Milan", "Inter Milan"],
  ["LaLiga de España", "FC Barcelona", "Real Madrid CF"],
  ["Ligue 1 de Francia", "Paris Saint-Germain FC", "OGC Nice"],
  ["Bundesliga de Alemania", "VfB Stuttgart", "Borussia Monchengladbach"],
];

const detailFixtures = [
  ["Premier League", "Manchester City FC", "Arsenal FC", "Man City", "Arsenal"],
  ["Serie A de Italia", "AC Milan", "Inter Milan", "Milan", "Inter"],
  ["LaLiga de España", "FC Barcelona", "Real Madrid CF", "Barcelona", "Real Madrid"],
  ["Ligue 1 de Francia", "Paris Saint-Germain FC", "OGC Nice", "Paris SG", "Nice"],
  ["Bundesliga de Alemania", "VfB Stuttgart", "Borussia Monchengladbach", "Stuttgart", "M'gladbach"],
];

test("cada liga devuelve probabilidades y mercados matemáticamente coherentes", async () => {
  for (const [competition, home, away] of fixtures) {
    const analysis = await getLocalLeagueAnalysis(competition, home, away, "2026-10-24");
    assert.ok(analysis, `${competition} debe producir análisis local`);
    assert.equal(analysis.probabilities.home + analysis.probabilities.draw + analysis.probabilities.away, 100);
    assert.ok(analysis.markets.goals.over15 >= analysis.markets.goals.over25);
    assert.ok(analysis.markets.goals.over25 >= analysis.markets.goals.over35);
    assert.ok(analysis.markets.corners.over55 >= analysis.markets.corners.over65);
    assert.ok(analysis.markets.corners.over65 >= analysis.markets.corners.over75);
    assert.ok(analysis.markets.corners.over75 >= analysis.markets.corners.over85);
    assert.ok(analysis.markets.corners.over85 >= analysis.markets.corners.over95);
    assert.ok(analysis.markets.corners.over95 >= analysis.markets.corners.over105);
    assert.ok(analysis.markets.corners.over105 >= analysis.markets.corners.over115);
    assert.ok(analysis.markets.corners.over115 >= analysis.markets.corners.over125);
    assert.equal(analysis.markets.btts.yes + analysis.markets.btts.no, 100);
    assert.ok(analysis.over25Probability >= 0 && analysis.over25Probability <= 100);
    assert.ok(analysis.expectedGoals.total > 0);
    assert.ok(analysis.leagueBenchmarks.goalsPerMatch > 0);
    assert.ok(analysis.leagueBenchmarks.cornersPerMatch > 0);
    assert.ok(analysis.leagueBenchmarks.shotsOnTargetPerMatch > 0);
    assert.ok(analysis.leagueBenchmarks.goalsOver15 >= analysis.leagueBenchmarks.goalsOver25);
    assert.ok(analysis.leagueBenchmarks.bttsYes >= 0 && analysis.leagueBenchmarks.bttsYes <= 100);
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

test("el contrato de detalle conserva solo información disponible antes del fixture", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-10-24",
    homeTeam: "Aston Villa FC",
    awayTeam: "Manchester City FC",
  });

  assert.ok(context, "Premier League debe tener contexto local de detalle");
  assert.equal(context.source, "local-csv");
  assert.equal(context.fixture.home.canonicalName, "Aston Villa");
  assert.equal(context.fixture.away.canonicalName, "Man City");
  assert.equal(context.coverage.currentSeason, "2026/2027");
  assert.ok(context.historicalMatches.length >= 1_900);
  assert.ok(context.currentMatchesBeforeFixture.length >= 70);
  assert.ok(context.currentMatchesBeforeFixture.every((match) => match.date < "2026-10-24"));
  assert.ok(context.coverage.preMatchDataThrough);
  assert.ok(context.coverage.preMatchDataThrough < "2026-10-24");
});

test("el contrato de detalle rechaza competiciones o fechas no compatibles", async () => {
  assert.equal(await getLocalMatchDetailContext({
    competition: "Champions League",
    fixtureDate: "2026-10-24",
    homeTeam: "A",
    awayTeam: "B",
  }), null);
  assert.equal(await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "24-10-2026",
    homeTeam: "A",
    awayTeam: "B",
  }), null);
});

test("la forma reciente usa cinco resultados anteriores y resuelve los alias del fixture", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-10-24",
    homeTeam: "Aston Villa FC",
    awayTeam: "Manchester City FC",
  });
  assert.ok(context);

  const form = getMatchRecentForms(context);
  for (const teamForm of [form.home, form.away]) {
    assert.equal(teamForm.matches.length, 5);
    assert.equal(teamForm.record.played, 5);
    assert.equal(teamForm.record.wins + teamForm.record.draws + teamForm.record.losses, 5);
    assert.ok(teamForm.matches.every((match) => match.date < "2026-10-24"));
    assert.ok(teamForm.matches.every((match) => ["W", "D", "L"].includes(match.outcome)));
    assert.equal(teamForm.coverage, "current-only");
  }
  assert.equal(form.home.team, "Aston Villa");
  assert.equal(form.away.team, "Man City");
});

test("la forma reciente completa con historial cuando todavía no hay cinco partidos actuales", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-08-28",
    homeTeam: "Arsenal FC",
    awayTeam: "Coventry City FC",
  });
  assert.ok(context);
  const form = getMatchRecentForms(context);
  assert.equal(form.home.matches.length, 5);
  assert.equal(form.home.coverage, "current-and-historical");
  assert.ok(form.home.matches.every((match) => match.date < "2026-08-28"));
});

test("las estadísticas de temporada son locales, previas al fixture y no inventan métricas", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-10-24",
    homeTeam: "Aston Villa FC",
    awayTeam: "Manchester City FC",
  });
  assert.ok(context);
  const statistics = getMatchSeasonStatistics(context);

  for (const team of [statistics.home, statistics.away]) {
    assert.equal(team.season, "2026/2027");
    assert.equal(team.played, team.wins + team.draws + team.losses);
    assert.equal(team.points, team.wins * 3 + team.draws);
    assert.ok(team.played > 0);
    assert.ok(team.dataThrough && team.dataThrough < "2026-10-24");
    assert.ok(team.goalsPerGame != null);
    assert.ok(team.shotsFor == null || team.shotsFor.sample <= team.played);
    assert.ok(team.cornersFor == null || team.cornersFor.sample <= team.played);
  }
  assert.equal(statistics.home.team, "Aston Villa");
  assert.equal(statistics.away.team, "Man City");
});

test("el rendimiento local y visitante usa solo la condición correcta antes del fixture", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Serie A de Italia",
    fixtureDate: "2026-10-24",
    homeTeam: "Cagliari Calcio",
    awayTeam: "Bologna FC 1909",
  });
  assert.ok(context);
  const statistics = getMatchSeasonStatistics(context);
  const homeAtHome = statistics.home.homeRecord;
  const awayOnRoad = statistics.away.awayRecord;

  assert.equal(homeAtHome.team, "Cagliari");
  assert.equal(homeAtHome.venue, "home");
  assert.equal(awayOnRoad.team, "Bologna");
  assert.equal(awayOnRoad.venue, "away");
  for (const record of [homeAtHome, awayOnRoad]) {
    assert.equal(record.played, record.wins + record.draws + record.losses);
    assert.equal(record.points, record.wins * 3 + record.draws);
    assert.equal(record.matches.length, record.played);
    assert.ok(record.matches.every((match) => match.date < "2026-10-24"));
    assert.ok(record.matches.every((match) => match.venue === record.venue));
    assert.ok(record.dataThrough && record.dataThrough < "2026-10-24");
  }
  assert.equal(statistics.home.homeRecord.played + statistics.home.awayRecord.played, statistics.home.played);
  assert.equal(statistics.away.homeRecord.played + statistics.away.awayRecord.played, statistics.away.played);
});

test("la tabla local se calcula desde resultados previos y destaca a los dos equipos del fixture", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-10-24",
    homeTeam: "Aston Villa FC",
    awayTeam: "Manchester City FC",
  });
  assert.ok(context);
  const standings = getLocalStandings(context);

  assert.equal(standings.season, "2026/2027");
  assert.equal(standings.rows.length, 20);
  assert.equal(standings.tieBreakRule, "points-goal-difference-goals-for-wins-alphabetical");
  assert.ok(standings.dataThrough && standings.dataThrough < "2026-10-24");
  assert.deepEqual(standings.rows.map((row) => row.position), Array.from({ length: 20 }, (_, index) => index + 1));
  for (const row of standings.rows) {
    assert.equal(row.played, row.wins + row.draws + row.losses);
    assert.equal(row.points, row.wins * 3 + row.draws);
    assert.equal(row.goalDifference, row.goalsFor - row.goalsAgainst);
    assert.ok(row.form.length <= 5);
  }
  assert.deepEqual(standings.rows.filter((row) => row.isFixtureTeam).map((row) => row.team).sort(), ["Aston Villa", "Man City"]);
});

test("el H2H reúne solo enfrentamientos directos previos, balance y últimos resultados", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-10-24",
    homeTeam: "Aston Villa FC",
    awayTeam: "Manchester City FC",
  });
  assert.ok(context);
  const h2h = getHeadToHead(context);

  assert.equal(h2h.homeTeam, "Aston Villa");
  assert.equal(h2h.awayTeam, "Man City");
  assert.ok(h2h.totalMatches > 0);
  assert.equal(h2h.homeWins + h2h.draws + h2h.awayWins, h2h.totalMatches);
  assert.equal(h2h.recentMatches.length, Math.min(5, h2h.totalMatches));
  assert.ok(h2h.matches.every((match) => match.date < "2026-10-24"));
  assert.ok(h2h.matches.every((match) => (
    (match.homeTeam === "Aston Villa" && match.awayTeam === "Man City")
    || (match.homeTeam === "Man City" && match.awayTeam === "Aston Villa")
  )));
  assert.equal(h2h.homeGoals + h2h.awayGoals, h2h.matches.reduce((sum, match) => sum + match.homeGoals + match.awayGoals, 0));
});

test("el detalle conserva identidad, corte temporal y tabla coherente en las cinco ligas", async () => {
  for (const [competition, homeName, awayName, canonicalHome, canonicalAway] of detailFixtures) {
    const context = await getLocalMatchDetailContext({
      competition,
      fixtureDate: "2026-10-24",
      homeTeam: homeName,
      awayTeam: awayName,
    });
    assert.ok(context, `${competition}: debe crear contexto de detalle`);
    assert.equal(context.fixture.home.canonicalName, canonicalHome, `${competition}: alias local`);
    assert.equal(context.fixture.away.canonicalName, canonicalAway, `${competition}: alias visitante`);
    assert.notEqual(context.fixture.home.source, "unmatched", `${competition}: local no resuelto`);
    assert.notEqual(context.fixture.away.source, "unmatched", `${competition}: visitante no resuelto`);
    assert.ok(context.currentMatchesBeforeFixture.every((match) => match.date < "2026-10-24"));

    const forms = getMatchRecentForms(context);
    const statistics = getMatchSeasonStatistics(context);
    const standings = getLocalStandings(context);
    const h2h = getHeadToHead(context);
    for (const form of [forms.home, forms.away]) {
      assert.ok(form.matches.every((match) => match.date < "2026-10-24"));
      assert.equal(form.record.played, form.record.wins + form.record.draws + form.record.losses);
    }
    for (const team of [statistics.home, statistics.away]) {
      assert.equal(team.played, team.wins + team.draws + team.losses);
      assert.equal(team.points, team.wins * 3 + team.draws);
    }
    for (const row of standings.rows) {
      assert.equal(row.played, row.wins + row.draws + row.losses);
      assert.equal(row.points, row.wins * 3 + row.draws);
    }
    assert.equal(standings.rows.filter((row) => row.isFixtureTeam).length, 2);
    assert.ok(h2h.matches.every((match) => match.date < "2026-10-24"));
  }
});

test("los equipos actuales sin historial pueden resolverse por alias y conservar sus datos de temporada", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Premier League",
    fixtureDate: "2026-10-24",
    homeTeam: "Coventry City FC",
    awayTeam: "Hull City AFC",
  });
  assert.ok(context);
  assert.equal(context.fixture.home.canonicalName, "Coventry");
  assert.equal(context.fixture.away.canonicalName, "Hull");
  assert.equal(context.fixture.home.source, "alias");
  assert.equal(context.fixture.away.source, "alias");
  const statistics = getMatchSeasonStatistics(context);
  assert.ok(statistics.home.played > 0);
  assert.ok(statistics.away.played > 0);
});

test("SSC Napoli se normaliza a Napoli y conserva sus estadísticas actuales", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Serie A de Italia",
    fixtureDate: "2026-10-24",
    homeTeam: "SSC Napoli",
    awayTeam: "AS Roma",
  });
  assert.ok(context);
  assert.equal(context.fixture.home.canonicalName, "Napoli");
  assert.equal(context.fixture.home.source, "alias");

  const statistics = getMatchSeasonStatistics(context);
  assert.ok(statistics.home.played > 0);
  assert.ok(statistics.home.goalsFor > 0);
});

test("cada alias configurado resuelve exactamente a un equipo presente en los datasets locales", () => {
  const directories = {
    Bundesliga: "bundesliga",
    LaLiga: "la-liga",
    "Ligue 1": "ligue-1",
    "Premier League": "premier-league",
    "Serie A": "serie-a",
  };

  for (const [competition, directory] of Object.entries(directories)) {
    const historical = JSON.parse(readFileSync(`data/processed/${directory}/historical-matches.json`, "utf8"));
    const current = JSON.parse(readFileSync(`data/processed/${directory}/current-season-matches.json`, "utf8"));
    const knownTeams = new Set([...historical, ...current].flatMap((match) => [match.homeTeam, match.awayTeam]));

    for (const [canonicalName, variants] of Object.entries(aliasesByCompetition[competition])) {
      for (const variant of variants) {
        const identity = resolveTeamIdentity(competition, variant, knownTeams);
        assert.equal(identity.canonicalName, canonicalName, `${competition}: ${variant} debe resolver a ${canonicalName}`);
        assert.notEqual(identity.source, "unmatched", `${competition}: ${variant} no puede quedar sin identidad`);
      }
    }
  }
});

test("todos los equipos de la temporada actual tienen un escudo local de respaldo", () => {
  const directories = ["bundesliga", "la-liga", "ligue-1", "premier-league", "serie-a"];

  for (const directory of directories) {
    const current = JSON.parse(readFileSync(`data/processed/${directory}/current-season-matches.json`, "utf8"));
    const teams = new Set(current.flatMap((match) => [match.homeTeam, match.awayTeam]));
    for (const team of teams) {
      assert.match(
        getKnownTeamCrest(team) ?? "",
        /^https:\/\/crests\.football-data\.org\/[\w.-]+$/,
        `${directory}: ${team} debe tener un escudo de respaldo`,
      );
    }
  }
});

test("todos los equipos de la temporada actual tienen un estadio local configurado", () => {
  const directories = {
    Bundesliga: "bundesliga",
    LaLiga: "la-liga",
    "Ligue 1": "ligue-1",
    "Premier League": "premier-league",
    "Serie A": "serie-a",
  };

  for (const [competition, directory] of Object.entries(directories)) {
    const current = JSON.parse(readFileSync(`data/processed/${directory}/current-season-matches.json`, "utf8"));
    const teams = new Set(current.flatMap((match) => [match.homeTeam, match.awayTeam]));
    for (const team of teams) {
      const venue = getTeamVenue(competition, team);
      assert.ok(venue?.stadium, `${competition}: ${team} debe tener estadio`);
      assert.ok(venue?.city, `${competition}: ${team} debe tener ciudad`);
    }
  }
});

test("el estadio local reemplaza solo los marcadores vacíos de la fuente", () => {
  assert.equal(resolveFixtureVenue("Serie A de Italia", "SSC Napoli", "Estadio por confirmar"), "Stadio Diego Armando Maradona");
  assert.equal(resolveFixtureVenue("Premier League", "Arsenal FC", "Emirates Stadium"), "Emirates Stadium");
});

test("Serie A usa las fotografías locales de estadio para todos sus equipos actuales", () => {
  const expected = ["Atalanta", "Bologna", "Cagliari", "Como", "Fiorentina", "Frosinone", "Genoa", "Inter", "Juventus", "Lazio", "Lecce", "Milan", "Monza", "Napoli", "Parma", "Roma", "Sassuolo", "Torino", "Udinese", "Venezia"];
  for (const team of expected) {
    assert.ok(getLocalVenuePhoto("Serie A de Italia", team)?.imageUrl, `${team} debe contar con imagen local`);
  }
});

test("Premier League usa archivos locales existentes para todos los equipos actuales", () => {
  const current = JSON.parse(readFileSync("data/processed/premier-league/current-season-matches.json", "utf8"));
  const teams = new Set(current.flatMap((match) => [match.homeTeam, match.awayTeam]));
  assert.equal(teams.size, 20);
  for (const team of teams) {
    const photo = getLocalVenuePhoto("Premier League", team);
    assert.ok(photo?.imageUrl.startsWith("/stadiums/premier-league/"), `${team} debe contar con imagen local`);
    assert.ok(existsSync(`public${photo.imageUrl}`), `${team}: falta ${photo.imageUrl}`);
  }
});

test("LaLiga usa archivos locales existentes para todos los equipos actuales", () => {
  const current = JSON.parse(readFileSync("data/processed/la-liga/current-season-matches.json", "utf8"));
  const teams = new Set(current.flatMap((match) => [match.homeTeam, match.awayTeam]));
  assert.equal(teams.size, 20);
  for (const team of teams) {
    const photo = getLocalVenuePhoto("LaLiga de España", team);
    assert.ok(photo?.imageUrl.startsWith("/stadiums/la-liga/"), `${team} debe contar con imagen local`);
    assert.ok(existsSync(`public${photo.imageUrl}`), `${team}: falta ${photo.imageUrl}`);
  }
});

test("Ligue 1 usa archivos locales existentes para todos los equipos actuales", () => {
  const current = JSON.parse(readFileSync("data/processed/ligue-1/current-season-matches.json", "utf8"));
  const teams = new Set(current.flatMap((match) => [match.homeTeam, match.awayTeam]));
  assert.equal(teams.size, 18);
  for (const team of teams) {
    const photo = getLocalVenuePhoto("Ligue 1 de Francia", team);
    assert.ok(photo?.imageUrl.startsWith("/stadiums/ligue-1/"), `${team} debe contar con imagen local`);
    assert.ok(existsSync(`public${photo.imageUrl}`), `${team}: falta ${photo.imageUrl}`);
  }
});

test("Eintracht Frankfurt resuelve a Ein Frankfurt y conserva estadísticas actuales", async () => {
  const context = await getLocalMatchDetailContext({
    competition: "Bundesliga de Alemania",
    fixtureDate: "2026-10-24",
    homeTeam: "Borussia Dortmund",
    awayTeam: "Eintracht Frankfurt",
  });
  assert.ok(context);
  assert.equal(context.fixture.away.canonicalName, "Ein Frankfurt");
  assert.equal(context.fixture.away.source, "alias");

  const statistics = getMatchSeasonStatistics(context);
  assert.ok(statistics.away.played > 0);
  assert.ok(statistics.away.goalsFor > 0);
});

test("la lectura prepartido completa no filtra resultados futuros en Aston Villa–Man City y una muestra de cada liga", async () => {
  const finalFixtures = [
    ["Premier League", "Aston Villa FC", "Manchester City FC"],
    ["Serie A de Italia", "AC Milan", "Inter Milan"],
    ["LaLiga de España", "FC Barcelona", "Real Madrid CF"],
    ["Ligue 1 de Francia", "Paris Saint-Germain FC", "OGC Nice"],
    ["Bundesliga de Alemania", "VfB Stuttgart", "Borussia Monchengladbach"],
  ];
  const fixtureDate = "2026-10-24";

  for (const [competition, homeTeam, awayTeam] of finalFixtures) {
    const [context, analysis] = await Promise.all([
      getLocalMatchDetailContext({ competition, fixtureDate, homeTeam, awayTeam }),
      getLocalLeagueAnalysis(competition, homeTeam, awayTeam, fixtureDate),
    ]);
    assert.ok(context, `${competition}: contexto local disponible`);
    assert.ok(analysis, `${competition}: predicción local disponible`);
    assert.equal(analysis.probabilities.home + analysis.probabilities.draw + analysis.probabilities.away, 100, `${competition}: 1X2 suma 100`);
    assert.ok(context.currentMatchesBeforeFixture.every((match) => match.date < fixtureDate), `${competition}: resultados actuales estrictamente previos`);

    const forms = getMatchRecentForms(context);
    const statistics = getMatchSeasonStatistics(context);
    const standings = getLocalStandings(context);
    const h2h = getHeadToHead(context);
    for (const form of [forms.home, forms.away]) assert.ok(form.matches.every((match) => match.date < fixtureDate), `${competition}: forma sin futuro`);
    for (const team of [statistics.home, statistics.away]) assert.ok(!team.dataThrough || team.dataThrough < fixtureDate, `${competition}: estadísticas sin futuro`);
    assert.ok(!standings.dataThrough || standings.dataThrough < fixtureDate, `${competition}: tabla sin futuro`);
    assert.ok(h2h.matches.every((match) => match.date < fixtureDate), `${competition}: H2H sin futuro`);
  }
});
