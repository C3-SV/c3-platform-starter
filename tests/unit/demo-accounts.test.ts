import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  DEMO_ACCOUNTS,
  DEMO_EMAIL_DOMAIN,
  DEMO_PROJECT,
  assertDemoProject,
  generateDemoPassword,
  isOutsideDirectory,
  planDemoAccounts,
} from "../../src/lib/seed/demo-accounts.ts";

test("las tres cuentas demo usan el dominio demo y cubren joven, empresa y administración", () => {
  assert.deepEqual(DEMO_ACCOUNTS.map((account) => account.key), ["joven", "empresa", "admin"]);
  for (const account of DEMO_ACCOUNTS) {
    assert.ok(account.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`), `${account.email} debe usar el dominio demo`);
  }
  assert.equal(DEMO_ACCOUNTS.find((account) => account.key === "empresa")?.role, "representante");
  assert.equal(DEMO_ACCOUNTS.find((account) => account.key === "admin")?.role, "administracion");
});

test("solo el proyecto demo autorizado es admitido en remoto", () => {
  assert.equal(DEMO_PROJECT, "c3-platform-demo");
  assert.equal(assertDemoProject(DEMO_PROJECT, { emulator: false }), DEMO_PROJECT);
  assert.throws(() => assertDemoProject("c3-challenges-demo", { emulator: false }), /Solo se admite el proyecto demo/);
  assert.throws(() => assertDemoProject("otro-proyecto", { emulator: false }), /Solo se admite el proyecto demo/);
  assert.throws(() => assertDemoProject(undefined, { emulator: false }), /Indicá --project/);
});

test("con emuladores solo se acepta el proyecto de emulación", () => {
  assert.equal(assertDemoProject("demo-c3-platform", { emulator: true }), "demo-c3-platform");
  assert.throws(() => assertDemoProject(DEMO_PROJECT, { emulator: true }), /Con emuladores/);
});

test("las contraseñas demo son largas, aleatorias y cumplen las cuatro clases de caracteres", () => {
  const first = generateDemoPassword();
  const second = generateDemoPassword();
  assert.equal(first.length, 24);
  assert.notEqual(first, second);
  assert.match(first, /[A-Z]/);
  assert.match(first, /[a-z]/);
  assert.match(first, /[0-9]/);
  assert.match(first, /[!#%+\-=?@]/);
  assert.throws(() => generateDemoPassword(8), /al menos 16/);
});

test("las credenciales no pueden guardarse dentro del repositorio", () => {
  const repo = resolve("/repo/c3");
  assert.equal(isOutsideDirectory(repo, resolve("/repo/c3/secreto.txt")), false);
  assert.equal(isOutsideDirectory(repo, resolve("/repo/c3/sub/dir/x.txt")), false);
  assert.equal(isOutsideDirectory(repo, resolve("/repo/c3")), false);
  assert.equal(isOutsideDirectory(repo, resolve("/repo/otra/credenciales.txt")), true);
  assert.equal(isOutsideDirectory(repo, resolve("/repo/c3-otra/x.txt")), true);
});

test("el plan marca como existente la cuenta que ya está en Auth y crea el resto", () => {
  const plan = planDemoAccounts(new Set([`joven@${DEMO_EMAIL_DOMAIN}`]));
  assert.deepEqual(plan.map((item) => item.action), ["existente", "crear", "crear"]);
});
