import test from "node:test";
import assert from "node:assert/strict";
import { canEditDelivery, deliveryState, parseDeliveryInput } from "../../src/lib/domain/delivery.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

const closes = "2026-11-14T23:59:00-06:00";
const during = new Date("2026-11-10T12:00:00.000Z");
const after = new Date("2026-11-20T12:00:00.000Z");
const solucion = "Heurística de inserción con penalización por ventana incumplida.";

function issuesOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationFailure) return error.issues.map((issue) => issue.field).sort();
    throw error;
  }
  return [];
}

test("guardar un borrador acepta entregas parciales", () => {
  const parsed = parseDeliveryInput({ text: "  Avance inicial  ", links: [], submit: false });
  assert.equal(parsed.text, "Avance inicial");
  assert.deepEqual(parsed.links, []);
  assert.equal(parsed.submit, false);
});

test("enviar exige descripción de al menos 20 caracteres y un enlace", () => {
  assert.deepEqual(issuesOf(() => parseDeliveryInput({ text: "corto", links: [], submit: true })), ["links", "text"]);
  assert.deepEqual(issuesOf(() => parseDeliveryInput({ text: solucion, links: ["https://github.com/a/b"], submit: true })), []);
});

test("solo se aceptan enlaces https válidos, sin duplicados, hasta cinco", () => {
  assert.deepEqual(issuesOf(() => parseDeliveryInput({ text: "", links: ["http://inseguro.test"] })), ["links"]);
  assert.deepEqual(issuesOf(() => parseDeliveryInput({ text: "", links: ["no es una url"] })), ["links"]);
  const dedup = parseDeliveryInput({ text: "", links: ["https://a.test", "https://a.test"] });
  assert.deepEqual(dedup.links, ["https://a.test"]);
  assert.deepEqual(
    issuesOf(() => parseDeliveryInput({ text: "", links: ["https://1.test", "https://2.test", "https://3.test", "https://4.test", "https://5.test", "https://6.test"] })),
    ["links"],
  );
});

test("la descripción tiene un tope de caracteres", () => {
  assert.deepEqual(issuesOf(() => parseDeliveryInput({ text: "x".repeat(4001), links: [] })), ["text"]);
});

test("el estado visible sigue la regla de plazos: sin entrega, borrador, entregada o fuera de plazo", () => {
  assert.equal(deliveryState(null, closes, during), "sin_entrega");
  assert.equal(deliveryState({ status: "draft" }, closes, during), "borrador");
  assert.equal(deliveryState({ status: "submitted" }, closes, during), "entregada");
  assert.equal(deliveryState(null, closes, after), "fuera_de_plazo");
  assert.equal(deliveryState({ status: "draft" }, closes, after), "fuera_de_plazo");
  assert.equal(deliveryState({ status: "submitted" }, closes, after), "entregada", "una entrega enviada permanece estable");
});

test("la edición solo está abierta antes del cierre", () => {
  assert.equal(canEditDelivery(closes, during), true);
  assert.equal(canEditDelivery(closes, after), false);
  assert.equal(canEditDelivery(null, during), false);
});
