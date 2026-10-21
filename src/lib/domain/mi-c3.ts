/**
 * Mi C3: ordena las inscripciones y los retos asignados como jurado en cuatro estados que la persona
 * entiende de un vistazo. Reglas PURAS: no consultan Firebase ni reemplazan la autorización del servidor.
 *
 * - atencion: algo que le toca hacer a la persona (entregar, armar el equipo, evaluar).
 * - espera: depende de C3 u de otro proceso (revisión de una inscripción, cierre de entregas).
 * - en_curso: participación activa sin nada urgente (entrega enviada, entrega a cargo de la líder).
 * - finalizada: ya terminó (resultado, plazo cerrado, inscripción rechazada o cancelada).
 */
import type { DeliveryState } from "./delivery.ts";
import { deliveryPresentation, enrollmentState, type PresentedState } from "./presentation.ts";
import type { EnrollmentStatus, ParticipationMode } from "./types.ts";

export type ParticipationGroup = "atencion" | "espera" | "en_curso" | "finalizada";

export const GROUP_ORDER: readonly ParticipationGroup[] = ["atencion", "espera", "en_curso", "finalizada"];

export const GROUP_COPY: Record<ParticipationGroup, { title: string; short: string; description: string }> = {
  atencion: { title: "Requiere tu atención", short: "Atención", description: "Lo que te toca hacer a vos." },
  espera: { title: "En espera", short: "En espera", description: "Esperan una respuesta de C3 o el cierre de las entregas." },
  en_curso: { title: "En curso", short: "En curso", description: "Participaciones activas, sin nada urgente por ahora." },
  finalizada: { title: "Finalizadas", short: "Finalizadas", description: "Participaciones e inscripciones que ya terminaron." },
};

export type EnrollmentReason =
  | "sin_equipo"
  | "equipo_incompleto"
  | "entrega_pendiente"
  | "entrega_borrador"
  | "revision_c3"
  | "entregada"
  | "entrega_del_equipo"
  | "aprobada"
  | "resultado"
  | "sin_entrega"
  | "rechazada"
  | "cancelada";

export type AssignmentReason = "evaluar" | "esperando_cierre" | "completa" | "sin_soluciones";

/** Lo mínimo que se necesita saber de una inscripción; MyEnrollmentView lo cumple tal cual. */
export interface EnrollmentFacts {
  status: EnrollmentStatus;
  mode: ParticipationMode;
  submissionClosesAt: string | null;
  team: { status: "incompleto" | "habilitado"; role: "lider" | "integrante" } | null;
  delivery: { state: DeliveryState; canEdit: boolean } | null;
  result: object | null;
}

/** Lo mínimo que se necesita saber de un reto asignado como jurado. */
export interface AssignmentFacts {
  canEvaluate: boolean;
  solutions: number;
  finalized: number;
}

export type ParticipationEntry<E extends EnrollmentFacts, A extends AssignmentFacts> =
  | { kind: "inscripcion"; group: ParticipationGroup; reason: EnrollmentReason; item: E }
  | { kind: "jurado"; group: ParticipationGroup; reason: AssignmentReason; item: A };

/** Igual que el estado de entrega del servidor: sin fecha de cierre, el plazo no se considera vencido. */
function hasClosed(closesAt: string | null, now: Date): boolean {
  return closesAt !== null && now.getTime() >= Date.parse(closesAt);
}

export function classifyEnrollment(item: EnrollmentFacts, now: Date): { group: ParticipationGroup; reason: EnrollmentReason } {
  if (item.status === "pending") return { group: "espera", reason: "revision_c3" };
  if (item.status === "rejected") return { group: "finalizada", reason: "rechazada" };
  if (item.status === "cancelled") return { group: "finalizada", reason: "cancelada" };

  // Aprobada.
  if (item.result) return { group: "finalizada", reason: "resultado" };
  if (item.delivery?.state === "entregada") return { group: "en_curso", reason: "entregada" };
  // Sin entrega enviada, con el plazo vencido ya no hay nada que hacer.
  if (item.delivery?.state === "fuera_de_plazo" || hasClosed(item.submissionClosesAt, now)) {
    return { group: "finalizada", reason: "sin_entrega" };
  }
  if (item.mode === "team") {
    if (!item.team) return { group: "atencion", reason: "sin_equipo" };
    if (item.team.status === "incompleto") return { group: "atencion", reason: "equipo_incompleto" };
  }
  if (item.delivery?.state === "sin_entrega" || item.delivery?.state === "borrador") {
    // Solo la líder del equipo envía; quien no puede editar y no tiene equipo no tiene nada que hacer.
    if (!item.delivery.canEdit) return { group: "en_curso", reason: item.team ? "entrega_del_equipo" : "aprobada" };
    return { group: "atencion", reason: item.delivery.state === "borrador" ? "entrega_borrador" : "entrega_pendiente" };
  }
  return { group: "en_curso", reason: "aprobada" };
}

export function classifyAssignment(item: AssignmentFacts): { group: ParticipationGroup; reason: AssignmentReason } {
  if (!item.canEvaluate) return { group: "espera", reason: "esperando_cierre" };
  if (item.solutions === 0) return { group: "finalizada", reason: "sin_soluciones" };
  if (item.finalized >= item.solutions) return { group: "finalizada", reason: "completa" };
  return { group: "atencion", reason: "evaluar" };
}

