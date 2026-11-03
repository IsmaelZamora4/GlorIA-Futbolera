import { resolve } from "node:path";
import { downloadTeamLogo, assertPositiveTeamId } from "./team-logo-safety.mjs";

// Add IDs only after reading them from API-Football fixture.teams.*.id.
const teams = [505, 497, 42, 49];
const outputDirectory = resolve("public/teams");

for (const teamId of teams) {
  assertPositiveTeamId(teamId);
  const url = `https://media.api-sports.io/football/teams/${teamId}.png`;
  await downloadTeamLogo(teamId, url, outputDirectory);
  console.log(`Cacheado: ${teamId}`);
}
