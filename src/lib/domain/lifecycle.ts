/**
 * Ciclo de vida de una experiencia (reglas PURAS; la autorización vive en el servidor).
 * Estados guardados: draft, published, closed, cancelled. Que las inscripciones estén abiertas o cerradas
 * NO es un estado guardado: sale de la ventana (registrationOpensAt / registrationClosesAt) y de la hora.
 */
import { formatDateTime } from "./format.ts";
import { primaryLineOf } from "./presentation.ts";
import type { Experience, ExperienceKind, ExperienceStatus } from "./types.ts";
import type { ExperienceInput, FieldIssue, RegistrationActionInput } from "./validation.ts";

/** Tipos que son una sesión con fecha, modalidad y lugar; para publicarlos esos datos son obligatorios. */
export const SESSION_KINDS: readonly ExperienceKind[] = ["taller", "charla", "encuentro"];
/** Tipos que se esperan con al menos un reto técnico. */
export const CHALLENGE_KINDS: readonly ExperienceKind[] = ["competencia", "hackathon", "challenge_empresarial"];

export interface EnrollmentCounts {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  /** Pendientes + aprobadas: las que ocupan cupo. */
  active: number;
  total: number;
}

/** Datos que hacen falta para decidir qué se puede cambiar y qué sigue. Los calcula el servidor. */
export interface ExperienceStats {
  challenges: number;
  enrollments: EnrollmentCounts;
}

export function emptyEnrollmentCounts(): EnrollmentCounts {
  return { pending: 0, approved: 0, rejected: 0, cancelled: 0, active: 0, total: 0 };
}

export function countEnrollments(statuses: Iterable<string>): EnrollmentCounts {
  const counts = emptyEnrollmentCounts();
  for (const status of statuses) {
    if (status === "pending" || status === "approved" || status === "rejected" || status === "cancelled") {
      counts[status] += 1;
      counts.total += 1;
    }
  }
  counts.active = counts.pending + counts.approved;
  return counts;
}

/** Cupos libres, o null si la experiencia no tiene límite. Nunca negativo. */
export function spotsLeft(experience: Pick<Experience, "capacity">, enrollments: Pick<EnrollmentCounts, "active">): number | null {
  const capacity = experience.capacity ?? null;
  return capacity === null ? null : Math.max(0, capacity - enrollments.active);
}

// ---------------------------------------------------------------------------------------------
// Etapa visible para el administrador
// ---------------------------------------------------------------------------------------------

export type RegistrationPhase = "upcoming" | "open" | "closed";

/** Fase de la ventana de inscripción. Sin fechas, la ventana está abierta. */
export function registrationPhase(experience: Pick<Experience, "registrationOpensAt" | "registrationClosesAt">, now: Date): RegistrationPhase {
  const opens = experience.registrationOpensAt ? Date.parse(experience.registrationOpensAt) : null;
  const closes = experience.registrationClosesAt ? Date.parse(experience.registrationClosesAt) : null;
  if (opens !== null && now.getTime() < opens) return "upcoming";
  if (closes !== null && now.getTime() >= closes) return "closed";
  return "open";
}

export type LifecycleStage =
  | "borrador"
  | "publicada"
  | "inscripciones_abiertas"
  | "inscripciones_cerradas"
  | "en_desarrollo"
  | "concluida"
  | "cancelada";

export interface LifecycleView {
  stage: LifecycleStage;
  label: string;
}

/** Etapa operativa para Admin; más fina que el estado público (que usa presentExperienceState). */
export function lifecycleOf(experience: Pick<Experience, "status" | "registrationOpensAt" | "registrationClosesAt" | "startsAt" | "endsAt">, now: Date): LifecycleView {
  switch (experience.status) {
    case "draft": return { stage: "borrador", label: "Borrador" };
    case "cancelled": return { stage: "cancelada", label: "Cancelada" };
    case "closed": return { stage: "concluida", label: "Concluida" };
    case "published": break;
  }
  const phase = registrationPhase(experience, now);
  if (phase === "upcoming") return { stage: "publicada", label: "Publicada · inscripciones próximas" };
  if (phase === "open") return { stage: "inscripciones_abiertas", label: "Inscripciones abiertas" };
  const starts = experience.startsAt ? Date.parse(experience.startsAt) : null;
  if (starts !== null && now.getTime() < starts) return { stage: "inscripciones_cerradas", label: "Inscripciones cerradas" };
  return { stage: "en_desarrollo", label: "En desarrollo" };
}

