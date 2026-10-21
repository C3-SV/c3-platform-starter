/**
 * Inscripciones, participaciones y entregas (Cortes 2–3).
 * Una inscripción por persona y experiencia; una participación y una entrega vigente por reto
 * (individual: por persona; por equipo: por equipo, enviada solo por la líder).
 * La inscripción pertenece a la experiencia: entra por un reto (challengeId) o, si la experiencia no tiene
 * retos publicados, directamente por la experiencia (challengeId null). Nunca se duplica entre ambos.
 */
import type { DocumentData, Firestore, QueryDocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { presentExperienceState } from "../domain/catalog.ts";
import { deliveryState, canEditDelivery, parseDeliveryInput, type DeliveryState } from "../domain/delivery.ts";
import { countEnrollments, spotsLeft, type EnrollmentCounts } from "../domain/lifecycle.ts";
import { presentState } from "../domain/presentation.ts";
import type { Challenge, Experience, EnrollmentStatus, ParticipationMode, RubricCriterion } from "../domain/types.ts";
import { ValidationFailure } from "../domain/validation.ts";
import { canSubmit } from "../domain/workflows.ts";
import { recordAudit } from "./audit.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { CHALLENGES, EXPERIENCES, loadChallenge, loadExperience, windowOf } from "./catalog.ts";
import { HttpError, notFound } from "./errors.ts";
import { resultForSubmission } from "./evaluation.ts";
import {
  ENROLLMENTS,
  PARTICIPATIONS,
  SUBMISSIONS,
  TEAMS,
  TEAM_MEMBERSHIPS,
  USERS,
  enrollmentDocId,
  membershipDocId,
  participationDocId,
  teamParticipationDocId,
} from "./ids.ts";

export { enrollmentDocId, participationDocId } from "./ids.ts";

export interface TeamSummary {
  id: string;
  name: string;
  status: "incompleto" | "habilitado";
  role: "lider" | "integrante";
}

export interface EnrollmentView {
  id: string;
  status: EnrollmentStatus;
  mode: ParticipationMode;
  experienceId: string;
  /** null cuando la inscripción es a la experiencia (sin reto). */
  challengeId: string | null;
  challengeTitle: string | null;
  experienceTitle: string;
  organizationName: string;
  submissionClosesAt: string | null;
  /** Fecha y lugar de la sesión de la experiencia, cuando los tiene. */
  startsAt: string | null;
  location: string | null;
  createdAt: string;
}

export interface MyEnrollmentView extends EnrollmentView {
  team: TeamSummary | null;
  result: Awaited<ReturnType<typeof resultForSubmission>>;
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
  mode: ParticipationMode | null;
  team: TeamSummary | null;
  eligible: boolean;
  canEdit: boolean;
  state: DeliveryState;
  submission: SubmissionView | null;
}

interface SubmissionContext {
  mode: ParticipationMode;
  eligible: boolean;
  canEdit: boolean;
  isLeader: boolean;
  submissionId: string | null;
  team: TeamSummary | null;
}

function toEnrollmentBase(id: string, data: DocumentData, challenge: Challenge | null, experience: Experience): EnrollmentView {
  return {
    id,
    status: data.status,
    mode: data.mode === "team" ? "team" : "individual",
    experienceId: experience.id,
    challengeId: challenge?.id ?? null,
    challengeTitle: challenge?.title ?? null,
    experienceTitle: experience.title,
    organizationName: challenge?.organizationName ?? "C3",
    submissionClosesAt: challenge?.submissionClosesAt ?? null,
    startsAt: experience.startsAt ?? null,
    location: experience.location ?? null,
    createdAt: data.createdAt,
  };
}

/** Cuenta las inscripciones que ocupan cupo (pendientes y aprobadas) dentro de una transacción. */
async function activeEnrollmentsIn(db: Firestore, transaction: Transaction, experienceId: string): Promise<number> {
  const snapshot = await transaction.get(db.collection(ENROLLMENTS).where("experienceId", "==", experienceId));
  return countEnrollments(snapshot.docs.map((doc) => doc.data().status as string)).active;
}

function fullError(): HttpError {
  return new HttpError(409, "sin_cupos", "Los cupos de esta experiencia están completos.");
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

/** Modalidad elegida al inscribirse. Si no se indica, se usa la individual cuando el reto la acepta. */
function parseMode(raw: unknown, allows: ParticipationMode[]): ParticipationMode {
  if (raw === undefined || raw === null || raw === "") return allows.includes("individual") ? "individual" : "team";
  if (raw !== "individual" && raw !== "team") {
    throw new ValidationFailure([{ field: "mode", message: "Elegí la modalidad: individual o equipo." }]);
  }
  if (!allows.includes(raw)) {
    throw new HttpError(409, raw === "team" ? "sin_equipos" : "solo_equipos", raw === "team"
      ? "Este reto se inscribe solo de forma individual."
      : "Este reto se inscribe solo por equipo.");
  }
  return raw;
}

/** Inscripción en un reto, individual o por equipo. Una por experiencia; la revisa C3. */
export async function enrollInChallenge(db: Firestore, actor: Actor, challengeId: string, rawMode: unknown, now: Date): Promise<EnrollmentView> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();

  if (presentState(challenge.status, windowOf(experience), now).label !== "Abierto") {
    throw new HttpError(409, "inscripcion_cerrada", "Las inscripciones de esta experiencia no están abiertas.");
  }
  const mode = parseMode(rawMode, challenge.allows);

  const ref = db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid));
  const stamp = now.toISOString();
  const data = {
    experienceId: experience.id,
    challengeId: challenge.id,
    userId: actor.uid,
    mode,
    status: "pending" as EnrollmentStatus,
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      throw new HttpError(409, "ya_inscrito", "Ya tenés una inscripción en esta experiencia.");
    }
    if (experience.capacity != null && (await activeEnrollmentsIn(db, transaction, experience.id)) >= experience.capacity) {
      throw fullError();
    }
    transaction.set(ref, data);
  });
  return toEnrollmentBase(ref.id, data, challenge, experience);
}

