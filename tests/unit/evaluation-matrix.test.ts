import test from "node:test";
import assert from "node:assert/strict";
import { criterionAverages, evaluationStateOf } from "../../src/lib/domain/evaluation.ts";

const rubric = [
  { id: "c1", label: "Comprensión", maxScore: 10 },
  { id: "c2", label: "Solución", maxScore: 10 },
];

test("el promedio por criterio se calcula sobre las evaluaciones finalizadas y redondea a un decimal", () => {
  assert.deepEqual(criterionAverages([{ c1: 9, c2: 8 }, { c1: 8, c2: 9 }], rubric), { c1: 8.5, c2: 8.5 });
  assert.deepEqual(criterionAverages([{ c1: 7 }, { c1: 6 }, { c1: 6 }], rubric), { c1: 6.3, c2: null });
  assert.deepEqual(criterionAverages([], rubric), { c1: null, c2: null });
});

test("el estado de la solución para la empresa no revela puntajes antes de publicar", () => {
  assert.equal(evaluationStateOf({ evaluations: 0, finalizedJudges: 0, published: false }), "sin_evaluar");
  assert.equal(evaluationStateOf({ evaluations: 1, finalizedJudges: 0, published: false }), "en_evaluacion");
  assert.equal(evaluationStateOf({ evaluations: 2, finalizedJudges: 2, published: false }), "lista_para_publicar");
  assert.equal(evaluationStateOf({ evaluations: 2, finalizedJudges: 2, published: true }), "publicada");
  assert.equal(evaluationStateOf({ evaluations: 1, finalizedJudges: 1, published: true }), "sin_completar");
});
