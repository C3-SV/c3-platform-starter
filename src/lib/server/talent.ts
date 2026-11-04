/**
 * Talento para empresas (E4–E9): tablero de entregas, lista corta, solicitud de contacto con consentimiento
 * y defensa de la entrega. Las reglas puras viven en domain/contact.ts y domain/defense.ts.
 * La empresa solo ve su propia organización; la persona solo ve sus solicitudes y su defensa.
 * Ninguna vista expone el correo ni otros datos de contacto: el canal de contacto es simulado en la demo.
 */
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import type { CommercialPackageId } from "../domain/commercial.ts";
import {
  ACTIVE_CONTACT_STATUSES,
  canTransitionContact,
  contactEligibilityIssue,
  contactStatePresentation,
  nextContactStatus,
  parseContactMessage,
  parseShortlistReason,
  type ContactActor,
  type ContactStatus,
} from "../domain/contact.ts";
import { canRecordDefense, parseDefenseInput, type DefenseInput } from "../domain/defense.ts";
import { canViewFeedback, parseCheckpointInput, parseFeedbackInput } from "../domain/process.ts";
import { consolidatedAverage, criterionAverages, evaluationStateOf } from "../domain/evaluation.ts";
import type { RubricCriterion } from "../domain/types.ts";
import { EVALUATIONS } from "./evaluation.ts";
import type { PresentedState } from "../domain/presentation.ts";
import type { Challenge } from "../domain/types.ts";
import { ValidationFailure } from "../domain/validation.ts";
import { recordAudit } from "./audit.ts";
import type { Actor } from "./auth.ts";
import { CHALLENGES, ORGANIZATIONS, loadChallenge, loadExperience } from "./catalog.ts";
import { ORGANIZATION_MEMBERS } from "./companies.ts";
import { HttpError, notFound } from "./errors.ts";
import {
  CHECKPOINTS,
  CONTACT_REQUESTS,
  DEFENSES,
  FEEDBACKS,
  RESULTS,
  ENROLLMENTS,
  SHORTLISTS,
  SUBMISSIONS,
  TEAMS,
  TEAM_MEMBERSHIPS,
  USERS,
  contactRequestDocId,
  enrollmentDocId,
  membershipDocId,
  participationDocId,
  talentRowTokenOf,
  teamParticipationDocId,
} from "./ids.ts";

export interface DefenseView extends DefenseInput {
  submissionId: string;
  updatedAt: string;
}

export interface ContactView {
  id: string;
  status: ContactStatus;
  state: PresentedState;
  message: string | null;
  updatedAt: string;
}

export interface TalentRow {
  /** Token opaco de la fila (ver talentRowTokenOf): no es el id interno ni revela el uid de quien entregó. */
  submissionId: string;
  mode: "individual" | "team";
  name: string | null;
  submittedAt: string | null;
  text: string;
  links: string[];
  defense: DefenseView | null;
  shortlist: { reason: string; addedAt: string } | null;
  contact: ContactView | null;
  /** Estado de evaluación de la entrega. Promedio y criterios solo cuando C3 publicó con puntajes visibles. */
  evaluation: { state: string; average: number | null; criteria: Record<string, number | null> | null };
  /** Bitácora de la persona, en orden de creación. */
  checkpoints: CheckpointView[];
  /** Retroalimentación de la empresa, incluido el borrador no publicado (la empresa la ve siempre). */
  feedback: FeedbackView | null;
  /** Ya se puede pedir contacto: lista corta, inscripción aprobada, entrega individual y sin solicitud activa. */
  canRequestContact: boolean;
}

export interface CheckpointView {
  id: string;
  text: string;
  link: string | null;
  createdAt: string;
}

export interface FeedbackView {
  text: string;
  publishedAt: string | null;
  updatedAt: string;
}

export interface TalentBoard {
  challenge: {
    id: string;
    title: string;
    organizationId: string | null;
    status: string;
    isDemo: boolean;
    commercialPackage: CommercialPackageId | null;
    rubric: RubricCriterion[];
  };
  rows: TalentRow[];
}

