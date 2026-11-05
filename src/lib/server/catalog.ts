/*
 * Experience and challenge services. They take the database and the time as parameters so they can be
 * tested against the emulator. Every function checks permissions before reading or writing.
 */
import type { DocumentData, Firestore, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { parseCommercialPackageId } from "../domain/commercial.ts";
import { challengeCoverOf, type CoverImage } from "../domain/coverImage.ts";
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

/** Public experience detail, with what's needed to decide whether someone can enroll. */
export interface PublicExperienceDetail extends PublicExperience {
  registration: {
    /** Enrollment open and with spots left. */
    open: boolean;
    /** Spots left, or null if there's no limit. */
    spotsLeft: number | null;
    full: boolean;
    /** No published challenges, so the person enrolls in the experience itself. */
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
  /** Its own cover, or the experience's when it has none. */
  cover: CoverImage | null;
  state: PresentedState;
}

export interface PublicChallenge {
  challenge: Challenge;
  experience: Experience;
  /** Its own cover, or the experience's when it has none. */
  cover: CoverImage | null;
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
    ...coverFieldsOf(data),
    registrationOpensAt: data.registrationOpensAt ?? null,
    registrationClosesAt: data.registrationClosesAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Stored cover fields, kept as they are; public views read them through coverOf. */
function coverFieldsOf(data: DocumentData) {
  return { coverImageUrl: data.coverImageUrl ?? null, coverImageAlt: data.coverImageAlt ?? null };
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
    commercialPackage: parseCommercialPackageId(data.commercialPackage),
    allows: data.allows ?? [],
    teamMinSize: data.teamMinSize ?? null,
    teamMaxSize: data.teamMaxSize ?? null,
    status: data.status,
    submissionClosesAt: data.submissionClosesAt ?? null,
    ...coverFieldsOf(data),
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
    cover: challengeCoverOf(challenge, experience),
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
    ...(criterion.weight === null ? {} : { weight: criterion.weight }),
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

/** Turns a domain-rule refusal into the HTTP error with the full reason. */
function refusalError(refusal: Refusal): HttpError {
  const detail = refusal.issues?.map((issue) => issue.message) ?? [];
  return new HttpError(409, refusal.code, [refusal.message, ...detail].join(" "));
}

/** Stored values of the experience's own data (no status or audit fields). */
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
    coverImageUrl: input.coverImageUrl,
    coverImageAlt: input.coverImageAlt,
  };
}

/** Calendar and classification values logged in the audit trail when they change (no long texts). */
const AUDITED_FIELDS = ["title", "kind", "primaryLine", "startsAt", "endsAt", "modality", "capacity", "registrationOpensAt", "registrationClosesAt"] as const;

/** Creates a draft experience. C3 admins only. */
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
 * Edits an experience. Only changed fields are written; everything else (status, demo, authorship, seed data) stays.
 * Fields that could invalidate enrollments are locked by status and participation; see lockedFields in the domain.
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

/** Changes the stored status following the allowed transitions (draft, published, closed, cancelled). */
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
 * Opens or closes enrollment for a published experience by adjusting its date window. Closing sets the close to now;
 * opening sets the open date (and, after a close, needs a new close date).
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

/** Creates a draft challenge inside an existing experience. */
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
    commercialPackage: input.commercialPackage,
    allows: input.allows,
    teamMinSize: input.teamMinSize,
    teamMaxSize: input.teamMaxSize,
    submissionClosesAt: input.submissionClosesAt,
    coverImageUrl: input.coverImageUrl,
    coverImageAlt: input.coverImageAlt,
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

/** Changes a challenge's status. A closed challenge is historical and never reopens. */
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

/** Experiences and challenges with each experience's enrollment and challenge counts, for the Admin list. */
export interface AdminCatalog {
  experiences: Experience[];
  challenges: Challenge[];
  /** Keyed by experience id. */
  stats: Record<string, ExperienceStats>;
  organizations: { id: string; name: string }[];
}

/** Full view for admins, drafts included. */
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

/** Public catalog: only published experiences and the published challenges inside them. */
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

/** Public challenge detail. 404 if the challenge or its experience isn't published. */
export async function getPublicChallenge(db: Firestore, challengeId: string, now: Date): Promise<PublicChallenge> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published" && challenge.status !== "closed") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published" && experience.status !== "closed") throw notFound();
  return {
    challenge,
    experience,
    cover: challengeCoverOf(challenge, experience),
    state: presentState(challenge.status, windowOf(experience), now),
  };
}

/**
 * Public detail of a published or closed experience; 404 for drafts and cancelled ones. Includes whether people
 * enroll directly (no published challenges) and how many spots are left.
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
