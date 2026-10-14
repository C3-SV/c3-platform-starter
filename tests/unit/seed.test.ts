import test from "node:test";
import assert from "node:assert/strict";
import { SEED_RECORDS, seedId, validateSeedRecords } from "../../src/lib/seed/seed-data.ts";
import { buildSeedPlan } from "../../src/lib/seed/seed-plan.ts";

test("los IDs del seed son determinísticos y están separados por namespace", () => {
  assert.equal(seedId("experience", "copa-salvadorena-2026"), seedId("experience", "copa-salvadorena-2026"));
  assert.notEqual(seedId("experience", "copa-salvadorena-2026"), seedId("challenge", "copa-salvadorena-2026"));
  assert.ok(SEED_RECORDS.experiences.every((record) => record.id.startsWith("seed_")));
});

test("el dataset conserva fuentes oficiales y marca demos explícitamente", () => {
  const official = SEED_RECORDS.experiences.filter((record) => !record.data.isDemo);
  const demos = SEED_RECORDS.experiences.filter((record) => record.data.isDemo);
  assert.ok(official.length > 0);
  assert.ok(official.every((record) => typeof record.data.sourceUrl === "string" && record.data.sourceUrl.startsWith("https://")));
  assert.ok(demos.length >= 4);
  assert.ok(demos.every((record) => {
    const note = record.data.demoNote;
    return typeof note === "string" && note.includes("demostración");
  }));
});

test("el plan rechaza un registro existente con contenido distinto", () => {
  const record = SEED_RECORDS.experiences[0];
  const plan = buildSeedPlan([{ id: record.id, data: { ...record.data, title: "Otro título" } }], [record]);
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.existing.length, 0);
  assert.equal(plan.conflicts.length, 1);
  assert.equal(plan.writes, 0);
});

test("una segunda ejecución idempotente no planea escrituras", () => {
  const existing = SEED_RECORDS.experiences.map((record) => ({ id: record.id, data: record.data }));
  const plan = buildSeedPlan(existing, SEED_RECORDS.experiences);
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.existing.length, existing.length);
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.writes, 0);
});

test("el dataset rechaza registros sin identificación o colección válida", () => {
  assert.throws(() => validateSeedRecords([{ id: "", collection: "unknown", data: {} } as never]), /inválido/i);
});
