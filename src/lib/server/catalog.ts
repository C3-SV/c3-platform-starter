/**
 * Servicios de experiencias y challenges. Reciben la base de datos y la hora como parámetros para
 * poder probarse contra el emulador. Cada función verifica permisos antes de leer o escribir.
 */
import type { DocumentData, Firestore, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { presentState, type PresentedState } from "../domain/presentation.ts";
import { experienceLinesOf, normalizeExperienceMetadata, presentExperienceState, type ExperienceLine } from "../domain/catalog.ts";
import {
  applyRegistrationAction,
  changedFields,
  checkChallengeStatusTransition,
  checkStatusTransition,
  countEnrollments,
  editIssues,
  spotsLeft,
  type ExperienceStats,
  type Refusal,
} from "../domain/lifecycle.ts";
import type { Challenge, Experience, ExperienceStatus, RubricCriterion } from "../domain/types.ts";
import {
  ValidationFailure,
  parseChallengeInput,
  parseExperienceInput,
  parseRegistrationAction,
  parseStatusInput,
  type ChallengeInput,
  type ExperienceInput,
} from "../domain/validation.ts";
import { recordAudit } from "./audit.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { HttpError, notFound } from "./errors.ts";
import { ENROLLMENTS, RESULTS } from "./ids.ts";

export const EXPERIENCES = "experiences";
export const CHALLENGES = "challenges";
export const ORGANIZATIONS = "organizations";

export interface PublicExperience {
  experience: Experience;
  state: PresentedState;
  lines: ExperienceLine[];
  challenges: PublicChallengeSummary[];
}

/** Detalle público de una experiencia, con lo necesario para decidir si se puede inscribir. */
export interface PublicExperienceDetail extends PublicExperience {
  registration: {
    /** Inscripciones abiertas y con cupo. */
    open: boolean;
    /** Cupos libres, o null si no hay límite. */
    spotsLeft: number | null;
    full: boolean;
    /** La experiencia no tiene challenges publicados, así que la persona se inscribe a la experiencia misma. */
    direct: boolean;
  };
}

export interface PublicChallengeSummary {
  id: string;
  title: string;
  summary: string;
  organizationName: string;
  allows: Challenge["allows"];
  teamMinSize: number | null;
  teamMaxSize: number | null;
  submissionClosesAt: string | null;
  lines: ExperienceLine[];
  isDemo: boolean;
  demoNote: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  state: PresentedState;
}

export interface PublicChallenge {
  challenge: Challenge;
  experience: Experience;
  state: PresentedState;
}

function toExperience(id: string, data: DocumentData): Experience {
  const metadata = normalizeExperienceMetadata(data);
  return {
    id,
    title: data.title,
    kind: data.kind,
    summary: data.summary,
    status: data.status,
    primaryLine: data.primaryLine,
    secondaryLines: data.secondaryLines,
    ...metadata,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    modality: data.modality ?? null,
    location: data.location ?? null,
    capacity: typeof data.capacity === "number" ? data.capacity : null,
    registrationOpensAt: data.registrationOpensAt ?? null,
    registrationClosesAt: data.registrationClosesAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function toChallenge(id: string, data: DocumentData): Challenge {
  return {
    id,
    experienceId: data.experienceId,
    title: data.title,
    summary: data.summary,
    problem: data.problem,
    deliverables: data.deliverables ?? [],
    rubric: (data.rubric ?? []) as RubricCriterion[],
    organizationName: data.organizationName,
    allows: data.allows ?? [],
    teamMinSize: data.teamMinSize ?? null,
    teamMaxSize: data.teamMaxSize ?? null,
    status: data.status,
    submissionClosesAt: data.submissionClosesAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function summarize(challenge: Challenge, experience: Experience, now: Date): PublicChallengeSummary {
  const metadata = normalizeExperienceMetadata(experience);
  return {
    id: challenge.id,
    title: challenge.title,
    summary: challenge.summary,
    organizationName: challenge.organizationName,
    allows: challenge.allows,
    teamMinSize: challenge.teamMinSize,
    teamMaxSize: challenge.teamMaxSize,
    submissionClosesAt: challenge.submissionClosesAt,
    lines: experienceLinesOf(experience),
    ...metadata,
    state: presentState(challenge.status, windowOf(experience), now),
  };
}

export function windowOf(experience: Experience) {
  return { opensAt: experience.registrationOpensAt, closesAt: experience.registrationClosesAt };
}

function rubricWithIds(criteria: ChallengeInput["rubric"]): RubricCriterion[] {
  return criteria.map((criterion, index) => ({
    id: `c${index + 1}`,
    label: criterion.label,
    maxScore: criterion.maxScore,
  }));
}

export async function loadExperience(db: Firestore, id: string): Promise<Experience> {
  const snapshot = await db.collection(EXPERIENCES).doc(id).get();
  if (!snapshot.exists) throw notFound("La experiencia no existe o fue eliminada.");
  return toExperience(snapshot.id, snapshot.data() as DocumentData);
}

export async function loadChallenge(db: Firestore, id: string): Promise<Challenge> {
  const snapshot = await db.collection(CHALLENGES).doc(id).get();
  if (!snapshot.exists) throw notFound("El challenge no existe o fue eliminado.");
  return toChallenge(snapshot.id, snapshot.data() as DocumentData);
}

function enrollmentsOf(db: Firestore, experienceId: string): Query {
  return db.collection(ENROLLMENTS).where("experienceId", "==", experienceId);
}

function challengesOf(db: Firestore, experienceId: string): Query {
  return db.collection(CHALLENGES).where("experienceId", "==", experienceId);
}

function statsFrom(enrollments: QueryDocumentSnapshot[], challengeCount: number): ExperienceStats {
  return { challenges: challengeCount, enrollments: countEnrollments(enrollments.map((doc) => doc.data().status as string)) };
}

/** Convierte un rechazo de las reglas de dominio en el error HTTP con el motivo completo. */
function refusalError(refusal: Refusal): HttpError {
  const detail = refusal.issues?.map((issue) => issue.message) ?? [];
  return new HttpError(409, refusal.code, [refusal.message, ...detail].join(" "));
}

/** Valores guardados de los datos propios de la experiencia (sin estado ni auditoría). */
function experienceFields(input: ExperienceInput) {
  return {
    title: input.title,
    kind: input.kind,
    summary: input.summary,
    primaryLine: input.primaryLine,
    secondaryLines: input.secondaryLines,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    modality: input.modality,
    location: input.location,
    capacity: input.capacity,
    registrationOpensAt: input.registrationOpensAt,
    registrationClosesAt: input.registrationClosesAt,
    demoNote: input.demoNote,
    sourceUrl: input.sourceUrl,
    sourceLabel: input.sourceLabel,
  };
}

/** Valores de calendario y clasificación que se guardan en la bitácora cuando cambian (sin textos largos). */
const AUDITED_FIELDS = ["title", "kind", "primaryLine", "startsAt", "endsAt", "modality", "capacity", "registrationOpensAt", "registrationClosesAt"] as const;

/** Crea una experiencia en borrador. Solo administradores de C3. */
export async function createExperience(db: Firestore, actor: Actor, rawInput: unknown, now: Date): Promise<Experience> {
  requireAdmin(actor);
  const input = parseExperienceInput(rawInput);
  const ref = db.collection(EXPERIENCES).doc();
  const stamp = now.toISOString();
  const data = {
    ...experienceFields(input),
    ...(input.isDemo ? { isDemo: true } : {}),
    status: "draft" satisfies ExperienceStatus,
    createdAt: stamp,
    updatedAt: stamp,
    createdByUid: actor.uid,
  };
  const batch = db.batch();
  batch.set(ref, data);
  recordAudit(db, batch, actor, now, {
    action: "experience.create",
    target: { type: "experience", id: ref.id },
    details: { kind: input.kind, primaryLine: input.primaryLine, isDemo: input.isDemo === true },
  });
  await batch.commit();
  return toExperience(ref.id, data);
}

/**
 * Edita los datos de una experiencia. Actualiza solo los campos que cambian y conserva todo lo demás
 * (estado, demo, autoría, datos de seed). Los campos que podrían invalidar inscripciones se bloquean según
 * el estado y la participación; ver lockedFields en el dominio.
 */
export async function updateExperience(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<Experience> {
  requireAdmin(actor);
  const input = parseExperienceInput(rawInput);
  const ref = db.collection(EXPERIENCES).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw notFound("La experiencia no existe o fue eliminada.");
    const existing = toExperience(snapshot.id, snapshot.data() as DocumentData);
    const [enrollments, challenges] = await Promise.all([transaction.get(enrollmentsOf(db, id)), transaction.get(challengesOf(db, id))]);
    const issues = editIssues(existing, input, statsFrom(enrollments.docs, challenges.size), now);
    if (issues.length) throw new ValidationFailure(issues);

    const changed = changedFields(existing, input);
    if (changed.length === 0) return;
    const next = experienceFields(input) as Record<string, unknown>;
    const before = existing as unknown as Record<string, unknown>;
    transaction.update(ref, { ...Object.fromEntries(changed.map((field) => [field, next[field]])), updatedAt: now.toISOString() });
    recordAudit(db, transaction, actor, now, {
      action: "experience.update",
      target: { type: "experience", id },
      details: {
        changed,
        changes: Object.fromEntries(
          AUDITED_FIELDS.filter((field) => changed.includes(field)).map((field) => [field, { from: before[field] ?? null, to: next[field] ?? null }]),
        ),
      },
    });
  });
  return loadExperience(db, id);
}

/** Cambia el estado guardado respetando las transiciones permitidas (borrador, publicada, concluida, cancelada). */
export async function setExperienceStatus(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<Experience> {
  requireAdmin(actor);
  const { status } = parseStatusInput(rawInput);
  const ref = db.collection(EXPERIENCES).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw notFound("La experiencia no existe o fue eliminada.");
    const existing = toExperience(snapshot.id, snapshot.data() as DocumentData);
    const [enrollments, challenges] = await Promise.all([transaction.get(enrollmentsOf(db, id)), transaction.get(challengesOf(db, id))]);
    const resultRefs = challenges.docs.map((doc) => db.collection(RESULTS).doc(doc.id));
    const results = resultRefs.length ? await transaction.getAll(...resultRefs) : [];
    const publishedResults = results.some((doc) => Boolean(doc.data()?.publishedAt));
    const check = checkStatusTransition(existing, status, enrollments.size, now, publishedResults);
    if (!check.ok) throw refusalError(check);
    if (existing.status === status) return;
    transaction.update(ref, { status, updatedAt: now.toISOString() });
    recordAudit(db, transaction, actor, now, {
      action: "experience.status",
      target: { type: "experience", id },
      details: { from: existing.status, to: status },
    });
  });
  return loadExperience(db, id);
}

/**
 * Abre o cierra las inscripciones de una experiencia publicada ajustando su ventana de fechas.
 * Cerrar fija el cierre en este momento; abrir fija la apertura (y, tras un cierre, exige una nueva fecha de cierre).
 */
export async function setExperienceRegistration(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<Experience> {
  requireAdmin(actor);
  const input = parseRegistrationAction(rawInput);
  const ref = db.collection(EXPERIENCES).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw notFound("La experiencia no existe o fue eliminada.");
    const existing = toExperience(snapshot.id, snapshot.data() as DocumentData);
    const result = applyRegistrationAction(existing, input, now);
    if (!result.ok) throw refusalError(result);
    transaction.update(ref, {
      registrationOpensAt: result.registrationOpensAt,
      registrationClosesAt: result.registrationClosesAt,
      updatedAt: now.toISOString(),
    });
    recordAudit(db, transaction, actor, now, {
      action: input.action === "open" ? "experience.registration.open" : "experience.registration.close",
      target: { type: "experience", id },
      details: {
        from: { opensAt: existing.registrationOpensAt, closesAt: existing.registrationClosesAt },
        to: { opensAt: result.registrationOpensAt, closesAt: result.registrationClosesAt },
      },
    });
  });
  return loadExperience(db, id);
}

/** Crea un challenge en borrador dentro de una experiencia existente. */
export async function createChallenge(db: Firestore, actor: Actor, rawInput: unknown, now: Date): Promise<Challenge> {
  requireAdmin(actor);
  const input = parseChallengeInput(rawInput, now);
  const experience = await loadExperience(db, input.experienceId);
  if (experience.status === "closed" || experience.status === "cancelled") {
    throw new HttpError(409, "experiencia_cerrada", "La experiencia ya concluyó o se canceló: no se le agregan challenges.");
  }
  if (input.organizationId) {
    const organization = await db.collection(ORGANIZATIONS).doc(input.organizationId).get();
    if (!organization.exists) throw notFound("La organización no existe.");
  }
  const ref = db.collection(CHALLENGES).doc();
  const stamp = now.toISOString();
  const data = {
    experienceId: input.experienceId,
    organizationId: input.organizationId,
    title: input.title,
    summary: input.summary,
    problem: input.problem,
    deliverables: input.deliverables,
    rubric: rubricWithIds(input.rubric),
    organizationName: input.organizationName,
    allows: input.allows,
    teamMinSize: input.teamMinSize,
    teamMaxSize: input.teamMaxSize,
    submissionClosesAt: input.submissionClosesAt,
    status: "draft" satisfies ExperienceStatus,
    createdAt: stamp,
    updatedAt: stamp,
    createdByUid: actor.uid,
  };
  const batch = db.batch();
  batch.set(ref, data);
  recordAudit(db, batch, actor, now, {
    action: "challenge.create",
    target: { type: "challenge", id: ref.id },
    details: { experienceId: input.experienceId },
  });
  await batch.commit();
  return toChallenge(ref.id, data);
}

/** Cambia el estado de un challenge. Un challenge concluido es histórico y no se reabre. */
export async function setChallengeStatus(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<Challenge> {
  requireAdmin(actor);
  const { status } = parseStatusInput(rawInput);
  const ref = db.collection(CHALLENGES).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw notFound("El challenge no existe o fue eliminado.");
    const from = snapshot.data()?.status as ExperienceStatus;
    const result = await transaction.get(db.collection(RESULTS).doc(id));
    const check = checkChallengeStatusTransition(from, status, Boolean(result.data()?.publishedAt));
    if (!check.ok) throw refusalError(check);
    if (from === status) return;
    transaction.update(ref, { status, updatedAt: now.toISOString() });
    recordAudit(db, transaction, actor, now, {
      action: "challenge.status",
      target: { type: "challenge", id },
      details: { from, to: status, experienceId: snapshot.data()?.experienceId ?? null },
    });
  });
  return loadChallenge(db, id);
}

/** Experiencias y challenges con el recuento de inscripciones y challenges de cada experiencia, para el listado de Admin. */
export interface AdminCatalog {
  experiences: Experience[];
  challenges: Challenge[];
  /** Indexado por id de experiencia. */
  stats: Record<string, ExperienceStats>;
  organizations: { id: string; name: string }[];
}

/** Vista completa para el administrador, incluidos borradores. */
export async function listAdminCatalog(
  db: Firestore,
  actor: Actor,
): Promise<AdminCatalog> {
  requireAdmin(actor);
  const [experiences, challenges, organizations, enrollments] = await Promise.all([
    db.collection(EXPERIENCES).get(),
    db.collection(CHALLENGES).get(),
    db.collection(ORGANIZATIONS).get(),
    db.collection(ENROLLMENTS).get(),
  ]);
  const enrollmentsByExperience = new Map<string, QueryDocumentSnapshot[]>();
  for (const doc of enrollments.docs) {
    const experienceId = doc.data().experienceId as string | undefined;
    if (!experienceId) continue;
    enrollmentsByExperience.set(experienceId, [...(enrollmentsByExperience.get(experienceId) ?? []), doc]);
  }
  const challengeDocs = challenges.docs.map((doc) => toChallenge(doc.id, doc.data()));
  const stats: Record<string, ExperienceStats> = {};
  for (const doc of experiences.docs) {
    stats[doc.id] = statsFrom(
      enrollmentsByExperience.get(doc.id) ?? [],
      challengeDocs.filter((challenge) => challenge.experienceId === doc.id).length,
    );
  }
  return {
    experiences: experiences.docs.map((doc) => toExperience(doc.id, doc.data())).sort(byCreatedDesc),
    challenges: challengeDocs.sort(byCreatedDesc),
    stats,
    organizations: organizations.docs
      .map((doc) => ({ id: doc.id, name: (doc.data().name as string) ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function byCreatedDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/** Catálogo público: solo experiencias publicadas y challenges publicados dentro de ellas. */
export async function listPublicCatalog(db: Firestore, now: Date): Promise<PublicExperience[]> {
  const [experienceSnap, challengeSnap] = await Promise.all([
    db.collection(EXPERIENCES).where("status", "in", ["published", "closed"]).get(),
    db.collection(CHALLENGES).where("status", "in", ["published", "closed"]).get(),
  ]);
  const experiences = experienceSnap.docs.map((doc) => toExperience(doc.id, doc.data())).sort(byCreatedDesc);
  const challenges = challengeSnap.docs.map((doc) => toChallenge(doc.id, doc.data()));
  return experiences.map((experience) => ({
    experience,
    state: presentExperienceState(experience.status, windowOf(experience), now),
    lines: experienceLinesOf(experience),
    challenges: challenges
      .filter((challenge) => challenge.experienceId === experience.id)
      .map((challenge) => summarize(challenge, experience, now)),
  }));
}

/** Detalle público de un challenge. Devuelve 404 si el challenge o su experiencia no están publicados. */
export async function getPublicChallenge(db: Firestore, challengeId: string, now: Date): Promise<PublicChallenge> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published" && challenge.status !== "closed") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published" && experience.status !== "closed") throw notFound();
  return {
    challenge,
    experience,
    state: presentState(challenge.status, windowOf(experience), now),
  };
}

/**
 * Detalle público de una experiencia publicada o concluida. Devuelve 404 si es borrador o cancelada.
 * Incluye si se puede inscribir directamente (sin challenges publicados) y cuántos cupos quedan.
 */
export async function getPublicExperience(db: Firestore, experienceId: string, now: Date): Promise<PublicExperienceDetail> {
  const experience = await loadExperience(db, experienceId);
  if (experience.status !== "published" && experience.status !== "closed") throw notFound();
  const [challengeSnap, enrollmentSnap] = await Promise.all([
    challengesOf(db, experienceId).get(),
    experience.capacity != null ? enrollmentsOf(db, experienceId).get() : Promise.resolve(null),
  ]);
  const challenges = challengeSnap.docs
    .map((doc) => toChallenge(doc.id, doc.data()))
    .filter((challenge) => challenge.status === "published" || challenge.status === "closed")
    .map((challenge) => summarize(challenge, experience, now));
  const state = presentExperienceState(experience.status, windowOf(experience), now);
  const left = enrollmentSnap ? spotsLeft(experience, statsFrom(enrollmentSnap.docs, 0).enrollments) : null;
  return {
    experience,
    state,
    lines: experienceLinesOf(experience),
    challenges,
    registration: {
      open: state.label === "Abierto" && (left === null || left > 0),
      spotsLeft: left,
      full: left === 0,
      direct: !challengeSnap.docs.some((doc) => doc.data().status === "published"),
    },
  };
}
