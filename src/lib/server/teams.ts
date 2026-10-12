/**
 * Equipos de un reto (Corte 3). Reglas: un equipo por persona y experiencia; solo con inscripción
 * por equipo aprobada; cupo máximo; habilitado al llegar al mínimo; cambios hasta el cierre de inscripciones
 * y sin entrega enviada. Cada operación verifica identidad y permisos dentro de una transacción.
 */
import type { DocumentData, DocumentReference, Firestore, Transaction } from "firebase-admin/firestore";
import { generateTeamCode, normalizeTeamCode, parseTeamName, teamStatus, type TeamRole, type TeamStatus } from "../domain/teams.ts";
import { presentState } from "../domain/presentation.ts";
import { ValidationFailure } from "../domain/validation.ts";
import type { EnrollmentStatus } from "../domain/types.ts";
import type { Actor } from "./auth.ts";
import { loadChallenge, loadExperience, windowOf } from "./catalog.ts";
import { HttpError, notFound } from "./errors.ts";
import {
  ENROLLMENTS,
  PARTICIPATIONS,
  SUBMISSIONS,
  TEAMS,
  TEAM_CODES,
  TEAM_MEMBERSHIPS,
  USERS,
  enrollmentDocId,
  membershipDocId,
  teamParticipationDocId,
} from "./ids.ts";

export interface TeamMember {
  userId: string;
  displayName: string | null;
  role: TeamRole;
}

export interface TeamView {
  id: string;
  challengeId: string;
  experienceId: string;
  name: string;
  code: string;
  status: TeamStatus;
  minSize: number;
  maxSize: number;
  myRole: TeamRole;
  canManage: boolean;
  members: TeamMember[];
}

export interface MyTeamState {
  enrollmentStatus: EnrollmentStatus | null;
  enrollmentMode: "individual" | "team" | null;
  canManage: boolean;
  team: TeamView | null;
}

/** Ventana de cambios: solo mientras la inscripción está abierta. */
function openForChanges(experienceWindow: ReturnType<typeof windowOf>, challengeStatus: string, now: Date): boolean {
  return challengeStatus === "published" && presentState("published", experienceWindow, now).label === "Abierto";
}

async function requireChallengeContext(db: Firestore, challengeId: string, now: Date) {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const experience = await loadExperience(db, challenge.experienceId);
  if (experience.status !== "published") throw notFound();
  return { challenge, experience, canManage: openForChanges(windowOf(experience), challenge.status, now) };
}

async function membersOf(db: Firestore, memberIds: string[], roles: Record<string, TeamRole>): Promise<TeamMember[]> {
  const profiles = await Promise.all(memberIds.map((userId) => db.collection(USERS).doc(userId).get()));
  return memberIds.map((userId, index) => ({
    userId,
    displayName: (profiles[index].data()?.displayName as string | undefined) ?? null,
    role: roles[userId] ?? "integrante",
  }));
}

function roleMap(team: DocumentData): Record<string, TeamRole> {
  return { [team.leaderUserId]: "lider" };
}

async function toTeamView(db: Firestore, teamId: string, data: DocumentData, actorUid: string, canManage: boolean): Promise<TeamView> {
  const members = await membersOf(db, data.memberIds, roleMap(data));
  return {
    id: teamId,
    challengeId: data.challengeId,
    experienceId: data.experienceId,
    name: data.name,
    code: data.code,
    status: data.status,
    minSize: data.minSize,
    maxSize: data.maxSize,
    myRole: data.leaderUserId === actorUid ? "lider" : "integrante",
    canManage,
    members,
  };
}

async function requireApprovedTeamEnrollment(db: Firestore, actor: Actor, experienceId: string): Promise<void> {
  const enrollment = await db.collection(ENROLLMENTS).doc(enrollmentDocId(experienceId, actor.uid)).get();
  const data = enrollment.data();
  if (!data || data.status !== "approved" || data.mode !== "team") {
    throw new HttpError(403, "sin_inscripcion_equipo", "Necesitás una inscripción por equipo aprobada por C3 para crear o unirte a un equipo.");
  }
}

