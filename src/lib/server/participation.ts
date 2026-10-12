/**
 * Inscripciones, participaciones y entregas individuales (Corte 2).
 * Identificadores deterministas: una inscripción por persona y experiencia; una entrega vigente por participación.
 */
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { deliveryState, canEditDelivery, parseDeliveryInput, type DeliveryState } from "../domain/delivery.ts";
import { presentState } from "../domain/presentation.ts";
import type { Challenge, Experience, EnrollmentStatus, ParticipationMode, RubricCriterion } from "../domain/types.ts";
import { ValidationFailure } from "../domain/validation.ts";
import { canSubmit } from "../domain/workflows.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { loadChallenge, loadExperience, windowOf } from "./catalog.ts";
import { HttpError, notFound } from "./errors.ts";
import { USERS } from "./profile.ts";

export const ENROLLMENTS = "enrollments";
export const PARTICIPATIONS = "participations";
export const SUBMISSIONS = "submissions";

export function enrollmentDocId(experienceId: string, userId: string): string {
  return `${experienceId}__${userId}`;
}

export function participationDocId(challengeId: string, userId: string): string {
  return `${challengeId}__${userId}`;
}

export interface EnrollmentView {
  id: string;
  status: EnrollmentStatus;
  experienceId: string;
  challengeId: string;
  challengeTitle: string;
  experienceTitle: string;
  organizationName: string;
  submissionClosesAt: string | null;
  createdAt: string;
}

export interface MyEnrollmentView extends EnrollmentView {
  delivery: {
    state: DeliveryState;
    canEdit: boolean;
    text: string;
    links: string[];
    updatedAt: string | null;
    submittedAt: string | null;
  } | null;
}

export interface SubmissionView {
  status: "draft" | "submitted";
  text: string;
  links: string[];
  updatedAt: string | null;
  submittedAt: string | null;
}

export interface DeliveryView {
  challenge: {
    id: string;
    title: string;
    problem: string;
    deliverables: string[];
    rubric: RubricCriterion[];
    organizationName: string;
    allows: ParticipationMode[];
    submissionClosesAt: string | null;
  };
  experience: { id: string; title: string };
  enrollmentStatus: EnrollmentStatus | null;
  eligible: boolean;
  canEdit: boolean;
  state: DeliveryState;
  submission: SubmissionView | null;
}

function toEnrollmentBase(id: string, data: DocumentData, challenge: Challenge, experience: Experience): EnrollmentView {
  return {
    id,
    status: data.status,
    experienceId: experience.id,
    challengeId: challenge.id,
    challengeTitle: challenge.title,
    experienceTitle: experience.title,
    organizationName: challenge.organizationName,
    submissionClosesAt: challenge.submissionClosesAt,
    createdAt: data.createdAt,
  };
}

function toSubmission(data: DocumentData | undefined): SubmissionView | null {
  if (!data) return null;
  return {
    status: data.status,
    text: data.text ?? "",
    links: data.links ?? [],
    updatedAt: data.updatedAt ?? null,
    submittedAt: data.submittedAt ?? null,
  };
}

/** Inscripción individual. Una por experiencia; la revisa C3 antes de habilitar la entrega. */
export async function enrollIndividual(db: Firestore, actor: Actor, challengeId: string, now: Date): Promise<EnrollmentView> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();

  if (presentState(challenge.status, windowOf(experience), now).label !== "Abierto") {
    throw new HttpError(409, "inscripcion_cerrada", "Las inscripciones de esta experiencia no están abiertas.");
  }
  if (!challenge.allows.includes("individual")) {
    throw new HttpError(409, "solo_equipos", "Este reto se inscribe por equipos. La inscripción por equipos llega en el siguiente corte.");
  }

  const ref = db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid));
  const stamp = now.toISOString();
  const data = {
    experienceId: experience.id,
    challengeId: challenge.id,
    userId: actor.uid,
    status: "pending" as EnrollmentStatus,
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      throw new HttpError(409, "ya_inscrito", "Ya tenés una inscripción en esta experiencia.");
    }
    transaction.set(ref, data);
  });
  return toEnrollmentBase(ref.id, data, challenge, experience);
}

