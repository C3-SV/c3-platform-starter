import test from "node:test";
import assert from "node:assert/strict";
import { canRecordDefense, parseDefenseInput } from "../../src/lib/domain/defense.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

const valid = {
  videoUrl: "https://video.example.test/defensa-rutas",
  summary: "Construí una heurística de inserción con ventanas horarias y la comparé contra una búsqueda exhaustiva.",
  decisions: "Elegí inserción secuencial porque el tiempo de respuesta importa más que la optimalidad exacta.",
  testing: "Probé 40 instancias sintéticas y medí kilómetros y tiempo de cómputo.",
  tradeoffs: "Pierde calidad en instancias grandes; lo declaro como limitación.",
  aiUse: "Usé un asistente para generar casos de prueba y revisé cada uno a mano.",
};

function fieldsOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationFailure) return error.issues.map((issue) => issue.field).sort();
    throw error;
  }
  return [];
}

test("una defensa con enlace y texto se normaliza", () => {
  const parsed = parseDefenseInput({ ...valid, summary: `  ${valid.summary}  ` });
  assert.equal(parsed.summary, valid.summary);
  assert.equal(parsed.videoUrl, valid.videoUrl);
});

test("la defensa puede enviarse solo con texto: el enlace de video es opcional", () => {
  const parsed = parseDefenseInput({ ...valid, videoUrl: "" });
  assert.equal(parsed.videoUrl, null);
});

test("el enlace de la defensa debe ser https y no superar 300 caracteres", () => {
  assert.deepEqual(fieldsOf(() => parseDefenseInput({ ...valid, videoUrl: "http://video.example.test/x" })), ["videoUrl"]);
  assert.deepEqual(fieldsOf(() => parseDefenseInput({ ...valid, videoUrl: "javascript:alert(1)" })), ["videoUrl"]);
  assert.deepEqual(fieldsOf(() => parseDefenseInput({ ...valid, videoUrl: `https://a.test/${"x".repeat(300)}` })), ["videoUrl"]);
});

test("sin resumen y decisiones suficientes la defensa no se guarda", () => {
  assert.deepEqual(fieldsOf(() => parseDefenseInput({ ...valid, summary: "breve" })), ["summary"]);
  assert.deepEqual(fieldsOf(() => parseDefenseInput({ ...valid, decisions: "" })), ["decisions"]);
});

test("el uso de IA se declara sin juzgarlo: el campo es opcional y no penaliza", () => {
  const parsed = parseDefenseInput({ ...valid, aiUse: "" });
  assert.equal(parsed.aiUse, null);
});

test("solo se registra una defensa sobre una entrega enviada", () => {
  assert.equal(canRecordDefense("submitted"), true);
  assert.equal(canRecordDefense("draft"), false);
  assert.equal(canRecordDefense(null), false);
});