export interface ContactForMe {
  id: string;
  challengeId: string;
  challengeTitle: string;
  organizationName: string;
  status: ContactStatus;
  state: PresentedState;
  message: string | null;
  updatedAt: string;
  /** Datos inventados de la demostración: se marcan como tales en la interfaz. */
  isDemo: boolean;
  /** Acciones que la persona puede tomar ahora sobre esta solicitud. */
  actions: ContactStatus[];
}

type Raw = Record<string, unknown>;
const PARTICIPANT_ACTIONS: readonly ContactStatus[] = ["aceptado", "declinado", "revocado"];
const COMPANY_ACTIONS: readonly ContactStatus[] = ["contactado", "seguimiento"];

function asObject(raw: unknown): Raw {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Raw) : {};
}

function forbidden(message: string): HttpError {
  return new HttpError(403, "sin_permiso", message);
}

/** Organización del challenge. Solo admin y representantes vinculadas por C3 pasan. Los borradores no existen para la empresa. */
async function requireCompanyChallenge(db: Firestore, actor: Actor, challengeId: string): Promise<Challenge & { organizationId: string | null }> {
  const challenge = await loadChallenge(db, challengeId);
  const raw = (await db.collection(CHALLENGES).doc(challengeId).get()).data() as DocumentData;
  const organizationId = typeof raw.organizationId === "string" ? raw.organizationId : null;
  if (challenge.status === "draft" && !actor.isAdmin) throw notFound();
  if (!actor.isAdmin) await requireOrganizationMember(db, actor, organizationId);
  return { ...challenge, organizationId };
}

async function requireOrganizationMember(db: Firestore, actor: Actor, organizationId: string | null): Promise<void> {
  if (!organizationId) throw forbidden("Este challenge no tiene una empresa vinculada.");
  if (!(await isOrganizationMember(db, actor, organizationId))) throw forbidden("Solo la representante de la empresa de este challenge puede hacer esto.");
}

async function isOrganizationMember(db: Firestore, actor: Actor, organizationId: string | null): Promise<boolean> {
  if (!organizationId) return false;
  return (await db.collection(ORGANIZATION_MEMBERS).doc(`${organizationId}__${actor.uid}`).get()).exists;
}

async function displayNamesOf(db: Firestore, userIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds)];
  const snapshots = await Promise.all(unique.map((uid) => db.collection(USERS).doc(uid).get()));
  return new Map(unique.map((uid, index) => [uid, (snapshots[index].data()?.displayName as string | undefined) ?? null]));
}

async function teamNamesOf(db: Firestore, teamIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(teamIds)];
  const snapshots = await Promise.all(unique.map((id) => db.collection(TEAMS).doc(id).get()));
  return new Map(unique.map((id, index) => [id, (snapshots[index].data()?.name as string | undefined) ?? null]));
}

/** Líder de cada equipo: a quien se pide contacto por la entrega del equipo. */
async function leadersOf(db: Firestore, teamIds: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(teamIds)];
  const snapshots = await Promise.all(unique.map((id) => db.collection(TEAMS).doc(id).get()));
  return new Map(unique.map((id, index) => [id, (snapshots[index].data()?.leaderUserId as string | undefined) ?? null]));
}

/** Persona a quien se pide contacto por una entrega: la propia si es individual, la líder si es de equipo. */
async function contactPersonOf(db: Firestore, submissionId: string, submission: DocumentData): Promise<string | null> {
  if (submission.mode !== "team") return (submission.userId as string | undefined) ?? null;
  const teamId = submissionId.split("__team__")[1];
  if (!teamId) return null;
  return (await leadersOf(db, [teamId])).get(teamId) ?? null;
}

function defenseOf(submissionId: string, data: DocumentData): DefenseView {
  return {
    submissionId,
    videoUrl: data.videoUrl ?? null,
    summary: data.summary,
    decisions: data.decisions,
    testing: data.testing ?? null,
    tradeoffs: data.tradeoffs ?? null,
    aiUse: data.aiUse ?? null,
    updatedAt: data.updatedAt,
  };
}

