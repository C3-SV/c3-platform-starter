/**
 * Servicios de experiencias y retos. Reciben la base de datos y la hora como parámetros para
 * poder probarse contra el emulador. Cada función verifica permisos antes de leer o escribir.
 */
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { presentState, type PresentedState } from "../domain/presentation.ts";
import { experienceLinesOf, normalizeExperienceMetadata, presentExperienceState, type ExperienceLine } from "../domain/catalog.ts";
import type { Challenge, Experience, ExperienceStatus, RubricCriterion } from "../domain/types.ts";
import {
  parseChallengeInput,
  parseExperienceInput,
  parseStatusInput,
  type ChallengeInput,
} from "../domain/validation.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { notFound } from "./errors.ts";

export const EXPERIENCES = "experiences";
export const CHALLENGES = "challenges";
export const ORGANIZATIONS = "organizations";

export interface PublicExperience {
  experience: Experience;
  state: PresentedState;
  lines: ExperienceLine[];
  challenges: PublicChallengeSummary[];
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
  if (!snapshot.exists) throw notFound("El reto no existe o fue eliminado.");
  return toChallenge(snapshot.id, snapshot.data() as DocumentData);
}

/** Crea una experiencia en borrador. Solo administradores de C3. */
export async function createExperience(db: Firestore, actor: Actor, rawInput: unknown, now: Date): Promise<Experience> {
  requireAdmin(actor);
  const input = parseExperienceInput(rawInput);
  const ref = db.collection(EXPERIENCES).doc();
  const stamp = now.toISOString();
  const data = {
    title: input.title,
    kind: input.kind,
    summary: input.summary,
    registrationOpensAt: input.registrationOpensAt,
    registrationClosesAt: input.registrationClosesAt,
    ...(input.primaryLine ? { primaryLine: input.primaryLine } : {}),
    ...(input.secondaryLines ? { secondaryLines: input.secondaryLines } : {}),
    ...(input.isDemo ? { isDemo: true } : {}),
    ...(input.demoNote ? { demoNote: input.demoNote } : {}),
    ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
    ...(input.sourceLabel ? { sourceLabel: input.sourceLabel } : {}),
    status: "draft" satisfies ExperienceStatus,
    createdAt: stamp,
    updatedAt: stamp,
    createdByUid: actor.uid,
  };
  await ref.set(data);
  return toExperience(ref.id, data);
}

export async function setExperienceStatus(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<Experience> {
  requireAdmin(actor);
  const { status } = parseStatusInput(rawInput);
  const ref = db.collection(EXPERIENCES).doc(id);
  await loadExperience(db, id);
  await ref.update({ status, updatedAt: now.toISOString() });
  return loadExperience(db, id);
}

/** Crea un reto en borrador dentro de una experiencia existente. */
export async function createChallenge(db: Firestore, actor: Actor, rawInput: unknown, now: Date): Promise<Challenge> {
  requireAdmin(actor);
  const input = parseChallengeInput(rawInput, now);
  await loadExperience(db, input.experienceId);
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
  await ref.set(data);
  return toChallenge(ref.id, data);
}

export async function setChallengeStatus(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<Challenge> {
  requireAdmin(actor);
  const { status } = parseStatusInput(rawInput);
  await loadChallenge(db, id);
  await db.collection(CHALLENGES).doc(id).update({ status, updatedAt: now.toISOString() });
  return loadChallenge(db, id);
}

/** Vista completa para el administrador, incluidos borradores. */
export async function listAdminCatalog(
  db: Firestore,
  actor: Actor,
): Promise<{ experiences: Experience[]; challenges: Challenge[]; organizations: { id: string; name: string }[] }> {
  requireAdmin(actor);
  const [experiences, challenges, organizations] = await Promise.all([
    db.collection(EXPERIENCES).get(),
    db.collection(CHALLENGES).get(),
    db.collection(ORGANIZATIONS).get(),
  ]);
  return {
    experiences: experiences.docs.map((doc) => toExperience(doc.id, doc.data())).sort(byCreatedDesc),
    challenges: challenges.docs.map((doc) => toChallenge(doc.id, doc.data())).sort(byCreatedDesc),
    organizations: organizations.docs
      .map((doc) => ({ id: doc.id, name: (doc.data().name as string) ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function byCreatedDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/** Catálogo público: solo experiencias publicadas y retos publicados dentro de ellas. */
export async function listPublicCatalog(db: Firestore, now: Date): Promise<PublicExperience[]> {
  const [experienceSnap, challengeSnap] = await Promise.all([
    db.collection(EXPERIENCES).where("status", "==", "published").get(),
    db.collection(CHALLENGES).where("status", "==", "published").get(),
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

/** Detalle público de un reto. Devuelve 404 si el reto o su experiencia no están publicados. */
export async function getPublicChallenge(db: Firestore, challengeId: string, now: Date): Promise<PublicChallenge> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();
  return {
    challenge,
    experience,
    state: presentState(challenge.status, windowOf(experience), now),
  };
}