function participationPatch(status: "active" | "incomplete", teamId: string, challengeId: string, experienceId: string, stamp: string) {
  return {
    challengeId,
    experienceId,
    mode: "team",
    teamId,
    status,
    updatedAt: stamp,
  };
}

/** Crea el equipo con su código, la membresía de la persona y la participación (incompleta hasta el mínimo). */
export async function createTeam(db: Firestore, actor: Actor, challengeId: string, rawName: unknown, now: Date): Promise<TeamView> {
  const name = parseTeamName(rawName);
  const { challenge, experience, canManage } = await requireChallengeContext(db, challengeId, now);
  if (!challenge.allows.includes("team")) {
    throw new HttpError(409, "sin_equipos", "Este reto no acepta equipos.");
  }
  if (!canManage) throw new HttpError(409, "inscripcion_cerrada", "Las inscripciones cerraron: ya no se pueden crear equipos.");
  await requireApprovedTeamEnrollment(db, actor, experience.id);

  const teamRef = db.collection(TEAMS).doc();
  const membershipRef = db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(experience.id, actor.uid));
  const stamp = now.toISOString();
  const minSize = challenge.teamMinSize ?? 2;
  const maxSize = challenge.teamMaxSize ?? 4;
  let code = "";

  await db.runTransaction(async (transaction: Transaction) => {
    if ((await transaction.get(membershipRef)).exists) {
      throw new HttpError(409, "ya_en_equipo", "Ya estás en un equipo de esta experiencia.");
    }
    for (let attempt = 0; attempt < 5 && !code; attempt += 1) {
      const candidate = generateTeamCode();
      const existing = await transaction.get(db.collection(TEAM_CODES).doc(candidate));
      if (!existing.exists) code = candidate;
    }
    if (!code) throw new HttpError(500, "codigo_no_disponible", "No pudimos generar un código de equipo. Intentá de nuevo.");

    const data = {
      challengeId,
      experienceId: experience.id,
      name,
      code,
      leaderUserId: actor.uid,
      memberIds: [actor.uid],
      status: teamStatus(1, minSize) as TeamStatus,
      minSize,
      maxSize,
      createdAt: stamp,
      updatedAt: stamp,
    };
    transaction.set(teamRef, data);
    transaction.set(db.collection(TEAM_CODES).doc(code), { teamId: teamRef.id, challengeId });
    transaction.set(membershipRef, { teamId: teamRef.id, challengeId, experienceId: experience.id, userId: actor.uid, role: "lider", createdAt: stamp });
    transaction.set(db.collection(PARTICIPATIONS).doc(teamParticipationDocId(challengeId, teamRef.id)), participationPatch("incomplete", teamRef.id, challengeId, experience.id, stamp), { merge: true });
  });

  return getTeamView(db, teamRef.id, actor, now);
}

/** Estado de equipo de la persona en un reto: inscripción, modo y, si existe, su equipo. */
export async function getMyTeamState(db: Firestore, actor: Actor, challengeId: string, now: Date): Promise<MyTeamState> {
  const { challenge, experience, canManage } = await requireChallengeContext(db, challengeId, now);
  const enrollment = (await db.collection(ENROLLMENTS).doc(enrollmentDocId(experience.id, actor.uid)).get()).data();
  const membership = (await db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(experience.id, actor.uid)).get()).data();
  let team: TeamView | null = null;
  if (membership) {
    team = await getTeamView(db, membership.teamId, actor, now).catch(() => null);
  }
  return {
    enrollmentStatus: (enrollment?.status as EnrollmentStatus | undefined) ?? null,
    enrollmentMode: (enrollment?.mode as "individual" | "team" | undefined) ?? null,
    canManage: canManage && challenge.allows.includes("team"),
    team,
  };
}

