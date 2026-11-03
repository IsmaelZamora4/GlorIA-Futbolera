import { constants } from "node:fs";
import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";

const logoOrigin = "https://media.api-sports.io";

export function assertPositiveTeamId(teamId) {
  if (!Number.isSafeInteger(teamId) || teamId <= 0) throw new Error("El ID del equipo debe ser un entero positivo.");
  return teamId;
}

export function validateTeamLogoUrl(value, teamId) {
  assertPositiveTeamId(teamId);
  let url;
  try { url = new URL(value); } catch { throw new Error("La URL del escudo no es válida."); }
  if (url.origin !== logoOrigin || url.pathname !== `/football/teams/${teamId}.png` || url.search || url.hash || url.username || url.password) {
    throw new Error("La URL del escudo no pertenece al recurso permitido de API-Football.");
  }
  return url;
}

export async function downloadTeamLogo(teamId, logoUrl, outputDirectory, fetchImpl = fetch) {
  assertPositiveTeamId(teamId);
  const url = validateTeamLogoUrl(logoUrl, teamId);
  const directory = path.resolve(outputDirectory);
  await mkdir(directory, { recursive: true });
  const directoryInfo = await lstat(directory);
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink() || await realpath(directory) !== directory) {
    throw new Error("El directorio de logos no es una carpeta local segura.");
  }
  const filePath = path.resolve(directory, `${teamId}.png`);
  if (path.dirname(filePath) !== directory) throw new Error("La ruta del escudo sale del directorio permitido.");

  const response = await fetchImpl(url, { redirect: "error" });
  if (!response.ok) throw new Error(`No se pudo descargar escudo ${teamId}: HTTP ${response.status}`);

  let temporaryPath;
  let committed = false;
  try {
    // Recheck after the network wait: outputDirectory may have been replaced
    // while fetch was pending. A unique O_EXCL temp file never follows a link.
    const currentDirectory = await lstat(directory);
    if (!currentDirectory.isDirectory() || currentDirectory.isSymbolicLink() || await realpath(directory) !== directory) {
      throw new Error("El directorio de logos cambió durante la descarga.");
    }

    temporaryPath = path.join(directory, `.${teamId}.${randomUUID()}.tmp`);
    const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0);
    const file = await open(temporaryPath, flags, 0o644);
    try {
      const info = await file.stat();
      if (!info.isFile()) throw new Error("El archivo temporal del escudo no es regular.");
      await file.writeFile(Buffer.from(await response.arrayBuffer()));
    } finally {
      await file.close();
    }

    // Reject a preexisting link. rename replaces the destination directory
    // entry atomically; it does not open/follow a destination symlink.
    try {
      const destination = await lstat(filePath);
      if (destination.isSymbolicLink() || !destination.isFile()) {
        throw new Error("El destino del escudo no es un archivo regular.");
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const beforeCommit = await lstat(directory);
    if (!beforeCommit.isDirectory() || beforeCommit.isSymbolicLink() || await realpath(directory) !== directory) {
      throw new Error("El directorio de logos cambió antes de guardar el archivo.");
    }
    await rename(temporaryPath, filePath);
    committed = true;
  } finally {
    if (!committed && temporaryPath) {
      // Do not traverse the output path for cleanup if it no longer resolves
      // to the checked directory.
      try {
        if (await realpath(directory) === directory) await unlink(temporaryPath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }
}