// ---------------------------------------------------------------------------------------------
// Transiciones de estado
// ---------------------------------------------------------------------------------------------

/**
 * Transiciones permitidas. draft → closed existe para registrar una experiencia histórica sin pasar por
 * «publicada» (así nunca abre inscripciones). Una experiencia concluida no vuelve a ningún otro estado.
 */
export const STATUS_TRANSITIONS: Record<ExperienceStatus, readonly ExperienceStatus[]> = {
  draft: ["published", "closed", "cancelled"],
  published: ["draft", "closed", "cancelled"],
  closed: [],
  cancelled: ["draft"],
};

/** Rechazo con código estable y mensaje para la persona; `issues` marca campos concretos. */
export interface Refusal {
  ok: false;
  code: string;
  message: string;
  issues?: FieldIssue[];
}

export type Check = { ok: true } | Refusal;

const ok: Check = { ok: true };

function refuse(code: string, message: string, issues?: FieldIssue[]): Refusal {
  return { ok: false, code, message, ...(issues ? { issues } : {}) };
}

/** Datos mínimos para que una experiencia sea publicable. Solo mira lo que cambia la experiencia del público. */
export function publishIssues(
  experience: Pick<Experience, "kind" | "modality" | "startsAt" | "endsAt" | "location" | "registrationClosesAt">,
  now: Date,
  options: { checkRegistrationWindow: boolean },
): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (SESSION_KINDS.includes(experience.kind)) {
    if (!experience.modality) issues.push({ field: "modality", message: "Para publicar, elegí la modalidad: presencial, virtual o híbrida." });
    if (!experience.startsAt) issues.push({ field: "startsAt", message: "Para publicar, indicá la fecha y hora de inicio." });
    if (!experience.location) issues.push({ field: "location", message: "Para publicar, indicá la sede o el enlace de la sesión." });
  }
  if (options.checkRegistrationWindow) {
    if (experience.registrationClosesAt && Date.parse(experience.registrationClosesAt) <= now.getTime()) {
      issues.push({ field: "registrationClosesAt", message: "La fecha de cierre de inscripciones ya pasó: corregila, o marcá la experiencia como concluida si es histórica." });
    }
    if (experience.endsAt && Date.parse(experience.endsAt) <= now.getTime()) {
      issues.push({ field: "endsAt", message: "La sesión ya terminó: marcá la experiencia como concluida en vez de publicarla." });
    }
  }
  return issues;
}

/** Valida un cambio de estado. `totalEnrollments` incluye pendientes, aprobadas, rechazadas y canceladas. */
export function checkStatusTransition(
  experience: Pick<Experience, "status" | "kind" | "modality" | "startsAt" | "endsAt" | "location" | "registrationClosesAt">,
  to: ExperienceStatus,
  totalEnrollments: number,
  now: Date,
): Check {
  const from = experience.status;
  if (from === to) return ok;
  if (from === "closed") {
    return refuse("experiencia_historica", "Una experiencia concluida es histórica: no se reabre ni vuelve a publicarse.");
  }
  if (!STATUS_TRANSITIONS[from].includes(to)) {
    return refuse("transicion_invalida", "Ese cambio de estado no está permitido desde el estado actual.");
  }
  if (to === "published") {
    const issues = publishIssues(experience, now, { checkRegistrationWindow: true });
    if (issues.length) return refuse("no_publicable", "Todavía faltan datos para publicar la experiencia.", issues);
  }
  if (to === "draft" && from === "published" && totalEnrollments > 0) {
    return refuse("tiene_inscripciones", "Ya tiene inscripciones: no puede volver a borrador. Cancelala o concluila si corresponde.");
  }
  return ok;
}

/** Los retos usan las mismas transiciones, sin requisitos de publicación propios. */
export function checkChallengeStatusTransition(from: ExperienceStatus, to: ExperienceStatus): Check {
  if (from === to) return ok;
  if (from === "closed") return refuse("reto_historico", "Un reto concluido es histórico: no se reabre ni vuelve a publicarse.");
  if (!STATUS_TRANSITIONS[from].includes(to)) return refuse("transicion_invalida", "Ese cambio de estado no está permitido desde el estado actual.");
  return ok;
}

// ---------------------------------------------------------------------------------------------
// Apertura y cierre manual de inscripciones
// ---------------------------------------------------------------------------------------------

export type RegistrationWindowResult =
  | { ok: true; registrationOpensAt: string | null; registrationClosesAt: string | null }
  | Refusal;