async function getTeamView(db: Firestore, teamId: string, actor: Actor, now: Date): Promise<TeamView> {
  const snapshot = await db.collection(TEAMS).doc(teamId).get();
  if (!snapshot.exists) throw notFound("El equipo ya no existe.");
  const data = snapshot.data() as DocumentData;
  const { experience, canManage } = await requireChallengeContext(db, data.challengeId, now);
  if (data.experienceId !== experience.id) throw notFound();
  const isMember = Array.isArray(data.memberIds) && data.memberIds.includes(actor.uid);
  if (!isMember) throw new HttpError(403, "no_integrante", "Solo las integrantes del equipo pueden ver sus datos.");
  return toTeamView(db, teamId, data, actor.uid, canManage);
}

/** Unirse con código C3-XXXX. Requiere inscripción por equipo aprobada y cupo disponible. */
export async function joinTeamByCode(db: Firestore, actor: Actor, rawCode: unknown, now: Date): Promise<TeamView> {
  const code = normalizeTeamCode(rawCode);
  if (!code) throw new ValidationFailure([{ field: "code", message: "El código tiene el formato C3-XXXX." }]);
  const codeSnapshot = await db.collection(TEAM_CODES).doc(code).get();
  if (!codeSnapshot.exists) throw notFound("No encontramos un equipo con ese código.");
  const teamId = codeSnapshot.data()?.teamId as string;
  const teamSnapshot = await db.collection(TEAMS).doc(teamId).get();
  if (!teamSnapshot.exists) throw notFound("El equipo ya no existe.");
  const team = teamSnapshot.data() as DocumentData;
  const { experience, canManage } = await requireChallengeContext(db, team.challengeId, now);
  if (!canManage) throw new HttpError(409, "inscripcion_cerrada", "Las inscripciones cerraron: ya no podés unirte a un equipo.");
  await requireApprovedTeamEnrollment(db, actor, experience.id);

  const teamRef = db.collection(TEAMS).doc(teamId);
  const membershipRef = db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(experience.id, actor.uid));
  const stamp = now.toISOString();
  await db.runTransaction(async (transaction) => {
    const current = (await transaction.get(teamRef)).data() as DocumentData | undefined;
    if (!current) throw notFound("El equipo ya no existe.");
    if ((await transaction.get(membershipRef)).exists) {
      throw new HttpError(409, "ya_en_equipo", "Ya estás en un equipo de esta experiencia.");
    }
    const memberIds: string[] = current.memberIds ?? [];
    if (memberIds.length >= current.maxSize) {
      throw new HttpError(409, "equipo_completo", "El equipo ya está completo.");
    }
    const nextMembers = [...memberIds, actor.uid];
    const status = teamStatus(nextMembers.length, current.minSize);
    transaction.update(teamRef, { memberIds: nextMembers, status, updatedAt: stamp });
    transaction.set(membershipRef, { teamId, challengeId: current.challengeId, experienceId: experience.id, userId: actor.uid, role: "integrante", createdAt: stamp });
    transaction.set(db.collection(PARTICIPATIONS).doc(teamParticipationDocId(current.challengeId, teamId)), participationPatch(status === "habilitado" ? "active" : "incomplete", teamId, current.challengeId, experience.id, stamp), { merge: true });
  });
  return getTeamView(db, teamId, actor, now);
}

export type TeamAction = "salir" | "quitar" | "transferir" | "disolver";

