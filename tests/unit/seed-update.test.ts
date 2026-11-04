import test from "node:test";
import assert from "node:assert/strict";
import { buildSeedPlan, changedFields } from "../../src/lib/seed/seed-plan.ts";
import type { SeedRecord } from "../../src/lib/seed/seed-data.ts";

const v2 = (overrides: Record<string, unknown> = {}): SeedRecord => ({
  collection: "challenges",
  id: "seed_challenge_rutas",
  data: { title: "Optimización de rutas", primaryLine: "conecta", seedVersion: 2, managedBy: "c3-seed", ...overrides },
});

test("un documento del seed aplicado con versión anterior se actualiza y se listan los campos que cambian", () => {
  const plan = buildSeedPlan(
    [{ id: "seed_challenge_rutas", data: { title: "Rutas sostenibles", primaryLine: "crea", seedVersion: 1, managedBy: "c3-seed" } }],
    [v2()],
  );
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.toUpdate.length, 1);
  assert.deepEqual(plan.toUpdate[0].changed, ["primaryLine", "seedVersion", "title"]);
  assert.equal(plan.writes, 1);
});

test("un documento sin marca del seed no se actualiza aunque tenga el mismo id: es conflicto", () => {
  const plan = buildSeedPlan(
    [{ id: "seed_challenge_rutas", data: { title: "Rutas sostenibles", primaryLine: "crea" } }],
    [v2()],
  );
  assert.equal(plan.toUpdate.length, 0);
  assert.equal(plan.conflicts.length, 1);
});

test("un documento del seed con la misma versión y contenido distinto es conflicto, no actualización", () => {
  const plan = buildSeedPlan(
    [{ id: "seed_challenge_rutas", data: { title: "Otra", seedVersion: 2, managedBy: "c3-seed" } }],
    [v2()],
  );
  assert.equal(plan.toUpdate.length, 0);
  assert.equal(plan.conflicts.length, 1);
});

test("una actualización que deja el título de un documento ajeno es conflicto, no actualización", () => {
  const plan = buildSeedPlan(
    [
      { id: "seed_challenge_rutas", data: { title: "Rutas sostenibles", seedVersion: 1, managedBy: "c3-seed" } },
      { id: "exp-real-9", data: { title: "Optimización de rutas", status: "published" } },
    ],
    [v2()],
  );
  assert.equal(plan.toUpdate.length, 0);
  assert.equal(plan.conflicts.length, 1);
  assert.match(plan.conflicts[0].reason, /exp-real-9/);
});

test("changedFields ignora campos que solo existen en el documento aplicado", () => {
  assert.deepEqual(changedFields({ a: 1, extra: true }, { a: 2 }), ["a"]);
  assert.deepEqual(changedFields({ a: [1, 2] }, { a: [1, 2] }), []);
});
