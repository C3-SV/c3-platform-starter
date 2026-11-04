import test from "node:test";
import assert from "node:assert/strict";
import { buildSeedPlan } from "../../src/lib/seed/seed-plan.ts";
import type { SeedRecord } from "../../src/lib/seed/seed-data.ts";

const record = (id: string, title: string): SeedRecord => ({
  collection: "experiences",
  id,
  data: { title, status: "published" },
});

test("crea los documentos del seed que no existen", () => {
  const plan = buildSeedPlan([], [record("seed_experience_a", "Taller A")]);
  assert.equal(plan.toCreate.length, 1);
  assert.equal(plan.conflicts.length, 0);
});

test("un documento ajeno con el mismo título bloquea la creación del seed", () => {
  const plan = buildSeedPlan(
    [{ id: "exp-real-123", data: { title: "  taller a  ", status: "published" } }],
    [record("seed_experience_a", "Taller A")],
  );
  assert.equal(plan.toCreate.length, 0);
  assert.equal(plan.conflicts.length, 1);
  assert.match(plan.conflicts[0].reason, /exp-real-123/);
});

test("un documento del propio seed con el mismo título no cuenta como duplicado", () => {
  const plan = buildSeedPlan(
    [{ id: "seed_experience_a", data: { title: "Taller A", status: "published" } }],
    [record("seed_experience_a", "Taller A")],
  );
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.existing.length, 1);
});