/**
 * Inscripción a una experiencia sin reto (taller, charla, encuentro o cualquier experiencia sin retos publicados).
 * Es individual y la revisa C3. Si la experiencia tiene retos publicados, la persona se inscribe desde el reto.
 */
export async function enrollInExperience(db: Firestore, actor: Actor, experienceId: string, now: Date): Promise<EnrollmentView> {
  const experience = await loadExperience(db, experienceId);
  if (experience.status !== "published") throw notFound();
  const challenges = await db.collection(CHALLENGES).where("experienceId", "==", experience.id).get();
  if (challenges.docs.some((doc) => doc.data().status === "published")) {
    throw new HttpError(409, "inscripcion_por_reto", "Esta experiencia se inscribe desde cada uno de sus retos.");
  }
  if (presentExperienceState(experience.status, windowOf(experience), now).label !== "Abierto") {
    throw new HttpError(409, "inscripcion_cerrada", "Las inscripciones de esta experiencia no están abiertas.");
  }

  const ref = db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid));
  const stamp = now.toISOString();
  const data = {
    experienceId: experience.id,
    challengeId: null,
    userId: actor.uid,
    mode: "individual" as ParticipationMode,
    status: "pending" as EnrollmentStatus,
    createdAt: stamp,
    updatedAt: stamp,
  };
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      throw new HttpError(409, "ya_inscrito", "Ya tenés una inscripción en esta experiencia.");
    }
    if (experience.capacity != null && (await activeEnrollmentsIn(db, transaction, experience.id)) >= experience.capacity) {
      throw fullError();
    }
    transaction.set(ref, data);
  });
  return toEnrollmentBase(ref.id, data, null, experience);
}

/** Contexto de entrega de la persona en un reto: individual, o equipo con su líder como única que envía. */
async function resolveContext(
  db: Firestore,
  uid: string,
  challenge: Challenge,
  experience: Experience,
  enrollment: DocumentData | undefined,
  now: Date,
): Promise<SubmissionContext> {
  const mode: ParticipationMode = enrollment?.mode === "team" ? "team" : "individual";
  const approved = enrollment?.status === "approved";
  const inWindow = canEditDelivery(challenge.submissionClosesAt, now);

  // Una inscripción a la experiencia (sin reto) es individual: no habilita retos que se juegan solo por equipo.
  if (mode === "individual" && enrollment && enrollment.challengeId == null && !challenge.allows.includes("individual")) {
    return { mode, eligible: false, canEdit: false, isLeader: false, submissionId: null, team: null };
  }

  if (mode === "individual") {
    return {
      mode,
      eligible: approved,
      canEdit: approved && inWindow,
      isLeader: true,
      submissionId: approved ? participationDocId(challenge.id, uid) : null,
      team: null,
    };
  }

  const none: SubmissionContext = { mode, eligible: false, canEdit: false, isLeader: false, submissionId: null, team: null };
  if (!approved) return none;
  const membership = (await db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(experience.id, uid)).get()).data();
  if (!membership) return none;
  const team = (await db.collection(TEAMS).doc(membership.teamId).get()).data();
  if (!team) return none;

  const isLeader = team.leaderUserId === uid;
  const habilitado = team.status === "habilitado";
  return {
    mode,
    eligible: habilitado,
    canEdit: habilitado && isLeader && inWindow,
    isLeader,
    submissionId: teamParticipationDocId(challenge.id, membership.teamId),
    team: {
      id: membership.teamId,
      name: team.name,
      status: team.status,
      role: isLeader ? "lider" : "integrante",
    },
  };
}