function contactViewOf(id: string, data: DocumentData): ContactView {
  const status = data.status as ContactStatus;
  return {
    id,
    status,
    state: contactStatePresentation(status, "company"),
    message: data.message ?? null,
    updatedAt: data.updatedAt,
  };
}

/** Tablero de entregas enviadas del challenge para la empresa: entregables, defensa, lista corta y contacto. */
export async function getTalentBoard(db: Firestore, actor: Actor, challengeId: string): Promise<TalentBoard> {
  const challenge = await requireCompanyChallenge(db, actor, challengeId);
  const [submissions, defenses, shortlist, requests, enrollments] = await Promise.all([
    db.collection(SUBMISSIONS).where("challengeId", "==", challengeId).where("status", "==", "submitted").get(),
    db.collection(DEFENSES).where("challengeId", "==", challengeId).get(),
    db.collection(SHORTLISTS).where("challengeId", "==", challengeId).get(),
    db.collection(CONTACT_REQUESTS).where("challengeId", "==", challengeId).get(),
    db.collection(ENROLLMENTS).where("challengeId", "==", challengeId).where("status", "==", "approved").get(),
  ]);

  const defenseById = new Map(defenses.docs.map((doc) => [doc.id, defenseOf(doc.id, doc.data())]));
  const shortlistById = new Map(shortlist.docs.map((doc) => [doc.id, doc.data()]));
  const requestByUser = new Map(requests.docs.map((doc) => [doc.data().userId as string, { id: doc.id, data: doc.data() }]));
  const approvedUsers = new Set(enrollments.docs.map((doc) => doc.data().userId as string));

  const individualUserIds = submissions.docs.filter((doc) => doc.data().mode !== "team").map((doc) => doc.data().userId as string);
  const teamIds = submissions.docs.filter((doc) => doc.data().mode === "team").map((doc) => doc.id.split("__team__")[1]);
  const [names, teamNames, leaders] = await Promise.all([displayNamesOf(db, individualUserIds), teamNamesOf(db, teamIds), leadersOf(db, teamIds)]);

  const rows: TalentRow[] = submissions.docs.map((doc) => {
    const data = doc.data();
    const isTeam = data.mode === "team";
    // Entrega de equipo: la persona de contacto es su líder. El uid no sale en la fila.
    const userId = isTeam ? (leaders.get(doc.id.split("__team__")[1]) ?? null) : (data.userId as string);
    const request = userId ? requestByUser.get(userId) : undefined;
    const entry = shortlistById.get(doc.id);
    const hasActiveRequest = request ? ACTIVE_CONTACT_STATUSES.includes(request.data.status as ContactStatus) : false;
    return {
      submissionId: doc.id,
      mode: isTeam ? "team" : "individual",
      name: isTeam ? (teamNames.get(doc.id.split("__team__")[1]) ?? null) : (names.get(userId as string) ?? null),
      submittedAt: data.submittedAt ?? null,
      text: data.text ?? "",
      links: data.links ?? [],
      defense: defenseById.get(doc.id) ?? null,
      shortlist: entry ? { reason: entry.reason, addedAt: entry.createdAt } : null,
      contact: request && userId ? contactViewOf(request.id, request.data) : null,
      evaluation: { state: "sin_evaluar", average: null, criteria: null },
      checkpoints: [],
      feedback: null,
      canRequestContact: contactEligibilityIssue({
        isLinkedRepresentative: true,
        hasShortlistEntry: Boolean(entry),
        hasApprovedEnrollment: Boolean(userId && approvedUsers.has(userId)),
        hasActiveRequest,
      }) === null && !request,
    };
  });

  const [checkpointDocs, feedbackDocs] = await Promise.all([
    db.collection(CHECKPOINTS).where("challengeId", "==", challengeId).get(),
    db.collection(FEEDBACKS).where("challengeId", "==", challengeId).get(),
  ]);
  const checkpointsBySubmission = new Map<string, CheckpointView[]>();
  for (const doc of checkpointDocs.docs) {
    const data = doc.data();
    checkpointsBySubmission.set(data.submissionId, [...(checkpointsBySubmission.get(data.submissionId) ?? []), checkpointOf(doc.id, data)]);
  }
  const feedbackBySubmission = new Map(feedbackDocs.docs.map((doc) => [doc.id, feedbackOf(doc.data())]));
  for (const row of rows) {
    row.checkpoints = (checkpointsBySubmission.get(row.submissionId) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    row.feedback = feedbackBySubmission.get(row.submissionId) ?? null;
  }

  const [evaluationDocs, resultsSnapshot] = await Promise.all([
    db.collection(EVALUATIONS).where("challengeId", "==", challengeId).get(),
    db.collection(RESULTS).doc(challengeId).get(),
  ]);
  const resultsData = resultsSnapshot.data();
  const published = resultsData?.status === "published";
  const showScores = published && resultsData?.showScores === true;
  for (const row of rows) {
    const mine = evaluationDocs.docs.map((doc) => doc.data()).filter((data) => data.submissionId === row.submissionId);
    const finalized = mine.filter((data) => data.status === "finalized");
    const finalizedJudges = new Set(finalized.map((data) => data.judgeUserId)).size;
    row.evaluation = {
      state: evaluationStateOf({ evaluations: mine.length, finalizedJudges, published }),
      average: showScores ? consolidatedAverage(finalized.map((data) => data.total as number)) : null,
      criteria: showScores && finalized.length > 0
        ? criterionAverages(finalized.map((data) => data.scores as Record<string, number>), challenge.rubric)
        : null,
    };
  }

  const experience = await loadExperience(db, challenge.experienceId);
  return {
    challenge: {
      id: challenge.id,
      title: challenge.title,
      organizationId: challenge.organizationId,
      status: challenge.status,
      isDemo: experience.isDemo === true,
      commercialPackage: challenge.commercialPackage ?? null,
      rubric: challenge.rubric,
    },
    rows: rows
      .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""))
      .map((row) => ({
        ...row,
        submissionId: talentRowTokenOf(row.submissionId),
        defense: row.defense ? { ...row.defense, submissionId: talentRowTokenOf(row.defense.submissionId) } : null,
      })),
  };
}

