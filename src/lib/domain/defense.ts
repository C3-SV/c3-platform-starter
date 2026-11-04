/**
 * Defensa de una entrega: recurso separado de la entrega, con enlace opcional y texto que explica decisiones.
 * Describe el proceso sin juzgar el uso de herramientas de IA: la persona explica qué hizo y qué comprobó.
 */
import { ValidationFailure, type FieldIssue } from "./validation.ts";

export const DEFENSE_LIMITS = {
  videoUrl: 300,
  summary: { min: 40, max: 1500 },
  decisions: { min: 40, max: 1500 },
  optional: 1500,
};

export interface DefenseInput {
  videoUrl: string | null;
  summary: string;
  decisions: string;
  testing: string | null;
  tradeoffs: string | null;
  aiUse: string | null;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Valida la defensa. El enlace es opcional; el resumen y las decisiones son obligatorios. */
export function parseDefenseInput(input: unknown): DefenseInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: FieldIssue[] = [];
  const text = (field: string): string => (typeof raw[field] === "string" ? (raw[field] as string).trim() : "");
  const optional = (field: string, label: string): string | null => {
    const value = text(field);
    if (value.length > DEFENSE_LIMITS.optional) {
      issues.push({ field, message: `${label}: no puede superar ${DEFENSE_LIMITS.optional} caracteres.` });
    }
    return value || null;
  };
  const required = (field: string, limits: { min: number; max: number }, label: string): string => {
    const value = text(field);
    if (value.length < limits.min) issues.push({ field, message: `${label}: escribí al menos ${limits.min} caracteres.` });
    else if (value.length > limits.max) issues.push({ field, message: `${label}: no puede superar ${limits.max} caracteres.` });
    return value;
  };

  const videoUrl = text("videoUrl");
  if (videoUrl && (videoUrl.length > DEFENSE_LIMITS.videoUrl || !isHttpsUrl(videoUrl))) {
    issues.push({ field: "videoUrl", message: `El enlace de la defensa debe empezar por https:// y tener hasta ${DEFENSE_LIMITS.videoUrl} caracteres.` });
  }
  const summary = required("summary", DEFENSE_LIMITS.summary, "Resumen de la solución");
  const decisions = required("decisions", DEFENSE_LIMITS.decisions, "Decisiones principales");
  const testing = optional("testing", "Pruebas realizadas");
  const tradeoffs = optional("tradeoffs", "Trade-offs y limitaciones");
  const aiUse = optional("aiUse", "Uso de herramientas de IA");

  if (issues.length) throw new ValidationFailure(issues);
  return { videoUrl: videoUrl || null, summary, decisions, testing, tradeoffs, aiUse };
}

/** Solo una entrega enviada puede tener defensa: el borrador todavía puede cambiar. */
export function canRecordDefense(submissionStatus: string | null): boolean {
  return submissionStatus === "submitted";
}