/** Inscripciones de la persona autenticada, con su equipo y el estado de su entrega. */
export async function listMyEnrollments(db: Firestore, actor: Actor, now: Date): Promise<MyEnrollmentView[]> {
  const snapshot = await db.collection(ENROLLMENTS).where("userId", "==", actor.uid).get();
  const views = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    if (data.challengeId == null) {
      // Inscripción a la experiencia (sin reto): no hay entrega ni resultado que consultar.
      const experience = await loadExperience(db, data.experienceId).catch(() => null);
      if (!experience) return null;
      return { ...toEnrollmentBase(doc.id, data, null, experience), team: null, delivery: null, result: null } satisfies MyEnrollmentView;
    }
    const challenge = await loadChallenge(db, data.challengeId).catch(() => null);
    const experience = challenge ? await loadExperience(db, challenge.experienceId).catch(() => null) : null;
    if (!challenge || !experience) return null;
    const base = toEnrollmentBase(doc.id, data, challenge, experience);
    const context = await resolveContext(db, actor.uid, challenge, experience, data, now);
    let delivery: MyEnrollmentView["delivery"] = null;
    if (context.eligible && context.submissionId) {
      const submissionSnapshot = await db.collection(SUBMISSIONS).doc(context.submissionId).get();
      const submission = toSubmission(submissionSnapshot.data());
      delivery = {
        state: deliveryState(submission, challenge.submissionClosesAt, now),
        canEdit: context.canEdit,
        text: submission?.text ?? "",
        links: submission?.links ?? [],
        updatedAt: submission?.updatedAt ?? null,
        submittedAt: submission?.submittedAt ?? null,
      };
    }
    const result = context.eligible ? await resultForSubmission(db, challenge.id, context.submissionId) : null;
    return { ...base, team: context.team, delivery, result };
  }));
  return views
    .filter((view): view is MyEnrollmentView => view !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Cancela una inscripción propia, antes del cierre, sin equipo y sin entrega enviada. */
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
  if (data.challengeId == null) {
    // Inscripción a la experiencia: se cancela mientras esté publicada y la sesión no haya terminado.
    const experience = await loadExperience(db, data.experienceId);
    const ended = experience.endsAt ? Date.parse(experience.endsAt) <= now.getTime() : false;
    if (experience.status !== "published" || ended) {
      throw new HttpError(409, "plazo_cerrado", "La experiencia ya concluyó; la inscripción no se puede cancelar.");
    }
    await ref.update({ status: "cancelled", updatedAt: now.toISOString() });
    return;
  }
  const challenge = await loadChallenge(db, data.challengeId);
  if (!canEditDelivery(challenge.submissionClosesAt, now)) {
    throw new HttpError(409, "plazo_cerrado", "El plazo de entregas ya cerró; la inscripción no se puede cancelar.");
  }
  const membership = await db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(data.experienceId, actor.uid)).get();
  if (membership.exists) {
    throw new HttpError(409, "en_equipo", "Salí del equipo antes de cancelar la inscripción.");
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

/** Revisión de C3: aprobar habilita; rechazar cierra. Aprobar individual crea la participación. Solo administradores. */
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
    const experienceStatus = (await transaction.get(db.collection(EXPERIENCES).doc(data.experienceId))).data()?.status;
    if (experienceStatus === "closed" || experienceStatus === "cancelled") {
      throw new HttpError(409, "experiencia_cerrada", "La experiencia ya concluyó o se canceló: no se revisan más inscripciones.");
    }
    transaction.update(ref, { status: rawStatus, reviewedAt: stamp, reviewedByUid: actor.uid, updatedAt: stamp });
    recordAudit(db, transaction, actor, now, {
      action: "enrollment.review",
      target: { type: "enrollment", id: enrollmentId },
      details: { decision: rawStatus, experienceId: data.experienceId, challengeId: data.challengeId ?? null },
    });
    if (rawStatus === "approved" && data.mode !== "team" && data.challengeId != null) {
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
  mode: ParticipationMode;
  challengeId: string | null;
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
}

async function toAdminRows(db: Firestore, docs: QueryDocumentSnapshot[]): Promise<AdminEnrollmentRow[]> {
  const rows = await Promise.all(docs.map(async (doc) => {
    const data = doc.data();
    const user = await db.collection(USERS).doc(data.userId).get();
    return {
      id: doc.id,
      status: data.status as EnrollmentStatus,
      mode: (data.mode === "team" ? "team" : "individual") as ParticipationMode,
      challengeId: (data.challengeId as string | null | undefined) ?? null,
      userId: data.userId,
      displayName: (user.data()?.displayName as string | undefined) ?? null,
      email: (user.data()?.email as string | undefined) ?? null,
      createdAt: data.createdAt,
    };
  }));
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Inscripciones de un reto para la revisión de C3. */
export async function listEnrollmentsForChallenge(db: Firestore, actor: Actor, challengeId: string): Promise<AdminEnrollmentRow[]> {
  requireAdmin(actor);
  const snapshot = await db.collection(ENROLLMENTS).where("challengeId", "==", challengeId).get();
  return toAdminRows(db, snapshot.docs);
}

export interface ExperienceEnrollments {
  enrollments: AdminEnrollmentRow[];
  summary: {
    capacity: number | null;
    spotsLeft: number | null;
    counts: EnrollmentCounts;
  };
}

/** Todas las inscripciones de una experiencia (con o sin reto) y su ocupación de cupos. */
export async function listEnrollmentsForExperience(db: Firestore, actor: Actor, experienceId: string): Promise<ExperienceEnrollments> {
  requireAdmin(actor);
  const experience = await loadExperience(db, experienceId);
  const snapshot = await db.collection(ENROLLMENTS).where("experienceId", "==", experienceId).get();
  const counts = countEnrollments(snapshot.docs.map((doc) => doc.data().status as string));
  return {
    enrollments: await toAdminRows(db, snapshot.docs),
    summary: { capacity: experience.capacity ?? null, spotsLeft: spotsLeft(experience, counts), counts },
  };
}

/** Vista de la entrega para la persona inscrita. Solo lee la entrega de su propio contexto. */
export async function getDelivery(db: Firestore, actor: Actor, challengeId: string, now: Date): Promise<DeliveryView> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();

  const enrollment = (await db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid)).get()).data();
  const context = await resolveContext(db, actor.uid, challenge, experience, enrollment, now);
  const submissionSnapshot = context.eligible && context.submissionId
    ? await db.collection(SUBMISSIONS).doc(context.submissionId).get()
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
    enrollmentStatus: (enrollment?.status as EnrollmentStatus | undefined) ?? null,
    mode: enrollment ? (enrollment.mode === "team" ? "team" : "individual") : null,
    team: context.team,
    eligible: context.eligible,
    canEdit: context.canEdit,
    state: deliveryState(submission, challenge.submissionClosesAt, now),
    submission,
  };
}

