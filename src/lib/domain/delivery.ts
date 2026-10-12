/** Reglas PURAS de entregas: validación de la entrega y estado visible. No reemplazan la autorización del servidor. */
import { ValidationFailure, type FieldIssue } from "./validation.ts";

export const DELIVERY_TEXT_MAX = 4000;
export const DELIVERY_TEXT_MIN_TO_SUBMIT = 20;
export const DELIVERY_MAX_LINKS = 5;
export const DELIVERY_LINK_MAX = 300;

export interface DeliveryInput {
  text: string;
  links: string[];
  submit: boolean;
}

export type DeliveryState = "sin_entrega" | "borrador" | "entregada" | "fuera_de_plazo";

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

/** Valida una entrega. Guardar un borrador exige poco; enviar exige descripción y al menos un enlace. */
export function parseDeliveryInput(input: unknown): DeliveryInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: FieldIssue[] = [];
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  const submit = raw.submit === true;

  if (text.length > DELIVERY_TEXT_MAX) {
    issues.push({ field: "text", message: `La descripción puede tener hasta ${DELIVERY_TEXT_MAX} caracteres.` });
  }

  const links = Array.isArray(raw.links)
    ? raw.links.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
  const uniqueLinks = [...new Set(links)];
  if (uniqueLinks.length > DELIVERY_MAX_LINKS) {
    issues.push({ field: "links", message: `Podés agregar hasta ${DELIVERY_MAX_LINKS} enlaces.` });
  } else if (uniqueLinks.some((link) => link.length > DELIVERY_LINK_MAX || !isHttpsUrl(link))) {
    issues.push({ field: "links", message: "Cada enlace debe empezar con https:// y ser una dirección válida." });
  }

  if (submit) {
    if (text.length < DELIVERY_TEXT_MIN_TO_SUBMIT) {
      issues.push({ field: "text", message: `Para enviar, describí la solución con al menos ${DELIVERY_TEXT_MIN_TO_SUBMIT} caracteres.` });
    }
    if (uniqueLinks.length < 1) {
      issues.push({ field: "links", message: "Para enviar, agregá al menos un enlace (repositorio, demo o video)." });
    }
  }

  if (issues.length) throw new ValidationFailure(issues);
  return { text, links: uniqueLinks, submit };
}

/**
 * Estado visible de la entrega. Una entrega enviada permanece estable; una borrador o sin entrega
 * pasa a «fuera de plazo» cuando cierra la ventana de edición.
 */
export function deliveryState(
  submission: { status: "draft" | "submitted" } | null,
  submissionClosesAt: string | null,
  now: Date,
): DeliveryState {
  if (submission?.status === "submitted") return "entregada";
  const closed = submissionClosesAt !== null && now.getTime() >= Date.parse(submissionClosesAt);
  if (closed) return "fuera_de_plazo";
  return submission ? "borrador" : "sin_entrega";
}

export function canEditDelivery(submissionClosesAt: string | null, now: Date): boolean {
  return submissionClosesAt !== null && now.getTime() < Date.parse(submissionClosesAt);
}