/** Calcula la nueva ventana al abrir o cerrar inscripciones a mano. No escribe nada. */
export function applyRegistrationAction(
  experience: Pick<Experience, "status" | "registrationOpensAt" | "registrationClosesAt" | "endsAt">,
  input: RegistrationActionInput,
  now: Date,
): RegistrationWindowResult {
  if (experience.status !== "published") {
    return refuse("no_publicada", "Solo se abren o cierran inscripciones de una experiencia publicada.");
  }
  const phase = registrationPhase(experience, now);
  const stamp = now.toISOString();

  if (input.action === "close") {
    if (phase !== "open") {
      return refuse("no_abiertas", "Las inscripciones no están abiertas, así que no hay nada que cerrar.");
    }
    return { ok: true, registrationOpensAt: experience.registrationOpensAt, registrationClosesAt: stamp };
  }

  if (phase === "open") {
    return refuse("ya_abiertas", "Las inscripciones ya están abiertas.");
  }
  if (experience.endsAt && Date.parse(experience.endsAt) <= now.getTime()) {
    return refuse("sesion_terminada", "La sesión ya terminó: no se pueden abrir inscripciones.");
  }
  let closesAt = input.registrationClosesAt ?? (phase === "upcoming" ? experience.registrationClosesAt : null);
  if (phase === "closed" && !input.registrationClosesAt) {
    return refuse("falta_cierre", "Para reabrir las inscripciones, indicá hasta cuándo quedan abiertas.", [
      { field: "registrationClosesAt", message: "Inscripciones cierran: indicá una fecha futura para reabrir." },
    ]);
  }
  if (closesAt && Date.parse(closesAt) <= now.getTime()) {
    return refuse("cierre_pasado", "La fecha de cierre debe ser futura.", [
      { field: "registrationClosesAt", message: "Inscripciones cierran: la fecha debe ser futura." },
    ]);
  }
  if (closesAt && experience.endsAt && Date.parse(closesAt) > Date.parse(experience.endsAt)) {
    return refuse("cierre_posterior_a_sesion", "Las inscripciones deben cerrar antes de que termine la sesión.", [
      { field: "registrationClosesAt", message: "Inscripciones cierran: debe ser antes de que termine la sesión." },
    ]);
  }
  closesAt = closesAt ?? null;
  // Al abrir, la apertura es ahora; si ya había abierto antes (reapertura), se conserva la fecha original.
  const opensAt = phase === "closed" ? experience.registrationOpensAt : stamp;
  return { ok: true, registrationOpensAt: opensAt, registrationClosesAt: closesAt };
}

// ---------------------------------------------------------------------------------------------
// Qué se puede editar
// ---------------------------------------------------------------------------------------------

/** Campos cuyo cambio puede invalidar inscripciones o dejar inconsistente el historial. */
export const GUARDED_FIELDS = ["kind", "modality", "startsAt", "endsAt", "registrationOpensAt", "registrationClosesAt", "capacity"] as const;
export type GuardedField = (typeof GUARDED_FIELDS)[number];

/**
 * Campos bloqueados y el motivo. Una experiencia concluida o cancelada conserva su calendario y cupos
 * como registro histórico; con retos o inscripciones, el tipo ya no cambia.
 */
export function lockedFields(
  experience: Pick<Experience, "status">,
  stats: Pick<ExperienceStats, "challenges"> & { enrollments: Pick<EnrollmentCounts, "total"> },
): Partial<Record<GuardedField, string>> {
  const locks: Partial<Record<GuardedField, string>> = {};
  if (experience.status === "closed" || experience.status === "cancelled") {
    const reason = experience.status === "closed"
      ? "La experiencia ya concluyó: este dato queda como registro histórico."
      : "La experiencia está cancelada: este dato queda como registro.";
    for (const field of GUARDED_FIELDS) locks[field] = reason;
    return locks;
  }
  if (stats.challenges > 0 || stats.enrollments.total > 0) {
    locks.kind = "Ya tiene retos o inscripciones: el tipo de experiencia no se puede cambiar.";
  }
  return locks;
}

function sameDate(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Date.parse(a) === Date.parse(b);
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? null) === (b ?? null);
}

