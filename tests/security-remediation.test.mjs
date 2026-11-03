import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { boundFixtureDateRange } from "../features/fixtures/services/football-data.ts";
import { BoundedTtlCache } from "../features/fixtures/services/bounded-ttl-cache.mjs";
import { removeAvatarObjectThenUnlink, safelyRemoveAvatarObject } from "../features/auth/services/avatar-removal.ts";
import { parseSignupInput, performSignupWithoutEnumeration, safeSignupFailureStatus, signupFeedback } from "../features/auth/services/signup-feedback.ts";
import { assertPositiveTeamId, downloadTeamLogo, validateTeamLogoUrl } from "../scripts/team-logo-safety.mjs";

test("acota fechas futuras a 30 días y conserva los rangos históricos", () => {
  const today = new Date("2026-11-02T12:00:00Z");
  assert.deepEqual(boundFixtureDateRange("2026-11-02", "2026-12-15", today), {
    dateFrom: "2026-11-02", dateTo: "2026-12-02",
  });
  assert.deepEqual(boundFixtureDateRange("2024-01-01", "2024-01-31", today), {
    dateFrom: "2024-01-01", dateTo: "2024-01-31",
  });
  assert.throws(() => boundFixtureDateRange("2026-12-03", "2026-12-05", today), /próximos 30 días/);
  assert.throws(() => boundFixtureDateRange("2026-02-30", "2026-03-01", today), /no es válido/);
});

test("caché conserva TTL, depura entradas vencidas y limita el máximo de claves", () => {
  const cache = new BoundedTtlCache(2, 10);
  cache.set("old", 1, 0);
  cache.set("current", 2, 5);
  assert.equal(cache.get("old", 10), undefined);
  cache.set("a", 3, 11);
  cache.set("b", 4, 12);
  cache.set("c", 5, 13);
  assert.equal(cache.get("a", 13), undefined);
  assert.equal(cache.get("b", 13), 4);
  assert.equal(cache.get("c", 13), 5);
});

test("quitar avatar distingue fallo de Storage, fallo parcial y éxito", async () => {
  let profileUnlinked = false;
  const storageFailure = await removeAvatarObjectThenUnlink("user/avatar.png", async () => false, async () => {
    profileUnlinked = true; return true;
  });
  assert.deepEqual(storageFailure, { removed: false, unlinked: false });
  assert.equal(profileUnlinked, false);

  const partial = await removeAvatarObjectThenUnlink("user/avatar.png", async () => true, async () => false);
  assert.deepEqual(partial, { removed: true, unlinked: false });

  const success = await removeAvatarObjectThenUnlink(null, async () => true, async () => true);
  assert.deepEqual(success, { removed: false, unlinked: true });
});

test("quitar avatar convierte excepciones en fallo claro o eliminación parcial", async () => {
  assert.equal(await safelyRemoveAvatarObject(async () => { throw new Error("storage detail must not escape"); }), false);
  assert.equal(await safelyRemoveAvatarObject(async () => false), false);
  assert.equal(await safelyRemoveAvatarObject(async () => true), true);

  const storageFailure = await removeAvatarObjectThenUnlink("user/avatar.png", async () => {
    throw new Error("storage detail must not escape");
  }, async () => true);
  assert.deepEqual(storageFailure, { removed: false, unlinked: false });

  const unlinkFailure = await removeAvatarObjectThenUnlink("user/avatar.png", async () => true, async () => {
    throw new Error("database detail must not escape");
  });
  assert.deepEqual(unlinkFailure, { removed: true, unlinked: false });

  const unlinkFailureWithoutAvatar = await removeAvatarObjectThenUnlink(null, async () => true, async () => {
    throw new Error("database detail must not escape");
  });
  assert.deepEqual(unlinkFailureWithoutAvatar, { removed: false, unlinked: false });
});

test("registro entrega el mismo mensaje y el diagnóstico solo acepta status numérico", () => {
  assert.equal(signupFeedback, "Si es posible crear una cuenta con esos datos, recibirás instrucciones en tu correo.");
  assert.equal(safeSignupFailureStatus({ status: 422, message: "correo privado" }), 422);
  assert.equal(safeSignupFailureStatus({ status: "correo privado", message: "secreto" }), undefined);
  assert.equal(safeSignupFailureStatus(new Error("token privado")), undefined);
});

test("registro valida runtime tipos, formatos y límites sin normalizar contraseñas", () => {
  const valid = { email: " User@example.test ", password: " pass phrase ", name: " Ana ", username: "ANA_1", next: "/home/profile" };
  assert.deepEqual(parseSignupInput(valid), {
    email: "User@example.test", password: " pass phrase ", name: "Ana", username: "ana_1", next: "/home/profile",
  });

  for (const invalid of [null, undefined, 1, "signup", [], {},
    { ...valid, email: 12 }, { ...valid, password: null }, { ...valid, name: [] },
    { ...valid, username: "contains-hyphen" }, { ...valid, email: "not-an-email" },
    { ...valid, password: "short" }, { ...valid, password: "x".repeat(73) },
    { ...valid, name: " " }, { ...valid, name: "x".repeat(81) },
    { ...valid, username: "a".repeat(21) }, { ...valid, next: 4 }, { ...valid, next: "x".repeat(2049) }]) {
    assert.equal(parseSignupInput(invalid), null);
  }
});