/** Guarda la entrega como borrador o la envía. Equipo: solo la líder. Dentro del plazo. */
export async function saveDelivery(db: Firestore, actor: Actor, challengeId: string, rawInput: unknown, now: Date): Promise<DeliveryView> {
  const input = parseDeliveryInput(rawInput);
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();

  const enrollment = (await db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid)).get()).data();
  const context = await resolveContext(db, actor.uid, challenge, experience, enrollment, now);
  if (!context.eligible || !context.submissionId) {
    if (context.mode === "team" && context.team && context.team.status === "incompleto") {
      throw new HttpError(403, "equipo_incompleto", "Tu equipo todavía no alcanzó el mínimo de integrantes. Cuando lo alcance, la líder podrá entregar.");
    }
    throw new HttpError(403, "no_habilitado", "Tu inscripción todavía no está aprobada. Cuando C3 la habilite, podrás entregar.");
  }
  if (!context.isLeader) {
    throw new HttpError(403, "solo_lider", "Solo la líder del equipo puede guardar o enviar la entrega.");
  }
  if (!canSubmit({
    challengeStatus: challenge.status,
    enrollmentStatus: "approved",
    submissionClosesAt: challenge.submissionClosesAt ?? "",
    now: now.toISOString(),
  })) {
    throw new HttpError(409, "plazo_cerrado", "El plazo de entregas ya cerró. La entrega queda como está.");
  }

  const ref = db.collection(SUBMISSIONS).doc(context.submissionId);
  const existing = (await ref.get()).data();
  const alreadySubmitted = existing?.status === "submitted";
  const status: "draft" | "submitted" = input.submit || alreadySubmitted ? "submitted" : "draft";
  const stamp = now.toISOString();
  await ref.set({
    participationId: ref.id,
    challengeId: challenge.id,
    userId: actor.uid,
    mode: context.mode,
    status,
    text: input.text,
    links: input.links,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
    submittedAt: status === "submitted" ? (existing?.submittedAt ?? stamp) : null,
  });
  return getDelivery(db, actor, challengeId, now);
}
