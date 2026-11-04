/**
 * Reglas PURAS del proceso de trabajo: bitácora de checkpoints (J5) y retroalimentación de la empresa (J8).
 * La bitácora la escribe la persona durante el challenge; la retroalimentación solo la ve la persona cuando la empresa la publica.
 */
import { ValidationFailure, type FieldIssue } from "./validation.ts";

export const CHECKPOINT_LIMITS = { text: { min: 20, max: 1000 }, link: 300 };
export const FEEDBACK_LIMITS = { text: { min: 20, max: 1500 } };

export interface CheckpointInput {
  text: string;
  link: string | null;
}

export interface FeedbackInput {
  text: string;
  publish: boolean;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Un checkpoint describe un avance o una decisión; el enlace es opcional y debe ser https. */
export function parseCheckpointInput(input: unknown): CheckpointInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: FieldIssue[] = [];
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  if (text.length < CHECKPOINT_LIMITS.text.min) {
    issues.push({ field: "text", message: `Describí el avance o la decisión (al menos ${CHECKPOINT_LIMITS.text.min} caracteres).` });
  } else if (text.length > CHECKPOINT_LIMITS.text.max) {
    issues.push({ field: "text", message: `El avance no puede superar ${CHECKPOINT_LIMITS.text.max} caracteres.` });
  }
  const link = typeof raw.link === "string" ? raw.link.trim() : "";
  if (link && (link.length > CHECKPOINT_LIMITS.link || !isHttpsUrl(link))) {
    issues.push({ field: "link", message: `El enlace debe empezar por https:// y tener hasta ${CHECKPOINT_LIMITS.link} caracteres.` });
  }
  if (issues.length) throw new ValidationFailure(issues);
  return { text, link: link || null };
}

/** La empresa redacta la retroalimentación; «publicar» decide si la persona la ve. */
export function parseFeedbackInput(input: unknown): FeedbackInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  if (text.length < FEEDBACK_LIMITS.text.min || text.length > FEEDBACK_LIMITS.text.max) {
    throw new ValidationFailure([{
      field: "text",
      message: `La retroalimentación tiene entre ${FEEDBACK_LIMITS.text.min} y ${FEEDBACK_LIMITS.text.max} caracteres.`,
    }]);
  }
  return { text, publish: raw.publish === true };
}

/** La persona solo ve la retroalimentación publicada. La empresa siempre ve su borrador. */
export function canViewFeedback(publishedAt: string | null, viewer: "company" | "participant"): boolean {
  return viewer === "company" || publishedAt !== null;
}
