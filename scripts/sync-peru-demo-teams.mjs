import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const envPath = resolve(".env.local");
const env = existsSync(envPath) ? await readFile(envPath, "utf8") : "";
const apiKey = /^API_FOOTBALL_KEY=(.+)$/m.exec(env)?.[1]?.trim();
if (!apiKey) throw new Error("Falta API_FOOTBALL_KEY en .env.local.");

const requestedNames = ["Alianza Lima", "Sporting Cristal"];
const teams = await Promise.all(requestedNames.map(async (name) => {
  const url = new URL("https://v3.football.api-sports.io/teams");
  url.searchParams.set("search", name);
  const response = await fetch(url, { headers: { "x-apisports-key": apiKey } });
  const body = await response.json();
  if (!response.ok || Object.keys(body.errors ?? {}).length) {
    throw new Error(`API-Football: ${JSON.stringify(body.errors ?? response.status)}`);
  }
  const entry = body.response?.find((item) => item.team?.name === name);
  if (!entry?.team?.id || !entry.team.logo) throw new Error(`No se encontró ${name}.`);
  return entry.team;
}));

const outputDirectory = resolve("public/teams");
await mkdir(outputDirectory, { recursive: true });
for (const team of teams) {
  const logoResponse = await fetch(team.logo);
  if (!logoResponse.ok) throw new Error(`No se pudo descargar ${team.name}: HTTP ${logoResponse.status}`);
  await writeFile(resolve(outputDirectory, `${team.id}.png`), Buffer.from(await logoResponse.arrayBuffer()));
  console.log(`${team.name}: ${team.id}`);
}
