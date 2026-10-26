/**
 * Estados visibles de experiencias y challenges, según el vocabulario de la guía de estilo
 * (diseno-claude/README.md, sección 5). Las etiquetas y los tonos son las únicas fuentes de UI.
 */
import type { EnrollmentStatus, ExperienceKind, ExperienceLine, ExperienceModality, ExperienceStatus } from "./types.ts";
import type { DeliveryState } from "./delivery.ts";

export type StateTone = "neutro" | "info" | "exito" | "advertencia" | "error";

export interface PresentedState {
  label: string;
  tone: StateTone;
}

export interface WindowDates {
  opensAt?: string | null;
  closesAt?: string | null;
}

/** Estado que ve el público. Depende del estado guardado y de las fechas de inscripción o de entrega. */
export function presentState(status: ExperienceStatus, dates: WindowDates, now: Date): PresentedState {
  if (status === "draft") return { label: "Borrador", tone: "neutro" };
  if (status === "cancelled") return { label: "Cancelado", tone: "error" };
  if (status === "closed") return { label: "Concluido", tone: "exito" };
  const opens = dates.opensAt ? Date.parse(dates.opensAt) : null;
  const closes = dates.closesAt ? Date.parse(dates.closesAt) : null;
  if (opens !== null && now.getTime() < opens) return { label: "Próximo", tone: "neutro" };
  if (closes !== null && now.getTime() >= closes) return { label: "En evaluación", tone: "info" };
  return { label: "Abierto", tone: "info" };
}

/** Línea de color por tipo de experiencia (regla 2 de la guía de estilo). */
export const KIND_LABEL: Record<ExperienceKind, string> = {
  competencia: "Compite · Competencia",
  hackathon: "Crea · Hackathon",
  challenge_empresarial: "Conecta · Challenge",
  taller: "Crea · Taller",
  charla: "Conecta · Charla",
  encuentro: "Conecta · Encuentro",
};

export const KIND_LINE: Record<ExperienceKind, ExperienceLine> = {
  competencia: "compite",
  hackathon: "crea",
  challenge_empresarial: "conecta",
  taller: "crea",
  charla: "conecta",
  encuentro: "conecta",
};

export const LINE_NAME: Record<ExperienceLine, string> = { compite: "Compite", crea: "Crea", conecta: "Conecta" };

/** Nombre del tipo de experiencia sin la línea, para combinarlo con la línea principal elegida. */
export const KIND_NAME: Record<ExperienceKind, string> = {
  competencia: "Competencia",
  hackathon: "Hackathon",
  challenge_empresarial: "Challenge",
  taller: "Taller",
  charla: "Charla",
  encuentro: "Encuentro",
};

export const MODALITY_LABEL: Record<ExperienceModality, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  hibrida: "Híbrida",
};

/**
 * Etiqueta «Línea · Tipo» de una experiencia. Respeta la línea principal elegida por C3 y, sin ella,
 * usa la línea del tipo (idéntico a KIND_LABEL para las experiencias anteriores).
 */
export function experienceLabel(experience: { kind: ExperienceKind; primaryLine?: ExperienceLine }): string {
  const line = experience.primaryLine && experience.primaryLine in LINE_NAME ? experience.primaryLine : KIND_LINE[experience.kind];
  return `${LINE_NAME[line]} · ${KIND_NAME[experience.kind]}`;
}

/** Línea principal visible de una experiencia, con la del tipo como respaldo. */
export function primaryLineOf(experience: { kind: ExperienceKind; primaryLine?: ExperienceLine }): ExperienceLine {
  return experience.primaryLine && experience.primaryLine in LINE_NAME ? experience.primaryLine : KIND_LINE[experience.kind];
}

/** Valor CSS del color de línea. Usa las variables --c3-compite, --c3-crea y --c3-conecta de tokens.css. */
export function lineColor(kind: ExperienceKind): string {
  return `var(--c3-${KIND_LINE[kind]})`;
}

/** Texto legible para la línea Crea (turquesa no se usa como texto sobre fondo claro). */
export function lineTextColor(kind: ExperienceKind): string {
  return lineTextColorOf(KIND_LINE[kind]);
}

/** Color de la línea indicada; úsese con la línea principal de la experiencia. */
export function lineColorOf(line: ExperienceLine): string {
  return `var(--c3-${line})`;
}

export function lineTextColorOf(line: ExperienceLine): string {
  return line === "crea" ? "var(--c3-crea-texto)" : `var(--c3-${line})`;
}

/** Estados de inscripción (vocabulario de la guía, sección 5). */
export function enrollmentState(status: EnrollmentStatus): PresentedState {
  switch (status) {
    case "pending": return { label: "Pendiente", tone: "advertencia" };
    case "approved": return { label: "Aprobada", tone: "exito" };
    case "rejected": return { label: "Rechazada", tone: "error" };
    case "cancelled": return { label: "Cancelada", tone: "neutro" };
  }
}

/** Estados de entrega (vocabulario de la guía, sección 5). */
export function deliveryPresentation(state: DeliveryState): PresentedState {
  switch (state) {
    case "sin_entrega": return { label: "Sin entrega", tone: "neutro" };
    case "borrador": return { label: "Borrador", tone: "advertencia" };
    case "entregada": return { label: "Entregada", tone: "exito" };
    case "fuera_de_plazo": return { label: "Fuera de plazo", tone: "error" };
  }
}

/** Estados de equipo (vocabulario de la guía, sección 5). */
export function teamPresentation(status: "incompleto" | "habilitado"): PresentedState {
  return status === "habilitado"
    ? { label: "Habilitado", tone: "exito" }
    : { label: "Incompleto", tone: "advertencia" };
}
