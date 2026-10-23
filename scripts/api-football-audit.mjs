import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_BASE_URL = "https://v3.football.api-sports.io";
const MAX_REQUESTS = 6;
const SEASON = 2024;
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const REPORT_PATH = path.join(PROJECT_ROOT, "docs", "api-audit-followup.md");
const COMPETITIONS = [
  ["Liga 1 de Perú", 286],
  ["Serie A de Italia", 135],
];

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

async function loadApiKey() {
  const fileValues = existsSync(ENV_PATH)
    ? parseEnv(await readFile(ENV_PATH, "utf8"))
    : {};
  return process.env.API_FOOTBALL_KEY || fileValues.API_FOOTBALL_KEY || "";
}

function md(value) {
  return String(value ?? "—")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function bodyErrors(body) {
  return body?.errors && Object.keys(body.errors).length > 0 ? body.errors : null;
}

function classify(value, available) {
  if (!available) return "missing";
  if (value === null) return "null";
  if (value === 0) return "zero";
  return "available";
}

function extractStats(response) {
  const fields = new Map();
  for (const team of Array.isArray(response) ? response : []) {
    for (const item of team.statistics || []) {
      fields.set(item.type, {
        team: team.team?.name,
        value: item.value,
        status: classify(item.value, item.value !== undefined),
      });
    }
  }
  return ["Goals", "Corner Kicks", "Shots on Goal"].map((type) => ({
    type,
    ...(fields.get(type) || { status: "missing" }),
  }));
}

async function main() {
  const startedAt = new Date().toISOString();
  const plan = [
    "1. Consultar /fixtures para Liga 1 de Perú (league=286, season=2024, status=FT, page=1).",
    "2. Si hay un fixture finalizado, consultar /fixtures/statistics una sola vez.",
    "3. Solo si Perú no devuelve error de plan y quedan llamadas, repetir para Serie A (league=135).",
    "4. Límite estructural: 2 competiciones × (1 fixtures + 1 statistics) = 4 llamadas; máximo permitido 6.",
  ];
  console.log("API audit follow-up plan:");
  for (const line of plan) console.log(line);

  const key = await loadApiKey();
  const report = [
    "# Seguimiento de auditoría de API-Football",
    "",
    `- Fecha de ejecución: ${startedAt}`,
    `- Límite duro: ${MAX_REQUESTS} solicitudes nuevas`,
    "- Clave: no se muestra ni se registra",
    "",
    "## Plan ejecutado",
    "",
    ...plan.map((line) => `- ${line}`),
    "",
  ];

  if (!key) {
    report.push(
      "## Resultado",
      "",
      "**No se realizaron solicitudes.** Falta `API_FOOTBALL_KEY` en el entorno y no se encontró `.env.local`.",
      "",
      "Añade la clave localmente y ejecuta `node scripts/api-football-audit.mjs`.",
    );
    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${report.join("\n")}\n`, "utf8");
    console.log(`No API calls made. Report written to ${REPORT_PATH}.`);
    return;
  }

  let requestCount = 0;
  const call = async (path, params) => {
    if (requestCount >= MAX_REQUESTS) {
      throw new Error(`Hard request limit reached (${MAX_REQUESTS})`);
    }
    requestCount += 1;
    const url = new URL(`${API_BASE_URL}${path}`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    try {
      const response = await fetch(url, { headers: { "x-apisports-key": key } });
      const body = await response.json();
      return { httpStatus: response.status, body, errors: bodyErrors(body) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  };

  const fixtures = [];
  const statistics = [];
  for (const [name, id] of COMPETITIONS) {
    const result = await call("/fixtures", {
      league: id,
      season: SEASON,
      status: "FT",
      page: 1,
    });
    const response = Array.isArray(result.body?.response) ? result.body.response : [];
    const fixture = response.find((item) => item.fixture?.status?.short === "FT");
    fixtures.push({ name, id, ...result, responseCount: response.length, fixture });

    if (result.errors) {
      report.push(
        "## Detención",
        "",
        `La consulta de ${name} devolvió un error incluido en JSON. Se detuvo la prueba y no se consumieron más llamadas.`,
        "",
      );
      break;
    }
    if (!fixture?.fixture?.id) continue;

    const statsResult = await call("/fixtures/statistics", {
      fixture: fixture.fixture.id,
    });
    statistics.push({
      name,
      fixtureId: fixture.fixture.id,
      ...statsResult,
      fields: extractStats(statsResult.body?.response),
    });
  }

  report.push("## Resultado");
  report.push("");
  report.push(`- Solicitudes realizadas: **${requestCount}/${MAX_REQUESTS}**`);
  report.push("- `/leagues` consultado: **no**");
  report.push("- Parámetros prohibidos (`last`, `next`): **no usados**");
  report.push("");
  report.push("## Fixtures");
  report.push("");
  report.push("| Competición | ID | Temporada | HTTP | Respuesta | Fixture FT | Partido | Goles | Error JSON |");
  report.push("|---|---:|---:|---:|---:|---|---|---|---|");
  for (const item of fixtures) {
    const fixture = item.fixture;
    report.push(`| ${md(item.name)} | ${item.id} | ${SEASON} | ${item.httpStatus ?? "—"} | ${item.responseCount ?? "—"} | ${fixture ? "sí" : "no"} | ${md(fixture ? `${fixture.teams?.home?.name} - ${fixture.teams?.away?.name}` : "")} | ${md(JSON.stringify(fixture?.goals))} | ${md(JSON.stringify(item.errors || item.error || ""))} |`);
  }
  report.push("");
  report.push("## Estadísticas de partido");
  report.push("");
  report.push("| Competición | Fixture | HTTP | Campo | Equipo | Valor | Clasificación | Error JSON |");
  report.push("|---|---:|---:|---|---|---|---|---|");
  for (const item of statistics) {
    for (const field of item.fields) {
      report.push(`| ${md(item.name)} | ${item.fixtureId} | ${item.httpStatus ?? "—"} | ${field.type} | ${md(field.team)} | ${md(field.value)} | ${field.status} | ${md(JSON.stringify(item.errors || item.error || ""))} |`);
    }
  }
  report.push("");
  report.push("## Interpretación");
  report.push("");
  report.push("- `available`: el proveedor devolvió un valor.");
  report.push("- `missing`: el campo no apareció en la respuesta.");
  report.push("- `null`: el proveedor devolvió explícitamente `null`.");
  report.push("- `zero`: el proveedor devolvió numéricamente `0`.");
  report.push("- Un HTTP 200 con `errors` en JSON no se considera acceso válido al dato.");
  report.push("- Los goles se leen de `fixtures.goals`; córneres y tiros a puerta se leen de `fixtures/statistics`.");

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${report.join("\n")}\n`, "utf8");
  console.log(`API calls made: ${requestCount}/${MAX_REQUESTS}. Report written to ${REPORT_PATH}.`);
}

main().catch(async (error) => {
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `# Seguimiento de auditoría de API-Football\n\nError del diagnóstico: ${error.message}\n`, "utf8");
  console.error(error.message);
  process.exitCode = 1;
});