test("registro mantiene respuesta visible idéntica ante éxito, duplicado y error genérico", async (t) => {
  const originalWarn = console.warn;
  const diagnostics = [];
  console.warn = (...args) => diagnostics.push(args);
  t.after(() => { console.warn = originalWarn; });
  const feedbacks = await Promise.all([
    performSignupWithoutEnumeration(async () => ({})),
    performSignupWithoutEnumeration(async () => ({ error: { status: 422, message: "EMAIL_ALREADY_REGISTERED usuario@privado.test" } })),
    performSignupWithoutEnumeration(async () => { throw new Error("token=secreto"); }),
  ]);
  assert.deepEqual(feedbacks, [signupFeedback, signupFeedback, signupFeedback]);
  assert.deepEqual(diagnostics, [
    ["auth.signup.failed", { status: 422 }],
    ["auth.signup.failed", { status: undefined }],
  ]);
  assert.equal(JSON.stringify(diagnostics).includes("privado"), false);
  assert.equal(JSON.stringify(diagnostics).includes("secreto"), false);
});

test("logos solo aceptan IDs positivos y URLs de media API-Football", () => {
  assert.equal(assertPositiveTeamId(42), 42);
  for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "42"]) {
    assert.throws(() => assertPositiveTeamId(id), /entero positivo/);
  }
  assert.equal(validateTeamLogoUrl("https://media.api-sports.io/football/teams/42.png", 42).hostname, "media.api-sports.io");
  for (const url of [
    "https://attacker.example/football/teams/42.png",
    "https://media.api-sports.io/football/teams/43.png",
    "https://media.api-sports.io.evil.test/football/teams/42.png",
    "http://media.api-sports.io/football/teams/42.png",
    "https://media.api-sports.io/football/teams/42.png?redirect=https://attacker.example",
  ]) assert.throws(() => validateTeamLogoUrl(url, 42), /URL del escudo/);
});

test("descarga logo sin seguir redirecciones y escribe solo dentro de carpeta local", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gloria-logo-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "teams");
  let redirectOption;
  await downloadTeamLogo(42, "https://media.api-sports.io/football/teams/42.png", directory, async (_url, options) => {
    redirectOption = options.redirect;
    return { ok: true, status: 200, arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer };
  });
  assert.equal(redirectOption, "error");
  assert.deepEqual([...await fs.readFile(path.join(directory, "42.png"))], [1, 2, 3]);
  await downloadTeamLogo(42, "https://media.api-sports.io/football/teams/42.png", directory, async () => ({
    ok: true, status: 200, arrayBuffer: async () => Uint8Array.from([4, 5, 6]).buffer,
  }));
  assert.deepEqual([...await fs.readFile(path.join(directory, "42.png"))], [4, 5, 6]);
  await assert.rejects(downloadTeamLogo(42, "https://media.api-sports.io/football/teams/42.png", path.join(root, "teams"), async () => {
    throw new TypeError("redirect rejected");
  }), /redirect rejected/);

  const outside = path.join(root, "outside.png");
  await fs.writeFile(outside, "preserve me");
  await fs.symlink(outside, path.join(directory, "99.png"));
  await assert.rejects(downloadTeamLogo(99, "https://media.api-sports.io/football/teams/99.png", directory, async () => ({
    ok: true, status: 200, arrayBuffer: async () => Uint8Array.from([9]).buffer,
  })));
  assert.equal(await fs.readFile(outside, "utf8"), "preserve me");
  assert.deepEqual((await fs.readdir(directory)).sort(), ["42.png", "99.png"].sort());

  const alias = path.join(root, "teams-alias");
  await fs.symlink(directory, alias, "dir");
  await assert.rejects(downloadTeamLogo(100, "https://media.api-sports.io/football/teams/100.png", alias), /directorio de logos/);
});

test("logo aborta si la carpeta de destino se reemplaza mientras espera la descarga", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gloria-logo-race-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "teams");
  const outside = path.join(root, "outside");
  await fs.mkdir(outside);

  await assert.rejects(downloadTeamLogo(42, "https://media.api-sports.io/football/teams/42.png", directory, async () => {
    await fs.rm(directory, { recursive: true, force: true });
    await fs.symlink(outside, directory, "dir");
    return { ok: true, status: 200, arrayBuffer: async () => Uint8Array.from([7]).buffer };
  }), /cambió durante la descarga/);
  await assert.rejects(fs.access(path.join(outside, "42.png")));
});
