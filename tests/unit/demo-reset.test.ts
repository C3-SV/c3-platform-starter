import test from "node:test";
import assert from "node:assert/strict";
import { isResettableDemoRecord, resettableFrom } from "../../src/lib/seed/demo-reset.ts";
import { SEED_RECORDS, seedId } from "../../src/lib/seed/seed-data.ts";

const challengeId = seedId("challenge", "empresa-demostracion-rutas");
const all = Object.values(SEED_RECORDS).flat();
const selected = resettableFrom(all, challengeId);
const titles = (records: typeof all) => records.map((record) => String(record.data.title ?? record.id));

test("el reset selecciona el dataset de demostración: challenge, perfiles, inscripciones, evaluaciones y resultados", () => {
  const collections = new Set(selected.map((record) => record.collection));
  for (const collection of ["organizations", "challenges", "users", "enrollments", "submissions", "defenses", "evaluations", "results", "companyProposals"]) {
    assert.ok(collections.has(collection as never), `${collection} debe estar en el reset`);
  }
  assert.ok(selected.some((record) => record.id === challengeId));
});

test("el reset nunca toca experiencias históricas con procedencia ni experiencias fuera de la demo", () => {
  const remaining = titles(all.filter((record) => !selected.includes(record) && record.collection === "experiences"));
  assert.ok(remaining.some((title) => title.includes("Copa Salvadoreña")), "la Copa 2026 queda");
  assert.ok(remaining.some((title) => title.includes("Hackathon de Turismo Creativo Vol. 1")), "el Hackathon Vol. 1 queda");
  assert.ok(!selected.some((record) => String(record.data.sourceUrl ?? "").startsWith("https://copa")), "ninguna experiencia con procedencia se borra");
});

test("un documento sin la marca del seed o con id ajeno nunca se selecciona", () => {
  assert.equal(isResettableDemoRecord("users", "c3-demo-joven", { demo: true, managedBy: "c3-seed" }, challengeId), false, "la cuenta demo tiene id fijo, no del seed");
  assert.equal(isResettableDemoRecord("users", "seed_user_x", { demo: true }, challengeId), false, "sin managedBy del seed no se borra");
  assert.equal(isResettableDemoRecord("enrollments", "abc__123", { demo: true, managedBy: "c3-seed" }, challengeId), false, "id sin prefijo del seed no se borra");
  assert.equal(isResettableDemoRecord("contactRequests", "seed_challenge_x__persona-real", { managedBy: "c3-seed" }, challengeId), false, "sin marca demo no se borra");
});
