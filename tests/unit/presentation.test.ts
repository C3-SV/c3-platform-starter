import test from "node:test";
import assert from "node:assert/strict";
import { presentState, lineColor } from "../../src/lib/domain/presentation.ts";

const now = new Date("2026-10-12T18:00:00.000Z");

test("borrador y cancelado no dependen de las fechas", () => {
  assert.deepEqual(presentState("draft", {}, now), { label: "Borrador", tone: "neutro" });
  assert.deepEqual(presentState("cancelled", {}, now), { label: "Cancelado", tone: "error" });
});

test("publicado antes de abrir inscripciones se muestra como Próximo", () => {
  const state = presentState("published", { opensAt: "2026-11-01T00:00:00.000Z" }, now);
  assert.deepEqual(state, { label: "Próximo", tone: "neutro" });
});

test("publicado dentro de la ventana se muestra como Abierto y después del cierre como En evaluación", () => {
  assert.equal(presentState("published", { opensAt: "2026-10-01T00:00:00.000Z", closesAt: "2026-11-01T00:00:00.000Z" }, now).label, "Abierto");
  assert.equal(presentState("published", { closesAt: "2026-10-01T00:00:00.000Z" }, now).label, "En evaluación");
});

test("concluido usa el tono de éxito", () => {
  assert.deepEqual(presentState("closed", {}, now), { label: "Concluido", tone: "exito" });
});

test("el color de línea sigue el token de la guía de estilo", () => {
  assert.equal(lineColor("hackathon"), "var(--c3-crea)");
  assert.equal(lineColor("competencia"), "var(--c3-compite)");
  assert.equal(lineColor("challenge_empresarial"), "var(--c3-conecta)");
});