/** Solo una entrega enviada del challenge puede entrar a la lista corta. */
async function submittedSubmissionOf(db: Firestore, challengeId: string, submissionId: string): Promise<DocumentData> {
  const snapshot = await db.collection(SUBMISSIONS).doc(submissionId).get();
  const data = snapshot.data();
  if (!snapshot.exists || !data || data.challengeId !== challengeId || data.status !== "submitted") {
    throw notFound("La entrega no existe o todavía no fue enviada en este challenge.");
  }
  return data;
}

/** Resuelve el token de una fila del tablero a su entrega enviada del challenge. Un id interno o ajeno no encuentra nada. */
async function submissionIdFromRow(db: Firestore, challengeId: string, rowToken: string): Promise<string> {
  const snapshot = await db.collection(SUBMISSIONS).where("challengeId", "==", challengeId).where("status", "==", "submitted").get();
  const match = snapshot.docs.find((doc) => talentRowTokenOf(doc.id) === rowToken);
  if (!match) throw notFound("La entrega no existe o todavía no fue enviada en este challenge.");
  return match.id;
}

function submissionIdOf(body: Raw): string {
  const value = typeof body.submissionId === "string" ? body.submissionId.trim() : "";
  if (!value) throw new ValidationFailure([{ field: "submissionId", message: "Elegí una entrega enviada." }]);
  return value;
}

export async function addToShortlist(db: Firestore, actor: Actor, challengeId: string, rawBody: unknown, now: Date): Promise<void> {
  const challenge = await requireCompanyChallenge(db, actor, challengeId);
  const body = asObject(rawBody);
  const submissionId = await submissionIdFromRow(db, challengeId, submissionIdOf(body));
  const reason = parseShortlistReason(body.reason);
  const submission = await submittedSubmissionOf(db, challengeId, submissionId);

  const ref = db.collection(SHORTLISTS).doc(submissionId);
  const batch = db.batch();
  batch.set(ref, {
    organizationId: challenge.organizationId,
    challengeId,
    submissionId,
    userId: submission.mode === "team" ? null : submission.userId,
    reason,
    addedByUserId: actor.uid,
    createdAt: now.toISOString(),
  });
  recordAudit(db, batch, actor, now, { action: "lista_corta.agregar", target: { type: "submission", id: submissionId }, details: { challengeId } });
  await batch.commit();
}