/** Acciones sobre un equipo: salir, quitar integrante, transferir liderazgo o disolver. */
export async function manageTeam(db: Firestore, actor: Actor, teamId: string, action: TeamAction, targetUserId: unknown, now: Date): Promise<void> {
  const teamRef = db.collection(TEAMS).doc(teamId);
  const snapshot = await teamRef.get();
  if (!snapshot.exists) throw notFound("El equipo ya no existe.");
  const team = snapshot.data() as DocumentData;
  const { experience, canManage } = await requireChallengeContext(db, team.challengeId, now);
  const memberIds: string[] = team.memberIds ?? [];
  const isLeader = team.leaderUserId === actor.uid;
  if (!memberIds.includes(actor.uid)) throw new HttpError(403, "no_integrante", "Solo las integrantes del equipo pueden cambiarlo.");
  if (!canManage) throw new HttpError(409, "inscripcion_cerrada", "Las inscripciones cerraron: el equipo ya no se puede cambiar.");

  const submission = await db.collection(SUBMISSIONS).doc(teamParticipationDocId(team.challengeId, teamId)).get();
  if (submission.data()?.status === "submitted") {
    throw new HttpError(409, "entrega_enviada", "El equipo ya envió la entrega: no se puede cambiar.");
  }

  const target = typeof targetUserId === "string" ? targetUserId : "";
  const stamp = now.toISOString();
  const membershipOf = (userId: string) => db.collection(TEAM_MEMBERSHIPS).doc(membershipDocId(experience.id, userId));
  const participationRef = db.collection(PARTICIPATIONS).doc(teamParticipationDocId(team.challengeId, teamId));

  if (action === "salir") {
    if (isLeader) throw new HttpError(409, "lider_no_puede_salir", "Transferí el liderazgo o disolvé el equipo antes de salir.");
    await removeMembers(db, teamRef, membershipOf, participationRef, [actor.uid], stamp);
    return;
  }

  if (action === "quitar") {
    if (!isLeader) throw new HttpError(403, "solo_lider", "Solo la líder del equipo puede quitar integrantes.");
    if (!target || target === actor.uid || !memberIds.includes(target)) {
      throw new ValidationFailure([{ field: "userId", message: "Elegí una integrante del equipo distinta de vos." }]);
    }
    await removeMembers(db, teamRef, membershipOf, participationRef, [target], stamp);
    return;
  }

  if (action === "transferir") {
    if (!isLeader) throw new HttpError(403, "solo_lider", "Solo la líder del equipo puede transferir el liderazgo.");
    if (!target || target === actor.uid || !memberIds.includes(target)) {
      throw new ValidationFailure([{ field: "userId", message: "Elegí una integrante del equipo para transferirle el liderazgo." }]);
    }
    await db.runTransaction(async (transaction) => {
      transaction.update(teamRef, { leaderUserId: target, updatedAt: stamp });
      transaction.update(membershipOf(actor.uid), { role: "integrante" });
      transaction.update(membershipOf(target), { role: "lider" });
    });
    return;
  }

  // disolver: solo si queda la líder sola.
  if (!isLeader) throw new HttpError(403, "solo_lider", "Solo la líder del equipo puede disolverlo.");
  if (memberIds.length > 1) {
    throw new HttpError(409, "equipo_con_integrantes", "Quitá a las demás integrantes o transferí el liderazgo antes de disolver el equipo.");
  }
  await db.runTransaction(async (transaction) => {
    transaction.delete(teamRef);
    transaction.delete(db.collection(TEAM_CODES).doc(team.code));
    transaction.delete(membershipOf(actor.uid));
    transaction.delete(participationRef);
  });
}

async function removeMembers(
  db: Firestore,
  teamRef: DocumentReference,
  membershipOf: (userId: string) => DocumentReference,
  participationRef: DocumentReference,
  userIds: string[],
  stamp: string,
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const current = (await transaction.get(teamRef)).data() as DocumentData | undefined;
    if (!current) throw notFound("El equipo ya no existe.");
    const remaining = (current.memberIds as string[]).filter((userId) => !userIds.includes(userId));
    const status = teamStatus(remaining.length, current.minSize);
    transaction.update(teamRef, { memberIds: remaining, status, updatedAt: stamp });
    for (const userId of userIds) transaction.delete(membershipOf(userId));
    transaction.set(participationRef, { status: status === "habilitado" ? "active" : "incomplete", updatedAt: stamp }, { merge: true });
  });
}