/** Inscripciones de la persona autenticada, con el estado de su entrega cuando ya fue habilitada. */
export async function listMyEnrollments(db: Firestore, actor: Actor, now: Date): Promise<MyEnrollmentView[]> {
  const snapshot = await db.collection(ENROLLMENTS).where("userId", "==", actor.uid).get();
  const views = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const challenge = await loadChallenge(db, data.challengeId).catch(() => null);
    const experience = challenge ? await loadExperience(db, challenge.experienceId).catch(() => null) : null;
    if (!challenge || !experience) return null;
    const base = toEnrollmentBase(doc.id, data, challenge, experience);
    let delivery: MyEnrollmentView["delivery"] = null;
    if (data.status === "approved") {
      const submissionSnapshot = await db.collection(SUBMISSIONS).doc(participationDocId(challenge.id, actor.uid)).get();
      const submission = toSubmission(submissionSnapshot.data());
      delivery = {
        state: deliveryState(submission, challenge.submissionClosesAt, now),
        canEdit: canEditDelivery(challenge.submissionClosesAt, now),
        text: submission?.text ?? "",
        links: submission?.links ?? [],
        updatedAt: submission?.updatedAt ?? null,
        submittedAt: submission?.submittedAt ?? null,
      };
    }
    return { ...base, delivery };
  }));
  return views
    .filter((view): view is MyEnrollmentView => view !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Cancela una inscripción propia, solo antes del cierre y sin entrega enviada. */
export async function cancelMyEnrollment(db: Firestore, actor: Actor, enrollmentId: string, now: Date): Promise<void> {
  const ref = db.collection(ENROLLMENTS).doc(enrollmentId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.userId !== actor.uid) {
    throw notFound("No encontramos esa inscripción.");
  }
  const data = snapshot.data() as DocumentData;
  if (data.status !== "pending" && data.status !== "approved") {
    throw new HttpError(409, "no_cancelable", "Esta inscripción ya no se puede cancelar.");
  }
  const challenge = await loadChallenge(db, data.challengeId);
  if (!canEditDelivery(challenge.submissionClosesAt, now)) {
    throw new HttpError(409, "plazo_cerrado", "El plazo de entregas ya cerró; la inscripción no se puede cancelar.");
  }
  const submission = await db.collection(SUBMISSIONS).doc(participationDocId(challenge.id, actor.uid)).get();
  if (submission.data()?.status === "submitted") {
    throw new HttpError(409, "entrega_enviada", "Ya enviaste la entrega; no podés cancelar la inscripción.");
  }
  await ref.update({ status: "cancelled", updatedAt: now.toISOString() });
  const participation = db.collection(PARTICIPATIONS).doc(participationDocId(challenge.id, actor.uid));
  if ((await participation.get()).exists) {
    await participation.update({ status: "cancelled", updatedAt: now.toISOString() });
  }
}

/** Revisión de C3: aprobar crea la participación; rechazar cierra la inscripción. Solo administradores. */
export async function reviewEnrollment(db: Firestore, actor: Actor, enrollmentId: string, rawStatus: unknown, now: Date): Promise<void> {
  requireAdmin(actor);
  if (rawStatus !== "approved" && rawStatus !== "rejected") {
    throw new ValidationFailure([{ field: "status", message: "La revisión debe ser aprobar o rechazar." }]);
  }
  const ref = db.collection(ENROLLMENTS).doc(enrollmentId);
  const stamp = now.toISOString();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw notFound("La inscripción no existe.");
    const data = snapshot.data() as DocumentData;
    if (data.status !== "pending") {
      throw new HttpError(409, "ya_revisada", "Solo se revisan inscripciones pendientes.");
    }
    transaction.update(ref, { status: rawStatus, reviewedAt: stamp, reviewedByUid: actor.uid, updatedAt: stamp });
    if (rawStatus === "approved") {
      const participation = db.collection(PARTICIPATIONS).doc(participationDocId(data.challengeId, data.userId));
      transaction.set(participation, {
        challengeId: data.challengeId,
        experienceId: data.experienceId,
        userId: data.userId,
        mode: "individual",
        status: "active",
        createdAt: stamp,
        updatedAt: stamp,
      }, { merge: true });
    }
  });
}