export async function removeFromShortlist(db: Firestore, actor: Actor, challengeId: string, rowToken: string, now: Date): Promise<void> {
  await requireCompanyChallenge(db, actor, challengeId);
  const submissionId = await submissionIdFromRow(db, challengeId, rowToken);
  const ref = db.collection(SHORTLISTS).doc(submissionId);
  const entry = (await ref.get()).data();
  if (!entry || entry.challengeId !== challengeId) throw notFound("Esa entrega no está en la lista corta de este challenge.");
  const submission = (await db.collection(SUBMISSIONS).doc(submissionId).get()).data();
  const userId = submission ? await contactPersonOf(db, submissionId, submission) : null;
  if (userId) {
    const request = (await db.collection(CONTACT_REQUESTS).doc(contactRequestDocId(challengeId, userId)).get()).data();
    if (request && ACTIVE_CONTACT_STATUSES.includes(request.status as ContactStatus)) {
      throw new HttpError(409, "solicitud_activa", "Cerrá la solicitud de contacto antes de quitar a la persona de la lista corta.");
    }
  }
  const batch = db.batch();
  batch.delete(ref);
  recordAudit(db, batch, actor, now, { action: "lista_corta.quitar", target: { type: "submission", id: submissionId }, details: { challengeId } });
  await batch.commit();
}

/**
 * Solicitud de contacto. Requiere: entrega (individual o de equipo, a través de su líder), lista corta, inscripción aprobada en el challenge
 * y ninguna solicitud activa. La persona decide después (consentimiento); nada se envía por correo.
 */
export async function requestContact(db: Firestore, actor: Actor, challengeId: string, rawBody: unknown, now: Date): Promise<ContactView> {
  const challenge = await requireCompanyChallenge(db, actor, challengeId);
  const body = asObject(rawBody);
  const submissionId = await submissionIdFromRow(db, challengeId, submissionIdOf(body));
  const message = parseContactMessage(body.message);
  const submission = await submittedSubmissionOf(db, challengeId, submissionId);
  // Entrega de equipo: la solicitud va a la líder del equipo (canal simulado en la demo).
  const userId = await contactPersonOf(db, submissionId, submission);
  if (!userId) throw new HttpError(409, "equipo_sin_lider", "El equipo no tiene líder registrada: no se puede pedir contacto.");

  const id = contactRequestDocId(challengeId, userId);
  const stamp = now.toISOString();
  const status = nextContactStatus(null, "company", "esperando_consentimiento");
  const data = {
    organizationId: challenge.organizationId,
    challengeId,
    userId,
    status,
    message,
    requestedByUserId: actor.uid,
    lastChangedBy: "company" satisfies ContactActor,
    createdAt: stamp,
    updatedAt: stamp,
  };
  // Comprobaciones y escritura en una transacción: dos solicitudes simultáneas no se pisan y una solicitud
  // declinada o revocada no vuelve a abrirse.
  await db.runTransaction(async (transaction) => {
    const shortlistEntry = await transaction.get(db.collection(SHORTLISTS).doc(submissionId));
    const enrollment = await transaction.get(db.collection(ENROLLMENTS).doc(enrollmentDocId(challenge.experienceId, userId)));
    const existing = await transaction.get(db.collection(CONTACT_REQUESTS).doc(id));
    const active = existing.exists && ACTIVE_CONTACT_STATUSES.includes(existing.data()?.status as ContactStatus);
    // Declinada o revocada son respuestas finales: no se vuelve a pedir contacto ni se reemplaza la solicitud cerrada.
    if (existing.exists && !active) {
      throw new HttpError(409, "contacto_cerrado", "La persona ya respondió a una solicitud anterior: declinó o revocó el permiso. No se vuelve a pedir contacto.");
    }
    const issue = contactEligibilityIssue({
      isLinkedRepresentative: true,
      hasShortlistEntry: shortlistEntry.exists,
      // La inscripción aprobada debe ser la de este challenge: una de otro challenge de la misma experiencia no cuenta.
      hasApprovedEnrollment: enrollment.data()?.status === "approved" && enrollment.data()?.challengeId === challengeId,
      hasActiveRequest: active,
    });
    if (issue) throw new HttpError(409, "contacto_no_disponible", issue);
    transaction.set(db.collection(CONTACT_REQUESTS).doc(id), data);
    recordAudit(db, transaction, actor, now, { action: "contacto.solicitar", target: { type: "contactRequest", id }, details: { challengeId } });
  });
  return contactViewOf(id, data);
}

