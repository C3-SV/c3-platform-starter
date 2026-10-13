import test from "node:test";
import assert from "node:assert/strict";
import { consolidatedAverage, maxTotal, parseRecognition, parseScores, solutionReady, totalOf } from "../../src/lib/domain/evaluation.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

const rubric = [
  { id: "c1", label: "Calidad del resultado", maxScore: 10 },
  { id: "c2", label: "Claridad del enfoque", maxScore: 10 },
  { id: "c3", label: "Viabilidad", maxScore: 5 },
];

test("los puntajes deben cubrir cada criterio con enteros dentro de su máximo", () => {
  assert.deepEqual(parseScores({ c1: 8, c2: 7, c3: 5 }, rubric), { c1: 8, c2: 7, c3: 5 });
  assert.throws(() => parseScores({ c1: 8, c2: 7 }, rubric), ValidationFailure);
  assert.throws(() => parseScores({ c1: 11, c2: 7, c3: 5 }, rubric), ValidationFailure);
  assert.throws(() => parseScores({ c1: 7.5, c2: 7, c3: 5 }, rubric), ValidationFailure);
  assert.throws(() => parseScores({ c1: -1, c2: 7, c3: 5 }, rubric), ValidationFailure);
});

test("el total y el máximo se suman por criterio", () => {
  assert.equal(maxTotal(rubric), 25);
  assert.equal(totalOf({ c1: 8, c2: 7, c3: 5 }), 20);
});

test("el promedio consolida los jurados con un decimal y no existe sin evaluaciones", () => {
  assert.equal(consolidatedAverage([]), null);
  assert.equal(consolidatedAverage([20, 23]), 21.5);
  assert.equal(consolidatedAverage([20, 21, 22]), 21);
});

test("una solución está lista con dos jurados distintos que finalizaron", () => {
  assert.equal(solutionReady(1), false);
  assert.equal(solutionReady(2), true);
});

test("el reconocimiento es uno de los tres o ninguno", () => {
  assert.equal(parseRecognition("ganador"), "ganador");
  assert.equal(parseRecognition(""), null);
  assert.throws(() => parseRecognition("medalla de oro"), ValidationFailure);
});
