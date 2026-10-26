/** Reglas PURAS de propuestas de empresa: validación pública, estados y pasos siguientes. */
import type { PresentedState } from "./presentation.ts";
import { ValidationFailure, type FieldIssue } from "./validation.ts";

export type ProposalStatus = "received" | "needs_changes" | "accepted" | "not_prioritized";

export interface ProposalInput {
  companyName: string;
  contactName: string;
  contactEmail: string;
  problem: string;
  desiredOutcome: string;
  constraints: string;
}

export const PROPOSAL_LIMITS = {
  companyName: { min: 2, max: 120 },
  contactName: { min: 3, max: 120 },
  problem: { min: 40, max: 2000 },
  optionalMax: 1000,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Estados de propuesta. Los nombres finales siguen abiertos en la bitácora (sección 5 de la guía): se muestran tal cual. */
export function proposalPresentation(status: ProposalStatus): PresentedState {
  switch (status) {
    case "received": return { label: "En revisión", tone: "info" };
    case "needs_changes": return { label: "Requiere ajustes", tone: "advertencia" };
    case "accepted": return { label: "Aceptada", tone: "exito" };
    case "not_prioritized": return { label: "No priorizada", tone: "neutro" };
  }
}

/** Lo que la empresa ve como siguiente paso, según el estado. */
export function proposalNextStep(status: ProposalStatus): string {
  switch (status) {
    case "received": return "C3 te escribirá al correo de contacto.";
    case "needs_changes": return "C3 pidió ajustes. Respondé al correo de contacto.";
    case "accepted": return "C3 aceptó la propuesta y define el challenge contigo.";
    case "not_prioritized": return "Por ahora no la priorizamos. Gracias por proponerla.";
  }
}

/** El campo trampa (honeypot) lo completan solo los bots: si llega con texto, la propuesta se descarta en silencio. */
export function isHoneypotFilled(raw: Record<string, unknown>): boolean {
  return typeof raw.website === "string" && raw.website.trim().length > 0;
}

/** Valida la propuesta pública. Devuelve los datos normalizados o lanza ValidationFailure con motivos por campo. */
export function parseProposalInput(input: unknown): ProposalInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: FieldIssue[] = [];
  const text = (field: string, min: number, max: number, label: string): string => {
    const value = typeof raw[field] === "string" ? (raw[field] as string).trim() : "";
    if (value.length < min) issues.push({ field, message: `${label}: escribí al menos ${min} caracteres.` });
    else if (value.length > max) issues.push({ field, message: `${label}: no puede superar ${max} caracteres.` });
    return value;
  };
  const optional = (field: string, label: string): string => {
    const value = typeof raw[field] === "string" ? (raw[field] as string).trim() : "";
    if (value.length > PROPOSAL_LIMITS.optionalMax) {
      issues.push({ field, message: `${label}: no puede superar ${PROPOSAL_LIMITS.optionalMax} caracteres.` });
    }
    return value;
  };

  const companyName = text("companyName", PROPOSAL_LIMITS.companyName.min, PROPOSAL_LIMITS.companyName.max, "Organización");
  const contactName = text("contactName", PROPOSAL_LIMITS.contactName.min, PROPOSAL_LIMITS.contactName.max, "Tu nombre y cargo");
  const contactEmail = typeof raw.contactEmail === "string" ? raw.contactEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(contactEmail) || contactEmail.length > 200) {
    issues.push({ field: "contactEmail", message: "Revisá el formato del correo de contacto." });
  }
  const problem = text("problem", PROPOSAL_LIMITS.problem.min, PROPOSAL_LIMITS.problem.max, "¿Cuál es el problema?");
  const desiredOutcome = optional("desiredOutcome", "¿Qué resultado les gustaría explorar?");
  const constraints = optional("constraints", "Datos y límites de confidencialidad");
  if (raw.consent !== true) {
    issues.push({ field: "consent", message: "Para enviar la propuesta, aceptá que C3 te contacte por ese correo." });
  }

  if (issues.length) throw new ValidationFailure(issues);
  return { companyName, contactName, contactEmail, problem, desiredOutcome, constraints };
}

/** Transiciones de revisión por C3. Pedir ajustes exige una nota para la empresa. */
export function parseReviewInput(input: unknown): { status: ProposalStatus; note: string; organizationId: string | null } {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const statuses: readonly string[] = ["needs_changes", "accepted", "not_prioritized"];
  if (typeof raw.status !== "string" || !statuses.includes(raw.status)) {
    throw new ValidationFailure([{ field: "status", message: "Elegí una revisión: pedir ajustes, aceptar o no priorizar." }]);
  }
  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  if (raw.status === "needs_changes" && (note.length < 10 || note.length > 1000)) {
    throw new ValidationFailure([{ field: "note", message: "Explicá qué ajustes necesitás (entre 10 y 1000 caracteres)." }]);
  }
  const organizationId = typeof raw.organizationId === "string" && raw.organizationId.trim() ? raw.organizationId.trim() : null;
  return { status: raw.status as ProposalStatus, note, organizationId };
}
