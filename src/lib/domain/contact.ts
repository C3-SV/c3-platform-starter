/**
 * Reglas PURAS de talento para empresas: lista corta, solicitud de contacto con consentimiento y su ciclo de vida.
 * Nada de esto contrata a nadie: «Contactado» y «Seguimiento» registran conversaciones, no contrataciones.
 */
import type { PresentedState } from "./presentation.ts";
import { ValidationFailure } from "./validation.ts";

export type ContactStatus = "esperando_consentimiento" | "aceptado" | "declinado" | "contactado" | "seguimiento" | "revocado";
export type ContactActor = "company" | "participant";

export const SHORTLIST_REASON_LIMITS = { min: 10, max: 500 };
export const CONTACT_MESSAGE_MAX = 500;

/** Transiciones permitidas. Cualquier otra combinación queda rechazada en el servidor. */
const TRANSITIONS: Record<ContactStatus, readonly { actor: ContactActor; to: ContactStatus }[]> = {
  esperando_consentimiento: [
    { actor: "participant", to: "aceptado" },
    { actor: "participant", to: "declinado" },
  ],
  aceptado: [
    { actor: "company", to: "contactado" },
    { actor: "participant", to: "revocado" },
  ],
  contactado: [
    { actor: "company", to: "seguimiento" },
    { actor: "participant", to: "revocado" },
  ],
  seguimiento: [{ actor: "participant", to: "revocado" }],
  declinado: [],
  revocado: [],
};

/** Una solicitud activa todavía puede avanzar o revocarse; declinada y revocada son finales. */
export const ACTIVE_CONTACT_STATUSES: readonly ContactStatus[] = ["esperando_consentimiento", "aceptado", "contactado", "seguimiento"];

/** Estado inicial de toda solicitud nueva (null = todavía no hay solicitud). */
export function nextContactStatus(current: ContactStatus | null, actor: ContactActor, to: ContactStatus): ContactStatus {
  if (current === null) {
    if (to === "esperando_consentimiento" && actor === "company") return to;
    throw new ValidationFailure([{ field: "status", message: "Una solicitud nueva empieza esperando el consentimiento." }]);
  }
  if (!canTransitionContact(current, actor, to)) {
    throw new ValidationFailure([{ field: "status", message: "Esa acción no está disponible para el estado actual de la solicitud." }]);
  }
  return to;
}

export function canTransitionContact(current: ContactStatus | null, actor: ContactActor, to: ContactStatus): boolean {
  if (current === null) return to === "esperando_consentimiento" && actor === "company";
  return TRANSITIONS[current].some((rule) => rule.actor === actor && rule.to === to);
}

/** Motivo de no poder solicitar contacto, o null si la empresa puede solicitarlo. */
export function contactEligibilityIssue(input: {
  isLinkedRepresentative: boolean;
  hasShortlistEntry: boolean;
  hasApprovedEnrollment: boolean;
  hasActiveRequest: boolean;
}): string | null {
  if (!input.isLinkedRepresentative) return "Solo la representante vinculada a la empresa puede solicitar contacto.";
  if (!input.hasApprovedEnrollment) return "La persona necesita una inscripción aprobada en un challenge de la empresa.";
  if (!input.hasShortlistEntry) return "Agregá a la persona a la lista corta antes de solicitar contacto.";
  if (input.hasActiveRequest) return "Ya existe una solicitud activa para esta persona.";
  return null;
}

/** El motivo de la lista corta es cualitativo y obligatorio: explica por qué destaca la persona. */
export function parseShortlistReason(input: unknown): string {
  const value = typeof input === "string" ? input.trim() : "";
  if (value.length < SHORTLIST_REASON_LIMITS.min || value.length > SHORTLIST_REASON_LIMITS.max) {
    throw new ValidationFailure([{
      field: "reason",
      message: `Explicá por qué destaca (entre ${SHORTLIST_REASON_LIMITS.min} y ${SHORTLIST_REASON_LIMITS.max} caracteres).`,
    }]);
  }
  return value;
}

/** El mensaje que acompaña la solicitud es opcional. */
export function parseContactMessage(input: unknown): string | null {
  const value = typeof input === "string" ? input.trim() : "";
  if (!value) return null;
  if (value.length > CONTACT_MESSAGE_MAX) {
    throw new ValidationFailure([{ field: "message", message: `El mensaje no puede superar ${CONTACT_MESSAGE_MAX} caracteres.` }]);
  }
  return value;
}

/** Etiquetas por rol: la empresa ve el proceso; la persona ve qué le piden y qué puede decidir. */
export function contactStatePresentation(status: ContactStatus, viewer: ContactActor): PresentedState {
  if (viewer === "participant" && status === "esperando_consentimiento") return { label: "Te pidieron contacto", tone: "advertencia" };
  switch (status) {
    case "esperando_consentimiento": return { label: "Esperando consentimiento", tone: "advertencia" };
    case "aceptado": return { label: "Aceptado", tone: "exito" };
    case "declinado": return { label: "Declinado", tone: "neutro" };
    case "contactado": return { label: "Contactado", tone: "info" };
    case "seguimiento": return { label: "Seguimiento", tone: "info" };
    case "revocado": return { label: "Permiso revocado", tone: "neutro" };
  }
}
