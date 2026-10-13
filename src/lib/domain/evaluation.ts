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

/** Puntajes por criterio: cada criterio de la rúbrica, un entero entre 0 y su máximo. Sin ponderaciones. */
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

export function maxTotal(rubric: RubricCriterion[]): number {
  return rubric.reduce((sum, criterion) => sum + criterion.maxScore, 0);
}

export function totalOf(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
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
