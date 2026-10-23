import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Add IDs only after reading them from API-Football fixture.teams.*.id.
const teams = [505, 497, 42, 49];
const outputDirectory = resolve("public/teams");

await mkdir(outputDirectory, { recursive: true });

for (const teamId of teams) {
  const url = `https://media.api-sports.io/football/teams/${teamId}.png`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar escudo ${teamId}: HTTP ${response.status}`);
  await writeFile(resolve(outputDirectory, `${teamId}.png`), Buffer.from(await response.arrayBuffer()));
  console.log(`Cacheado: ${teamId}`);
}