/** La persona acepta, declina o revoca. Solo sobre sus propias solicitudes; una ajena responde como inexistente. */
export async function answerContactRequest(db: Firestore, actor: Actor, requestId: string, rawBody: unknown, now: Date): Promise<ContactView> {
  const ref = db.collection(CONTACT_REQUESTS).doc(requestId);
  const body = asObject(rawBody);
  if (typeof body.to !== "string" || !PARTICIPANT_ACTIONS.includes(body.to as ContactStatus)) {
    throw new ValidationFailure([{ field: "to", message: "Elegí aceptar, declinar o revocar el permiso." }]);
  }
  const to = body.to as ContactStatus;
  const stamp = now.toISOString();
  // Lectura y escritura en una transacción: dos respuestas simultáneas no pisan el estado.
  const updated = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (!snapshot.exists || !data || data.userId !== actor.uid) throw notFound("No encontramos esa solicitud.");
    const next = nextContactStatus(data.status as ContactStatus, "participant", to);
    transaction.update(ref, { status: next, lastChangedBy: "participant", updatedAt: stamp });
    recordAudit(db, transaction, actor, now, { action: `contacto.${next}`, target: { type: "contactRequest", id: requestId } });
    return { ...data, status: next, updatedAt: stamp };
  });
  return contactViewOf(requestId, updated);
}

/** La empresa registra contacto o seguimiento tras la aceptación. No implica contratación. */
export async function advanceContactRequest(db: Firestore, actor: Actor, requestId: string, rawBody: unknown, now: Date): Promise<ContactView> {
  const ref = db.collection(CONTACT_REQUESTS).doc(requestId);
  const body = asObject(rawBody);
  if (typeof body.to !== "string" || !COMPANY_ACTIONS.includes(body.to as ContactStatus)) {
    throw new ValidationFailure([{ field: "to", message: "Elegí registrar el contacto o el seguimiento." }]);
  }
  const to = body.to as ContactStatus;
  const stamp = now.toISOString();
  // La transacción vuelve a leer el estado antes de escribir: una respuesta de la persona no se pierde ni se pisa.
  const updated = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (!snapshot.exists || !data) throw notFound("No encontramos esa solicitud.");
    // Una solicitud ajena responde como inexistente: no se revela si existe para otra empresa.
    if (!actor.isAdmin && !(await isOrganizationMember(db, actor, (data.organizationId as string | null) ?? null))) {
      throw notFound("No encontramos esa solicitud.");
    }
    if (!canTransitionContact(data.status as ContactStatus, "company", to)) {
      throw new ValidationFailure([{ field: "to", message: "Esa acción no está disponible para el estado actual de la solicitud." }]);
    }
    transaction.update(ref, { status: to, lastChangedBy: "company", updatedAt: stamp });
    recordAudit(db, transaction, actor, now, { action: `contacto.${to}`, target: { type: "contactRequest", id: requestId } });
    return { ...data, status: to, updatedAt: stamp };
  });
  return contactViewOf(requestId, updated);
}

