import test from "node:test";
import assert from "node:assert/strict";
import { canViewFeedback, parseCheckpointInput, parseFeedbackInput } from "../../src/lib/domain/process.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

test("un checkpoint guarda el avance con enlace https opcional", () => {
  assert.deepEqual(parseCheckpointInput({ text: "Elegí la heurística de inserción tras comparar dos enfoques." }), {
    text: "Elegí la heurística de inserción tras comparar dos enfoques.",
    link: null,
  });
  assert.equal(parseCheckpointInput({ text: "Primer prototipo que lee pedidos de un archivo CSV.", link: "https://example.test/rama" }).link, "https://example.test/rama");
});

test("un checkpoint corto o con enlace inseguro no se guarda", () => {
  assert.throws(() => parseCheckpointInput({ text: "corto" }), ValidationFailure);
  assert.throws(() => parseCheckpointInput({ text: "Prototipo con enlace inseguro.", link: "http://example.test" }), ValidationFailure);
});

test("la retroalimentación exige texto entre 20 y 1500 caracteres y publicar es explícito", () => {
  assert.deepEqual(parseFeedbackInput({ text: "Buena justificación de las tolerancias; falta medir el costo de cambiar de ruta." }), {
    text: "Buena justificación de las tolerancias; falta medir el costo de cambiar de ruta.",
    publish: false,
  });
  assert.equal(parseFeedbackInput({ text: "Buena justificación de las tolerancias en el reporte.", publish: true }).publish, true);
  assert.throws(() => parseFeedbackInput({ text: "muy bien" }), ValidationFailure);
});

test("la persona no ve la retroalimentación sin publicar; la empresa sí", () => {
  assert.equal(canViewFeedback(null, "participant"), false);
  assert.equal(canViewFeedback("2026-11-02T20:00:00.000Z", "participant"), true);
  assert.equal(canViewFeedback(null, "company"), true);
});
