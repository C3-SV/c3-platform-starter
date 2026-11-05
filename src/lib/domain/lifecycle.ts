/*
 * Experience lifecycle (PURE rules; authorization lives on the server). Stored statuses: draft, published,
 * closed, cancelled. Open or closed enrollment is NOT stored: it comes from the window
 * (registrationOpensAt / registrationClosesAt) and the current time.
 */
import { formatDateTime } from "./format.ts";
import { primaryLineOf } from "./presentation.ts";
import type { Experience, ExperienceKind, ExperienceStatus } from "./types.ts";
import type { ExperienceInput, FieldIssue, RegistrationActionInput } from "./validation.ts";

/** Kinds that are a session with date, modality and venue; those are required to publish them. */
export const SESSION_KINDS: readonly ExperienceKind[] = ["taller", "charla", "encuentro"];
/** Kinds expected to have at least one technical challenge. */
export const CHALLENGE_KINDS: readonly ExperienceKind[] = ["competencia", "hackathon", "challenge_empresarial"];

export interface EnrollmentCounts {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  /** Pending + approved: the ones that take a spot. */
  active: number;
  total: number;
}

/** Data needed to decide what can change and what comes next. The server computes it. */
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

/** Spots left, or null if the experience has no limit. Never negative. */
export function spotsLeft(experience: Pick<Experience, "capacity">, enrollments: Pick<EnrollmentCounts, "active">): number | null {
  const capacity = experience.capacity ?? null;
  return capacity === null ? null : Math.max(0, capacity - enrollments.active);
}

// ---------------------------------------------------------------------------------------------
// Stage shown to admins
// ---------------------------------------------------------------------------------------------

export type RegistrationPhase = "upcoming" | "open" | "closed";

/** Enrollment window phase. Without dates, the window is open. */
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

/** Operational stage for Admin; finer than the public state (which uses presentExperienceState). */
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
// Status transitions
// ---------------------------------------------------------------------------------------------

/*
 * Allowed transitions. draft to closed exists to record a historical experience without going through
 * published (so it never opens enrollment). A closed experience never goes back to any other status.
 */
export const STATUS_TRANSITIONS: Record<ExperienceStatus, readonly ExperienceStatus[]> = {
  draft: ["published", "closed", "cancelled"],
  published: ["draft", "closed", "cancelled"],
  closed: [],
  cancelled: ["draft"],
};

/** Refusal with a stable code and a message for the person; `issues` points at specific fields. */
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

/** Minimum data for an experience to be publishable. Only looks at what changes the public experience. */
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

const PUBLISHED_RESULTS = refuse("resultados_publicados", "Ya hay resultados oficiales publicados: no puede volver a borrador ni cancelarse. Solo se puede marcar como concluida.");

/**
 * Validates a status change. `totalEnrollments` counts pending, approved, rejected and cancelled ones;
 * `publishedResults` says whether any challenge of the experience already has published official results.
 */
export function checkStatusTransition(
  experience: Pick<Experience, "status" | "kind" | "modality" | "startsAt" | "endsAt" | "location" | "registrationClosesAt">,
  to: ExperienceStatus,
  totalEnrollments: number,
  now: Date,
  publishedResults = false,
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
  if (publishedResults && (to === "draft" || to === "cancelled")) return PUBLISHED_RESULTS;
  if (to === "draft" && from === "published" && totalEnrollments > 0) {
    return refuse("tiene_inscripciones", "Ya tiene inscripciones: no puede volver a borrador. Cancelala o concluila si corresponde.");
  }
  return ok;
}

/** Challenges use the same transitions, with no publishing requirements of their own. */
export function checkChallengeStatusTransition(from: ExperienceStatus, to: ExperienceStatus, publishedResults = false): Check {
  if (from === to) return ok;
  if (from === "closed") return refuse("reto_historico", "Un challenge concluido es histórico: no se reabre ni vuelve a publicarse.");
  if (!STATUS_TRANSITIONS[from].includes(to)) return refuse("transicion_invalida", "Ese cambio de estado no está permitido desde el estado actual.");
  if (publishedResults && (to === "draft" || to === "cancelled")) return PUBLISHED_RESULTS;
  return ok;
}

// ---------------------------------------------------------------------------------------------
// Manual opening and closing of enrollment
// ---------------------------------------------------------------------------------------------

export type RegistrationWindowResult =
  | { ok: true; registrationOpensAt: string | null; registrationClosesAt: string | null }
  | Refusal;

/** Computes the new window when enrollment is opened or closed by hand. Writes nothing. */
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
  // Opening sets the open date to now; on a reopening, the original date is kept.
  const opensAt = phase === "closed" ? experience.registrationOpensAt : stamp;
  return { ok: true, registrationOpensAt: opensAt, registrationClosesAt: closesAt };
}

// ---------------------------------------------------------------------------------------------
// What can be edited
// ---------------------------------------------------------------------------------------------

/** Fields whose change could invalidate enrollments or leave the history inconsistent. */
export const GUARDED_FIELDS = ["kind", "modality", "startsAt", "endsAt", "registrationOpensAt", "registrationClosesAt", "capacity"] as const;
export type GuardedField = (typeof GUARDED_FIELDS)[number];

/**
 * Locked fields and why. A closed or cancelled experience keeps its calendar and spots as a historical record;
 * with challenges or enrollments, the kind can't change anymore.
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
    locks.kind = "Ya tiene challenges o inscripciones: el tipo de experiencia no se puede cambiar.";
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

/** Input fields that differ from what's stored, so only changes are written and audited. */
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
  if (!sameText(existing.coverImageUrl, input.coverImageUrl)) changed.push("coverImageUrl");
  if (!sameText(existing.coverImageAlt, input.coverImageAlt)) changed.push("coverImageAlt");
  return changed;
}

/** Per-field reasons that block the edit (locks, spots below those taken, minimum data of a published one). */
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
    // A published experience can't lose its session data; its enrollment window can still close.
    issues.push(...publishIssues(input, now, { checkRegistrationWindow: false }).filter((issue) => !issues.some((other) => other.field === issue.field)));
  }
  return issues;
}

// ---------------------------------------------------------------------------------------------
// Next actions for Admin
// ---------------------------------------------------------------------------------------------

export interface NextAction {
  tone: "info" | "advertencia" | "exito";
  text: string;
}

/** Up to three pending items for the experience, by urgency. Empty if there's nothing to do. */
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
    push("info", "Agregá al menos un challenge para que se pueda participar.");
  }
  return actions.slice(0, 3);
}
