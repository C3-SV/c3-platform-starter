import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ORGANIZATION_MEMBERS } from "../../src/lib/server/companies.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { getTalentBoard } from "../../src/lib/server/talent.ts";
import { DEMO_ACCOUNTS, DEMO_EMAIL_DOMAIN, provisionDemoAccounts } from "../../src/lib/seed/demo-accounts.ts";
import { DEMO_ORGANIZATION_ID, SEED_RECORDS } from "../../src/lib/seed/seed-data.ts";
import { USERS } from "../../src/lib/server/ids.ts";
import { clearAuth, clearFirestore, testAuth, testDb } from "./support.ts";

const now = new Date("2026-11-03T12:00:00.000Z");
const challengeId = SEED_RECORDS.challenges[0].id;
const empresaEmail = `empresa@${DEMO_EMAIL_DOMAIN}`;
const jovenEmail = `joven@${DEMO_EMAIL_DOMAIN}`;

async function writeSeed(): Promise<void> {
  const db = testDb();
  for (const record of [...SEED_RECORDS.organizations, ...SEED_RECORDS.experiences, ...SEED_RECORDS.challenges]) {
    await db.collection(record.collection).doc(record.id).set(record.data);
  }
}

function capture() {
  const calls: { email: string; password: string }[][] = [];
  return {
    calls,
    writeCredentials(credentials: { email: string; password: string }[]) {
      calls.push(credentials);
    },
  };
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("el modo simulación no crea cuentas, no escribe credenciales ni vincula nada", async () => {
  await writeSeed();
  const writes = capture();
  const summary = await provisionDemoAccounts({ db: testDb(), auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: false, now, writeCredentials: writes.writeCredentials });

  assert.equal(summary.dryRun, true);
  assert.deepEqual(summary.plan.map((item) => item.action), ["crear", "crear", "crear"]);
  assert.equal(writes.calls.length, 0);
  assert.equal(await testAuth().getUserByEmail(empresaEmail).then(() => "existe", () => "no existe"), "no existe");
});

test("sin la organización demo no se crea ninguna cuenta", async () => {
  const writes = capture();
  await assert.rejects(
    provisionDemoAccounts({ db: testDb(), auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: writes.writeCredentials }),
    /Falta la organización demo/,
  );
  assert.equal(writes.calls.length, 0);
  assert.equal(await testAuth().getUserByEmail(jovenEmail).then(() => "existe", () => "no existe"), "no existe");
});

test("aplicar crea las tres cuentas, entrega las contraseñas una sola vez y asigna administración y vínculo", async () => {
  await writeSeed();
  const db = testDb();
  const writes = capture();
  const summary = await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: writes.writeCredentials });

  assert.equal(summary.created, 3);
  assert.equal(writes.calls.length, 1, "las credenciales se entregan una sola vez");
  assert.deepEqual(writes.calls[0].map((item) => item.email), DEMO_ACCOUNTS.map((account) => account.email));

  const empresa = await testAuth().getUserByEmail(empresaEmail);
  const admin = await testAuth().getUserByEmail(`admin@${DEMO_EMAIL_DOMAIN}`);
  assert.equal(admin.customClaims?.c3Admin, true);
  assert.equal(empresa.customClaims?.c3Admin, undefined);

  const profile = (await db.collection(USERS).doc(empresa.uid).get()).data();
  assert.equal(profile?.demo, true);
  const membership = (await db.collection(ORGANIZATION_MEMBERS).doc(`${DEMO_ORGANIZATION_ID}__${empresa.uid}`).get()).data();
  assert.equal(membership?.role, "representante");
  assert.equal(membership?.organizationId, DEMO_ORGANIZATION_ID);

  assert.equal(JSON.stringify(summary).includes(writes.calls[0][0].password), false, "el resumen nunca contiene contraseñas");
});

test("una segunda aplicación no crea, no recambia contraseñas y no duplica vínculos", async () => {
  await writeSeed();
  const db = testDb();
  const first = capture();
  await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: first.writeCredentials });
  const second = capture();
  const summary = await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: second.writeCredentials });

  assert.equal(summary.created, 0);
  assert.equal(second.calls.length, 0);
  const empresa = await testAuth().getUserByEmail(empresaEmail);
  const memberships = await db.collection(ORGANIZATION_MEMBERS).where("userId", "==", empresa.uid).get();
  assert.equal(memberships.size, 1);
});

test("la cuenta de empresa demo ve el tablero de su challenge; la cuenta joven demo no", async () => {
  await writeSeed();
  const db = testDb();
  await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: capture().writeCredentials });

  const empresa = await testAuth().getUserByEmail(empresaEmail);
  const joven = await testAuth().getUserByEmail(jovenEmail);
  const board = await getTalentBoard(db, { uid: empresa.uid, email: empresa.email ?? null, isAdmin: false }, challengeId);
  assert.equal(board.challenge.isDemo, true);
  assert.equal(board.challenge.commercialPackage, "completo");
  await assert.rejects(
    getTalentBoard(db, { uid: joven.uid, email: joven.email ?? null, isAdmin: false }, challengeId),
    (error: unknown) => error instanceof HttpError && error.status === 403,
  );
});