/** Solicitudes que la persona recibió, con las acciones que puede tomar. Nunca datos de la empresa más allá del nombre. */
export async function listMyContactRequests(db: Firestore, actor: Actor): Promise<ContactForMe[]> {
  const snapshot = await db.collection(CONTACT_REQUESTS).where("userId", "==", actor.uid).get();
  const rows = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const status = data.status as ContactStatus;
    const challenge = (await db.collection(CHALLENGES).doc(data.challengeId).get()).data();
    const organization = data.organizationId ? (await db.collection(ORGANIZATIONS).doc(data.organizationId).get()).data() : undefined;
    const candidates = [...PARTICIPANT_ACTIONS];
    return {
      id: doc.id,
      challengeId: data.challengeId as string,
      challengeTitle: (challenge?.title as string | undefined) ?? "Challenge",
      organizationName: (organization?.name as string | undefined) ?? "Empresa",
      status,
      state: contactStatePresentation(status, "participant"),
      message: (data.message as string | null) ?? null,
      updatedAt: data.updatedAt as string,
      isDemo: challenge?.demo === true,
      actions: candidates.filter((to) => canTransitionContact(status, "participant", to)),
    };
  }));
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Entrega propia de la persona en el challenge: la submission individual, o la del equipo si ella es integrante.
 * Un challenge concluido sigue mostrando lo que la empresa publicó; las escrituras se cierran aparte.
 */
async function ownSubmissionOf(db: Firestore, actor: Actor, challengeId: string): Promise<{ submissionId: string; isLeader: boolean } | null> {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published" && challenge.status !== "closed") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  const enrollment = (await db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid)).get()).data();
  if (!enrollment || enrollment.status !== "approved" || enrollment.challengeId !== challengeId) return null;
  if (enrollment.mode !== "team") return { submissionId: participationDocId(challengeId, actor.uid), isLeader: true };
  const membership = (await db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(experience.id, actor.uid)).get()).data();
  if (!membership?.teamId) return null;
  const team = (await db.collection(TEAMS).doc(membership.teamId).get()).data();
  return { submissionId: teamParticipationDocId(challengeId, membership.teamId), isLeader: team?.leaderUserId === actor.uid };
}

export async function getMyDefense(db: Firestore, actor: Actor, challengeId: string): Promise<DefenseView | null> {
  const own = await ownSubmissionOf(db, actor, challengeId);
  if (!own) return null;
  const snapshot = await db.collection(DEFENSES).doc(own.submissionId).get();
  return snapshot.exists ? defenseOf(own.submissionId, snapshot.data() as DocumentData) : null;
}

/** Registra o actualiza la defensa de mi entrega enviada. En equipo, solo la líder. */
export async function saveDefense(db: Firestore, actor: Actor, challengeId: string, rawBody: unknown, now: Date): Promise<DefenseView> {
  const own = await ownSubmissionOf(db, actor, challengeId);
  if (!own) throw forbidden("Tu inscripción todavía no está aprobada para este challenge.");
  if (!own.isLeader) throw new HttpError(403, "solo_lider", "Solo la líder del equipo registra la defensa.");
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") {
    throw new HttpError(409, "reto_concluido", "El challenge ya concluyó: la defensa ya no se puede modificar.");
  }
  // La defensa se congela al cerrar el plazo de entregas (update, bloque de defensa).
  if (challenge.submissionClosesAt && Date.parse(challenge.submissionClosesAt) <= now.getTime()) {
    throw new HttpError(409, "plazo_cerrado", "La defensa se cierra con el plazo de entregas.");
  }
  const submission = (await db.collection(SUBMISSIONS).doc(own.submissionId).get()).data();
  if (!canRecordDefense(submission?.status ?? null)) {
    throw new HttpError(409, "entrega_no_enviada", "Enviá tu entrega antes de registrar la defensa.");
  }
  const input = parseDefenseInput(rawBody);
  const ref = db.collection(DEFENSES).doc(own.submissionId);
  const existing = (await ref.get()).data();
  const stamp = now.toISOString();
  const data = {
    challengeId,
    userId: actor.uid,
    ...input,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  };
  const batch = db.batch();
  batch.set(ref, data);
  recordAudit(db, batch, actor, now, { action: "defensa.registrar", target: { type: "submission", id: own.submissionId }, details: { challengeId } });
  await batch.commit();
  return defenseOf(own.submissionId, data);
}

