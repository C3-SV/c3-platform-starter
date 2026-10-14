import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getPublicChallenge, listPublicCatalog } from "../../src/lib/server/catalog.ts";
import { SEED_RECORDS } from "../../src/lib/seed/seed-data.ts";
import { buildSeedPlan } from "../../src/lib/seed/seed-plan.ts";
import { clearFirestore, testDb } from "./support.ts";

beforeEach(async () => {
  await clearFirestore();
});

test("el seed crea el catálogo compartido y sus referencias en el emulador", async () => {
  const db = testDb();
  for (const record of [...SEED_RECORDS.experiences, ...SEED_RECORDS.challenges]) {
    await db.collection(record.collection).doc(record.id).create(record.data);
  }

  const catalog = await listPublicCatalog(db, new Date("2026-10-14T00:00:00.000Z"));
  assert.equal(catalog.length, 7);
  assert.ok(catalog.some((item) => item.experience.primaryLine === "compite"));
  assert.ok(catalog.some((item) => item.experience.primaryLine === "crea"));
  assert.ok(catalog.some((item) => item.experience.primaryLine === "conecta"));

  const challenge = await getPublicChallenge(db, SEED_RECORDS.challenges[0].id, new Date("2026-10-14T00:00:00.000Z"));
  assert.equal(challenge.experience.id, SEED_RECORDS.challenges[0].data.experienceId);
  assert.equal(challenge.challenge.organizationName, "Empresa de demostración C3");
});

test("una segunda planificación sobre el seed aplicado no genera duplicados", async () => {
  const db = testDb();
  const records = [...SEED_RECORDS.experiences, ...SEED_RECORDS.challenges];
  for (const record of records) {
    await db.collection(record.collection).doc(record.id).create(record.data);
  }

  for (const collection of ["experiences", "challenges"] as const) {
    const snapshot = await db.collection(collection).get();
    const plan = buildSeedPlan(
      snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      records.filter((record) => record.collection === collection),
    );
    assert.equal(plan.toCreate.length, 0);
    assert.equal(plan.conflicts.length, 0);
    assert.equal(plan.writes, 0);
  }
});
