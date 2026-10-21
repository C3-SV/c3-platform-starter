import assert from "node:assert/strict";
import test from "node:test";
import { countWithResult, groupTrajectory, medalFor, medalName, medalText, trajectorySection, type TrajectoryFacts } from "../../src/lib/domain/trayectoria.ts";

const entry = (id: string, status: TrajectoryFacts["status"], result: unknown | null = null) => ({ id, status, result });

test("cada inscripción cae en una sola sección según lo que C3 decidió", () => {
  assert.equal(trajectorySection(entry("a", "approved")), "participaciones");
  assert.equal(trajectorySection(entry("b", "pending")), "en_revision");
  assert.equal(trajectorySection(entry("c", "cancelled")), "sin_participacion");
  assert.equal(trajectorySection(entry("d", "rejected")), "sin_participacion");
});

test("una inscripción cancelada o rechazada no acredita participación aunque tuviera un resultado", () => {
  assert.equal(trajectorySection(entry("e", "cancelled", { place: 1 })), "sin_participacion");
  assert.equal(trajectorySection(entry("f", "rejected", { place: 1 })), "sin_participacion");
});

test("agrupa conservando el orden recibido y sube los resultados publicados dentro de participaciones", () => {
  const groups = groupTrajectory([
    entry("reciente", "approved"),
    entry("revision", "pending"),
    entry("con-resultado", "approved", { place: 2 }),
    entry("cancelada", "cancelled"),
    entry("antigua", "approved"),
    entry("rechazada", "rejected"),
  ]);
  assert.deepEqual(groups.participaciones.map((item) => item.id), ["con-resultado", "reciente", "antigua"]);
  assert.deepEqual(groups.en_revision.map((item) => item.id), ["revision"]);
  assert.deepEqual(groups.sin_participacion.map((item) => item.id), ["cancelada", "rechazada"]);
});

test("sin inscripciones, todas las secciones quedan vacías", () => {
  assert.deepEqual(groupTrajectory([]), { participaciones: [], en_revision: [], sin_participacion: [] });
  assert.equal(countWithResult([]), 0);
});

test("cuenta solo los resultados de participaciones aprobadas", () => {
  assert.equal(countWithResult([entry("a", "approved", { place: 3 }), entry("b", "approved"), entry("c", "cancelled", { place: 1 })]), 1);
});

test("medallas: oro, plata y bronce solo para los tres primeros puestos publicados", () => {
  assert.equal(medalFor(1), "oro");
  assert.equal(medalFor(2), "plata");
  assert.equal(medalFor(3), "bronce");
  assert.equal(medalFor(4), null);
  assert.equal(medalFor(null), null);
  assert.equal(medalFor(undefined), null);
  assert.equal(medalFor(0), null);
});

test("el texto de la medalla sigue la guía y su nombre accesible no depende del color", () => {
  assert.deepEqual(["oro", "plata", "bronce"].map((medal) => medalText(medal as "oro" | "plata" | "bronce")), ["ORO", "2.º", "3.º"]);
  assert.equal(medalName("oro"), "Medalla de oro");
  assert.equal(medalName("plata"), "Medalla de plata");
  assert.equal(medalName("bronce"), "Medalla de bronce");
});
