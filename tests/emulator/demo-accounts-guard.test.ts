import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DEMO_EMAIL_DOMAIN, provisionDemoAccounts } from "../../src/lib/seed/demo-accounts.ts";
import { DEMO_ORGANIZATION_ID, SEED_RECORDS } from "../../src/lib/seed/seed-data.ts";
import { clearAuth, clearFirestore, testAuth, testDb } from "./support.ts";

const now = new Date("2026-11-03T12:00:00.000Z");

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("una cuenta preexistente con correo demo y otro UID no recibe administración ni vínculo", async () => {
  const db = testDb();
  for (const record of SEED_RECORDS.organizations) await db.collection(record.collection).doc(record.id).set(record.data);
  // Alguien registró admin@ con su propia cuenta antes de la provisión.
  await testAuth().createUser({ uid: "registro-ajeno-1", email: `admin@${DEMO_EMAIL_DOMAIN}`, password: "clave-prueba-123" });

  await assert.rejects(
    provisionDemoAccounts({ db, auth: testAuth(), organizationId: DEMO_ORGANIZATION_ID, apply: true, now, writeCredentials: () => {} }),
    /otro identificador/,
  );
  const user = await testAuth().getUser("registro-ajeno-1");
  assert.equal(user.customClaims?.c3Admin, undefined, "no se asigna administración a una cuenta ajena");
  const profile = await db.collection("users").doc("registro-ajeno-1").get();
  assert.equal(profile.exists, false, "no se escribe perfil demo para una cuenta ajena");
});