export interface AdminEnrollmentRow {
  id: string;
  status: EnrollmentStatus;
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
}

/** Inscripciones de un reto para la revisión de C3. */
export async function listEnrollmentsForChallenge(db: Firestore, actor: Actor, challengeId: string): Promise<AdminEnrollmentRow[]> {
  requireAdmin(actor);
  const snapshot = await db.collection(ENROLLMENTS).where("challengeId", "==", challengeId).get();
  const rows = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const user = await db.collection(USERS).doc(data.userId).get();
    return {
      id: doc.id,
      status: data.status as EnrollmentStatus,
      userId: data.userId,
      displayName: (user.data()?.displayName as string | undefined) ?? null,
      email: (user.data()?.email as string | undefined) ?? null,
      createdAt: data.createdAt,
    };
  }));
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Vista de la entrega para la persona inscrita. Solo lee su propia entrega. */
export async function getDelivery(db: Firestore, actor: Actor, challengeId: string, now: Date): Promise<DeliveryView> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();

  const enrollment = await db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid)).get();
  const enrollmentStatus = (enrollment.data()?.status as EnrollmentStatus | undefined) ?? null;
  const eligible = enrollmentStatus === "approved";
  const submissionSnapshot = eligible
    ? await db.collection(SUBMISSIONS).doc(participationDocId(challenge.id, actor.uid)).get()
    : null;
  const submission = toSubmission(submissionSnapshot?.data());

  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      problem: challenge.problem,
      deliverables: challenge.deliverables,
      rubric: challenge.rubric,
      organizationName: challenge.organizationName,
      allows: challenge.allows,
      submissionClosesAt: challenge.submissionClosesAt,
    },
    experience: { id: experience.id, title: experience.title },
    enrollmentStatus,
    eligible,
    canEdit: eligible && canEditDelivery(challenge.submissionClosesAt, now),
    state: deliveryState(submission, challenge.submissionClosesAt, now),
    submission,
  };
}

/** Guarda la entrega como borrador o la envía. Solo con inscripción aprobada y dentro del plazo. */
export async function saveDelivery(db: Firestore, actor: Actor, challengeId: string, rawInput: unknown, now: Date): Promise<DeliveryView> {
  const input = parseDeliveryInput(rawInput);
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();

  const enrollment = await db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid)).get();
  if (enrollment.data()?.status !== "approved") {
    throw new HttpError(403, "no_habilitado", "Tu inscripción todavía no está aprobada. Cuando C3 la habilite, podrás entregar.");
  }
  if (!canSubmit({
    challengeStatus: challenge.status,
    enrollmentStatus: "approved",
    submissionClosesAt: challenge.submissionClosesAt ?? "",
    now: now.toISOString(),
  })) {
    throw new HttpError(409, "plazo_cerrado", "El plazo de entregas ya cerró. La entrega queda como está.");
  }

  const ref = db.collection(SUBMISSIONS).doc(participationDocId(challenge.id, actor.uid));
  const existing = (await ref.get()).data();
  const alreadySubmitted = existing?.status === "submitted";
  const status: "draft" | "submitted" = input.submit || alreadySubmitted ? "submitted" : "draft";
  const stamp = now.toISOString();
  await ref.set({
    participationId: ref.id,
    challengeId: challenge.id,
    userId: actor.uid,
    status,
    text: input.text,
    links: input.links,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
    submittedAt: status === "submitted" ? (existing?.submittedAt ?? stamp) : null,
  });
  return getDelivery(db, actor, challengeId, now);
}
