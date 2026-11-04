import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getTalentBoard, listMyContactRequests } from "../../src/lib/server/talent.ts";
import { getCompanySpace } from "../../src/lib/server/companies.ts";
import { DEMO_ACCOUNTS, DEMO_EMAIL_DOMAIN, provisionDemoAccounts } from "../../src/lib/seed/demo-accounts.ts";
import { DEMO_ORGANIZATION_ID, SEED_RECORDS, seedId } from "../../src/lib/seed/seed-data.ts";
import { buildSeedPlan } from "../../src/lib/seed/seed-plan.ts";
import { clearAuth, clearFirestore, testAuth, testDb } from "./support.ts";

const now = new Date("2026-11-03T12:00:00.000Z");
const challengeId = seedId("challenge", "empresa-demostracion-rutas");
const empresaUid = DEMO_ACCOUNTS.find((account) => account.key === "empresa")?.uid as string;
const jovenUid = DEMO_ACCOUNTS.find((account) => account.key === "joven")?.uid as string;

async function writeAllSeed(): Promise<void> {
  const db = testDb();
  for (const records of Object.values(SEED_RECORDS)) {
    for (const record of records) await db.collection(record.collection).doc(record.id).set(record.data);
  }
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("el dataset demo se planifica entero como creación en un proyecto vacío", () => {
  const plan = buildSeedPlan([], Object.values(SEED_RECORDS).flat());
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.toUpdate.length, 0);
  assert.equal(plan.toCreate.length, Object.values(SEED_RECORDS).flat().length);
});

test("el tablero de la empresa demo muestra entregas enviadas, defensas, lista corta y contacto; nunca borradores", async () => {
  await writeAllSeed();
  const db = testDb();
  await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: () => {} });

  const board = await getTalentBoard(db, { uid: empresaUid, email: `empresa@${DEMO_EMAIL_DOMAIN}`, isAdmin: false }, challengeId);
  assert.equal(board.challenge.isDemo, true);
  assert.equal(board.rows.length, 4, "joven, Ana, Luis y Sofía; Diego tiene borrador");
  assert.equal(board.rows.filter((row) => row.defense).length, 3);
  assert.equal(board.rows.filter((row) => row.shortlist).length, 2);
  assert.equal(board.rows.find((row) => row.userId === jovenUid)?.contact?.status, "esperando_consentimiento");
  assert.equal(board.rows.find((row) => row.name === "Ana Martínez")?.contact?.status, "aceptado");
  assert.ok(!board.rows.some((row) => row.name === "Diego Castillo"), "el borrador no es visible");
});

test("la cuenta joven demo recibe su solicitud de contacto y puede aceptarla o declinarla", async () => {
  await writeAllSeed();
  const db = testDb();
  await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: () => {} });

  const mine = await listMyContactRequests(db, { uid: jovenUid, email: `joven@${DEMO_EMAIL_DOMAIN}`, isAdmin: false });
  assert.equal(mine.length, 1);
  assert.equal(mine[0].organizationName, "Empresa de demostración C3");
  assert.deepEqual(mine[0].actions, ["aceptado", "declinado"]);
});

test("el seed no se aplica dos veces: una segunda planificación sobre el dataset no crea ni actualiza nada", async () => {
  await writeAllSeed();
  const db = testDb();
  for (const records of Object.values(SEED_RECORDS)) {
    const snapshot = await db.collection(records[0].collection).get();
    const plan = buildSeedPlan(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })), records);
    assert.equal(plan.writes, 0, `${records[0].collection} no debe escribir de nuevo`);
    assert.equal(plan.conflicts.length, 0);
  }
  assert.ok(seedId("user", "ana-martinez").startsWith("seed_"));
  assert.equal(DEMO_ACCOUNTS.length, 3);
});

test("las cifras del tablero de empresa son conteos reales: inscritas aprobadas, entregas enviadas y lista corta", async () => {
  await writeAllSeed();
  const db = testDb();
  await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: () => {} });

  const space = await getCompanySpace(db, { uid: empresaUid, email: `empresa@${DEMO_EMAIL_DOMAIN}`, isAdmin: false }, now);
  const challenge = space.challenges.find((item) => item.id === challengeId);
  assert.ok(challenge, "el challenge demo aparece en el espacio de la empresa");
  assert.deepEqual(challenge.metrics, { enrolled: 5, submitted: 4, shortlisted: 2, evaluating: 3 });
});

test("la matriz por criterio aparece porque C3 publicó con puntajes; los estados reflejan las evaluaciones", async () => {
  await writeAllSeed();
  const db = testDb();
  await provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: () => {} });

  const board = await getTalentBoard(db, { uid: empresaUid, email: `empresa@${DEMO_EMAIL_DOMAIN}`, isAdmin: false }, challengeId);
  assert.equal(board.challenge.rubric.length, 4);
  const ana = board.rows.find((row) => row.name === "Ana Martínez");
  const sofia = board.rows.find((row) => row.name === "Sofía Ramírez");
  const joven = board.rows.find((row) => row.userId === jovenUid);
  assert.equal(ana?.evaluation.state, "publicada");
  assert.equal(ana?.evaluation.average, 34);
  assert.deepEqual(ana?.evaluation.criteria, { c1: 8.5, c2: 8.5, c3: 8.5, c4: 8.5 });
  assert.equal(sofia?.evaluation.state, "sin_completar", "Sofía tiene un borrador: sin dos jurados finalizados");
  assert.equal(sofia?.evaluation.criteria, null, "un borrador no se muestra como puntaje");
  assert.equal(joven?.evaluation.state, "sin_evaluar");
});
