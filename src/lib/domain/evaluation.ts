/** Reglas PURAS de evaluación: puntajes contra la rúbrica, consolidación por promedio y condición de publicación. */
import type { RubricCriterion } from "./types.ts";
import { ValidationFailure, type FieldIssue } from "./validation.ts";

/** Dos evaluaciones finalizadas por solución: la regla de publicación de la guía de estilo (decisión 8). */
export const EVALUATIONS_REQUIRED = 2;

export const RECOGNITIONS = ["ganador", "finalista", "mencion"] as const;
export type Recognition = (typeof RECOGNITIONS)[number];

export const RECOGNITION_LABEL: Record<Recognition, string> = {
  ganador: "Ganador",
  finalista: "Finalista",
  mencion: "Mención",
};

/** Puntajes por criterio: cada criterio de la rúbrica, un entero entre 0 y su máximo. La ponderación se aplica al total. */
export function parseScores(input: unknown, rubric: RubricCriterion[]): Record<string, number> {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: FieldIssue[] = [];
  const scores: Record<string, number> = {};
  for (const criterion of rubric) {
    const value = raw[criterion.id];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > criterion.maxScore) {
      issues.push({ field: `scores.${criterion.id}`, message: `${criterion.label}: el puntaje va de 0 a ${criterion.maxScore}.` });
    } else {
      scores[criterion.id] = value;
    }
  }
  if (issues.length) throw new ValidationFailure(issues);
  return scores;
}

/** Rúbrica ponderada: todos los criterios tienen peso (los pesos suman 100). Sin pesos, cada punto cuenta igual. */
export function isWeighted(rubric: RubricCriterion[]): boolean {
  return rubric.length > 0 && rubric.every((criterion) => typeof criterion.weight === "number");
}

/** Máximo del total: 100 con pesos; si no, la suma de los máximos de cada criterio. */
export function maxTotal(rubric: RubricCriterion[]): number {
  if (isWeighted(rubric)) return 100;
  return rubric.reduce((sum, criterion) => sum + criterion.maxScore, 0);
}

export function totalOf(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

/** Total de una evaluación. Con pesos, cada criterio aporta su peso según el puntaje relativo a su máximo. */
export function scoreOf(scores: Record<string, number>, rubric: RubricCriterion[]): number {
  if (!isWeighted(rubric)) return totalOf(scores);
  const total = rubric.reduce((sum, criterion) => sum + ((scores[criterion.id] ?? 0) / criterion.maxScore) * (criterion.weight ?? 0), 0);
  return Math.round(total * 10) / 10;
}

/** Promedio simple de los totales finalizados. Null si todavía no hay evaluaciones finalizadas. */
export function consolidatedAverage(totals: number[]): number | null {
  if (totals.length === 0) return null;
  const average = totals.reduce((sum, value) => sum + value, 0) / totals.length;
  return Math.round(average * 10) / 10;
}

/** Una solución se puede publicar cuando tiene las evaluaciones finalizadas requeridas, de jurados distintos. */
export function solutionReady(finalizedJudges: number): boolean {
  return finalizedJudges >= EVALUATIONS_REQUIRED;
}

export function parseRecognition(input: unknown): Recognition | null {
  if (input === null || input === "" || input === undefined) return null;
  if (typeof input === "string" && (RECOGNITIONS as readonly string[]).includes(input)) return input as Recognition;
  throw new ValidationFailure([{ field: "recognition", message: "Elegí un reconocimiento válido o ninguno." }]);
}

/** Promedio por criterio de las evaluaciones finalizadas de una solución. Null por criterio si no hay puntajes. */
export function criterionAverages(scoresList: Record<string, number>[], rubric: RubricCriterion[]): Record<string, number | null> {
  const averages: Record<string, number | null> = {};
  for (const criterion of rubric) {
    const values = scoresList.map((scores) => scores[criterion.id]).filter((value): value is number => typeof value === "number");
    averages[criterion.id] = values.length === 0
      ? null
      : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }
  return averages;
}

/**
 * Estado de una solución para la empresa. Sin resultados publicados, la empresa solo ve si la solución está en evaluación
 * o lista para publicar; los puntajes aparecen cuando C3 publica con puntajes visibles.
 */
export function evaluationStateOf(input: { evaluations: number; finalizedJudges: number; published: boolean }): "sin_evaluar" | "en_evaluacion" | "lista_para_publicar" | "publicada" | "sin_completar" {
  if (input.evaluations === 0) return "sin_evaluar";
  if (input.published) return solutionReady(input.finalizedJudges) ? "publicada" : "sin_completar";
  return solutionReady(input.finalizedJudges) ? "lista_para_publicar" : "en_evaluacion";
}