/** Campos de la entrada que difieren de lo guardado. Sirve para actualizar solo lo modificado y auditarlo. */
export function changedFields(existing: Experience, input: ExperienceInput): string[] {
  const changed: string[] = [];
  if (existing.title !== input.title) changed.push("title");
  if (existing.summary !== input.summary) changed.push("summary");
  if (existing.kind !== input.kind) changed.push("kind");
  if (primaryLineOf(existing) !== input.primaryLine) changed.push("primaryLine");
  const currentSecondary = (existing.secondaryLines ?? []).filter((line) => line !== primaryLineOf(existing)).slice().sort().join(",");
  if (currentSecondary !== input.secondaryLines.slice().sort().join(",")) changed.push("secondaryLines");
  if (!sameDate(existing.registrationOpensAt, input.registrationOpensAt)) changed.push("registrationOpensAt");
  if (!sameDate(existing.registrationClosesAt, input.registrationClosesAt)) changed.push("registrationClosesAt");
  if (!sameDate(existing.startsAt, input.startsAt)) changed.push("startsAt");
  if (!sameDate(existing.endsAt, input.endsAt)) changed.push("endsAt");
  if ((existing.modality ?? null) !== input.modality) changed.push("modality");
  if (!sameText(existing.location, input.location)) changed.push("location");
  if ((existing.capacity ?? null) !== input.capacity) changed.push("capacity");
  if (!sameText(existing.demoNote, input.demoNote)) changed.push("demoNote");
  if (!sameText(existing.sourceUrl, input.sourceUrl)) changed.push("sourceUrl");
  if (!sameText(existing.sourceLabel, input.sourceLabel)) changed.push("sourceLabel");
  return changed;
}

/** Motivos por campo que impiden aplicar la edición (bloqueos, cupos por debajo de lo ocupado, datos mínimos de una publicada). */
export function editIssues(
  existing: Experience,
  input: ExperienceInput,
  stats: ExperienceStats,
  now: Date,
): FieldIssue[] {
  const issues: FieldIssue[] = [];
  const changed = changedFields(existing, input);
  const locks = lockedFields(existing, stats);
  for (const field of changed) {
    const reason = locks[field as GuardedField];
    if (reason) issues.push({ field, message: reason });
  }
  if (input.capacity !== null && input.capacity < stats.enrollments.active && changed.includes("capacity")) {
    issues.push({
      field: "capacity",
      message: `Cupos: ya hay ${stats.enrollments.active} inscripciones activas; el límite no puede ser menor.`,
    });
  }
  if (existing.status === "published") {
    // Una experiencia publicada no puede quedar sin los datos de una sesión; su ventana de inscripción sí puede cerrarse.
    issues.push(...publishIssues(input, now, { checkRegistrationWindow: false }).filter((issue) => !issues.some((other) => other.field === issue.field)));
  }
  return issues;
}

// ---------------------------------------------------------------------------------------------
// Próximas acciones para Admin
// ---------------------------------------------------------------------------------------------

export interface NextAction {
  tone: "info" | "advertencia" | "exito";
  text: string;
}

/** Hasta tres pendientes de la experiencia, ordenados por urgencia. Vacío si no hay nada por hacer. */
export function nextActionsOf(experience: Experience, stats: ExperienceStats, now: Date): NextAction[] {
  const actions: NextAction[] = [];
  const push = (tone: NextAction["tone"], text: string) => actions.push({ tone, text });

  if (experience.status === "draft") {
    const missing = publishIssues(experience, now, { checkRegistrationWindow: true });
    if (missing.length) push("advertencia", `Completá antes de publicar: ${missing.map((issue) => issue.message.replace(/^Para publicar, /, "").replace(/\.$/, "")).join("; ")}.`);
    else push("info", "Revisá los datos y publicala cuando esté lista.");
    return actions.slice(0, 3);
  }
  if (experience.status !== "published") return actions;

  const phase = registrationPhase(experience, now);
  const ended = experience.endsAt ? Date.parse(experience.endsAt) <= now.getTime() : false;
  if (ended) push("advertencia", "La sesión ya terminó: marcá la experiencia como concluida.");
  if (stats.enrollments.pending > 0) {
    push("advertencia", `Revisá ${stats.enrollments.pending} ${stats.enrollments.pending === 1 ? "inscripción pendiente" : "inscripciones pendientes"}.`);
  }
  const left = spotsLeft(experience, stats.enrollments);
  if (left === 0 && phase === "open") push("info", "Cupos completos: podés cerrar las inscripciones.");
  if (phase === "upcoming" && experience.registrationOpensAt) {
    push("info", `Las inscripciones abren el ${formatDateTime(experience.registrationOpensAt) ?? ""}.`);
  }
  if (CHALLENGE_KINDS.includes(experience.kind) && stats.challenges === 0) {
    push("info", "Agregá al menos un reto para que se pueda participar.");
  }
  return actions.slice(0, 3);
}