/** Etiqueta de estado de la tarjeta: la del vocabulario de la guía y, donde no existe, una propia de Mi C3. */
export function enrollmentReasonState(reason: EnrollmentReason, item: Pick<EnrollmentFacts, "status" | "delivery">): PresentedState {
  switch (reason) {
    case "sin_equipo": return { label: "Sin equipo", tone: "advertencia" };
    case "equipo_incompleto": return { label: "Equipo incompleto", tone: "advertencia" };
    case "entrega_pendiente": return deliveryPresentation("sin_entrega");
    case "entrega_borrador": return deliveryPresentation("borrador");
    case "entregada": return deliveryPresentation("entregada");
    case "entrega_del_equipo": return deliveryPresentation(item.delivery?.state ?? "sin_entrega");
    case "sin_entrega": return deliveryPresentation("fuera_de_plazo");
    case "resultado": return { label: "Resultado publicado", tone: "exito" };
    case "revision_c3":
    case "aprobada":
    case "rechazada":
    case "cancelada": return enrollmentState(item.status);
  }
}

export function assignmentReasonState(reason: AssignmentReason): PresentedState {
  switch (reason) {
    case "evaluar": return { label: "Disponible", tone: "info" };
    case "esperando_cierre": return { label: "Esperando el cierre", tone: "neutro" };
    case "completa": return { label: "Completa", tone: "exito" };
    case "sin_soluciones": return { label: "Sin soluciones", tone: "neutro" };
  }
}

export interface ParticipationOverview<E extends EnrollmentFacts, A extends AssignmentFacts> {
  groups: Record<ParticipationGroup, ParticipationEntry<E, A>[]>;
  counts: Record<ParticipationGroup, number>;
  total: number;
  /** Inscripciones que esperan específicamente la respuesta de C3. */
  awaitingC3: number;
  /** Primera acción pendiente con fecha de cierre futura, la más próxima. */
  nextDeadline: Extract<ParticipationEntry<E, A>, { kind: "inscripcion" }> | null;
}

/** Cierre de entrega todavía no vencido; las entradas sin fecha van al final al ordenar. */
function closingTime(entry: ParticipationEntry<EnrollmentFacts, AssignmentFacts>, now: Date): number {
  if (entry.kind !== "inscripcion" || entry.item.submissionClosesAt === null) return Number.POSITIVE_INFINITY;
  const time = Date.parse(entry.item.submissionClosesAt);
  return time > now.getTime() ? time : Number.POSITIVE_INFINITY;
}

export function organizeParticipation<E extends EnrollmentFacts, A extends AssignmentFacts>(
  enrollments: readonly E[],
  assignments: readonly A[],
  now: Date,
): ParticipationOverview<E, A> {
  const groups: Record<ParticipationGroup, ParticipationEntry<E, A>[]> = { atencion: [], espera: [], en_curso: [], finalizada: [] };
  for (const item of enrollments) {
    const { group, reason } = classifyEnrollment(item, now);
    groups[group].push({ kind: "inscripcion", group, reason, item });
  }
  for (const item of assignments) {
    const { group, reason } = classifyAssignment(item);
    groups[group].push({ kind: "jurado", group, reason, item });
  }
  // Lo que cierra antes va primero; el resto conserva el orden recibido (array.sort es estable).
  groups.atencion.sort((a, b) => closingTime(a, now) - closingTime(b, now));

  const counts: Record<ParticipationGroup, number> = {
    atencion: groups.atencion.length,
    espera: groups.espera.length,
    en_curso: groups.en_curso.length,
    finalizada: groups.finalizada.length,
  };
  const next = groups.atencion.find((entry): entry is Extract<ParticipationEntry<E, A>, { kind: "inscripcion" }> =>
    entry.kind === "inscripcion" && Number.isFinite(closingTime(entry, now)),
  );
  return {
    groups,
    counts,
    total: counts.atencion + counts.espera + counts.en_curso + counts.finalizada,
    awaitingC3: groups.espera.filter((entry) => entry.kind === "inscripcion").length,
    nextDeadline: next ?? null,
  };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Frase de estado general. Nunca dice que la persona está «al día» si le queda algo por hacer, y nombra
 * la espera de C3 como espera (no como una tarea pendiente suya).
 */
export function overviewMessage(overview: Pick<ParticipationOverview<EnrollmentFacts, AssignmentFacts>, "counts" | "total" | "awaitingC3">): string {
  const { counts, total, awaitingC3 } = overview;
  if (total === 0) return "Todavía no participás en ninguna experiencia.";
  const enrollments = plural(awaitingC3, "inscripción", "inscripciones");
  if (counts.atencion > 0) {
    const attention = counts.atencion === 1 ? "1 acción que requiere tu atención" : `${counts.atencion} acciones que requieren tu atención`;
    return awaitingC3 > 0
      ? `Tenés ${attention} y ${enrollments} en espera de la respuesta de C3.`
      : `Tenés ${attention}.`;
  }
  if (awaitingC3 > 0) return `No tenés acciones pendientes. Estás esperando la respuesta de C3 sobre ${enrollments}.`;
  if (counts.en_curso > 0) return `No tenés acciones pendientes. Tenés ${plural(counts.en_curso, "participación", "participaciones")} en curso.`;
  return "No tenés acciones pendientes.";
}