function checkpointOf(id: string, data: DocumentData): CheckpointView {
  return { id, text: data.text, link: data.link ?? null, createdAt: data.createdAt };
}

function feedbackOf(data: DocumentData): FeedbackView {
  return { text: data.text, publishedAt: data.publishedAt ?? null, updatedAt: data.updatedAt };
}

/** Una entrada de la bitácora. Solo con inscripción aprobada y hasta el cierre de entregas. */
export async function addCheckpoint(db: Firestore, actor: Actor, challengeId: string, rawBody: unknown, now: Date): Promise<CheckpointView> {
  const input = parseCheckpointInput(rawBody);
  const own = await ownSubmissionOf(db, actor, challengeId);
  if (!own) throw forbidden("Tu inscripción todavía no está aprobada para este challenge.");
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") {
    throw new HttpError(409, "reto_concluido", "El challenge ya concluyó: la bitácora ya no se puede modificar.");
  }
  if (challenge.submissionClosesAt && Date.parse(challenge.submissionClosesAt) <= now.getTime()) {
    throw new HttpError(409, "plazo_cerrado", "La bitácora se cierra con el plazo de entregas.");
  }
  const ref = db.collection(CHECKPOINTS).doc();
  const data = {
    challengeId,
    submissionId: own.submissionId,
    authorUid: actor.uid,
    text: input.text,
    link: input.link,
    createdAt: now.toISOString(),
  };
  await ref.set(data);
  return checkpointOf(ref.id, data);
}

/** Mi bitácora en el challenge (la de mi equipo, si soy integrante). */
export async function listMyCheckpoints(db: Firestore, actor: Actor, challengeId: string): Promise<CheckpointView[]> {
  const own = await ownSubmissionOf(db, actor, challengeId);
  if (!own) return [];
  const snapshot = await db.collection(CHECKPOINTS).where("submissionId", "==", own.submissionId).get();
  return snapshot.docs.map((doc) => checkpointOf(doc.id, doc.data())).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** La empresa redacta la retroalimentación de una entrega enviada; «publicar» la hace visible para la persona. */
export async function saveFeedback(db: Firestore, actor: Actor, challengeId: string, rawBody: unknown, now: Date): Promise<FeedbackView> {
  const challenge = await requireCompanyChallenge(db, actor, challengeId);
  // La retroalimentación se escribe solo mientras el challenge está publicado: ni en borrador ni después de concluir.
  if (challenge.status !== "published") {
    throw new HttpError(409, "reto_concluido", "El challenge ya concluyó: la retroalimentación ya no se puede modificar.");
  }
  const body = asObject(rawBody);
  const submissionId = await submissionIdFromRow(db, challengeId, submissionIdOf(body));
  const input = parseFeedbackInput(body);
  await submittedSubmissionOf(db, challengeId, submissionId);
  const ref = db.collection(FEEDBACKS).doc(submissionId);
  const existing = (await ref.get()).data();
  const stamp = now.toISOString();
  const data = {
    challengeId,
    submissionId,
    organizationId: challenge.organizationId,
    text: input.text,
    publishedAt: input.publish ? (existing?.publishedAt ?? stamp) : null,
    updatedAt: stamp,
    writtenByUid: actor.uid,
  };
  const batch = db.batch();
  batch.set(ref, data);
  recordAudit(db, batch, actor, now, { action: "retroalimentacion.guardar", target: { type: "submission", id: submissionId }, details: { challengeId, publicada: input.publish } });
  await batch.commit();
  return feedbackOf(data);
}

/** Mi retroalimentación: solo la publicada. Un borrador de la empresa nunca llega a la persona. */
export async function getMyFeedback(db: Firestore, actor: Actor, challengeId: string): Promise<FeedbackView | null> {
  const own = await ownSubmissionOf(db, actor, challengeId);
  if (!own) return null;
  const snapshot = await db.collection(FEEDBACKS).doc(own.submissionId).get();
  const data = snapshot.data();
  if (!data || !canViewFeedback(data.publishedAt ?? null, "participant")) return null;
  return feedbackOf(data);
}
