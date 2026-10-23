import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const leagues = {
  bundesliga: "season-26_27-bundesliga.csv",
  "la-liga": "season-26_27-la-liga.csv",
  "ligue-1": "season-26_27-ligue-1.csv",
  "premier-league": "season-26_27-premier-league.csv",
  "serie-a": "season-26_27-serie-a.csv",
};
const requiredColumns = ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG"];

function usage() {
  console.log("Uso: npm run refresh:current -- --league <liga> --file <ruta-del-csv> [--dry-run]");
  console.log(`Ligas: ${Object.keys(leagues).join(", ")}`);
}

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

async function validateIncomingCsv(filePath) {
  if (extname(filePath).toLowerCase() !== ".csv") throw new Error("El archivo de entrada debe tener extensión .csv.");
  const file = await stat(filePath);
  if (!file.isFile()) throw new Error("La ruta de entrada no es un archivo.");
  const content = (await readFile(filePath, "utf8")).replace(/^\uFEFF/, "").trim();
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) throw new Error("El CSV debe incluir una cabecera y al menos una fila.");
  const columns = parseCsvLine(lines[0]);
  const missing = requiredColumns.filter((column) => !columns.includes(column));
  if (missing.length) throw new Error(`El CSV no contiene las columnas requeridas: ${missing.join(", ")}.`);
  return { rows: lines.length - 1, columns };
}

function run(command) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", command], { cwd: process.cwd(), stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Falló npm run ${command}.`);
}

const league = getArgument("--league");
const sourceArgument = getArgument("--file");
const dryRun = process.argv.includes("--dry-run");

if (process.argv.includes("--help") || !league || !sourceArgument) {
  usage();
  process.exitCode = process.argv.includes("--help") ? 0 : 1;
} else if (!leagues[league]) {
  usage();
  console.error(`Liga no admitida: ${league}`);
  process.exitCode = 1;
} else {
  const source = resolve(sourceArgument);
  const target = resolve(process.cwd(), "data", "raw", league, leagues[league]);
  const backupDirectory = resolve(process.cwd(), "data", "raw", league, "archive");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = join(backupDirectory, `${leagues[league].replace(/\.csv$/, "")}-${stamp}.csv`);
  let replaced = false;

  try {
    if (source === target) throw new Error("El CSV de entrada ya es el archivo actual; descarga uno nuevo en otra ubicación.");
    const incoming = await validateIncomingCsv(source);
    console.log(`${league}: CSV validado (${incoming.rows} filas).`);
    console.log(`Destino: ${target}`);
    if (dryRun) {
      console.log("Dry run correcto: no se reemplazó ningún archivo ni se ejecutó el pipeline.");
    } else {
      await mkdir(backupDirectory, { recursive: true });
      await copyFile(target, backup);
      await copyFile(source, target);
      replaced = true;
      console.log(`Respaldo creado: ${backup}`);
      console.log(`Temporada actual actualizada desde: ${basename(source)}`);
      for (const command of ["normalize:data", "validate:data", "validate:teams", "backtest", "test"]) run(command);
      console.log("Actualización semanal terminada: datos procesados, modelo recalibrado y pruebas aprobadas.");
    }
  } catch (error) {
    console.error(`Actualización cancelada: ${error instanceof Error ? error.message : "error desconocido"}`);
    if (replaced) {
      console.error("Restaurando el CSV anterior desde el respaldo...");
      await copyFile(backup, target);
      try {
        for (const command of ["normalize:data", "validate:data", "validate:teams", "backtest", "test"]) run(command);
        console.error("Restauración completada.");
      } catch {
        console.error("El CSV fue restaurado, pero la regeneración de archivos derivados requiere ejecución manual.");
      }
    }
    process.exitCode = 1;
  }
}
