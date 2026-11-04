/**
 * Nombres de colecciones e identificadores deterministas compartidos por el servidor.
 * Viven aquí para que los servicios no dependan unos de otros (sin ciclos de importación).
 */
import { createHash } from "node:crypto";

export const USERS = "users";
/** Direcciones públicas de perfil (publicProfiles/{slug} → persona). Solo la escribe el servidor. */
export const PUBLIC_PROFILES = "publicProfiles";
export const ENROLLMENTS = "enrollments";
export const PARTICIPATIONS = "participations";
export const SUBMISSIONS = "submissions";
export const TEAMS = "teams";
export const TEAM_CODES = "teamCodes";
export const TEAM_MEMBERSHIPS = "teamMemberships";
/** Bitácora de operaciones administrativas sensibles. Solo la escribe el servidor; Firestore deniega todo acceso directo. */
export const AUDIT_LOG = "auditLog";
/** Resultados oficiales por challenge (results/{challengeId}); publicados cuando tienen publishedAt. */
export const RESULTS = "results";

/** Una inscripción por persona y experiencia. */
export function enrollmentDocId(experienceId: string, userId: string): string {
  return `${experienceId}__${userId}`;
}

/** Participación individual: una por persona y challenge. */
export function participationDocId(challengeId: string, userId: string): string {
  return `${challengeId}__${userId}`;
}

/** Participación de equipo y su entrega vigente: una por equipo y challenge. */
export function teamParticipationDocId(challengeId: string, teamId: string): string {
  return `${challengeId}__team__${teamId}`;
}

/** Membresía de equipo: como máximo un equipo por persona y experiencia. */
export function membershipDocId(experienceId: string, userId: string): string {
  return `${experienceId}__${userId}`;
}

/** Lista corta: una entrada por entrega enviada (el id de la entrega es el de la entrada). */
export const SHORTLISTS = "shortlists";
/** Solicitudes de contacto con consentimiento: una por persona y challenge. */
export const CONTACT_REQUESTS = "contactRequests";
/** Defensa de una entrega enviada: un documento por entrega (id = submissionId). */
export const DEFENSES = "defenses";
/** Bitácora de la persona: checkpoints con texto y enlace opcional, en orden de creación. */
export const CHECKPOINTS = "checkpoints";
/** Retroalimentación de la empresa por entrega (id = submissionId). Solo la ve la persona cuando está publicada. */
export const FEEDBACKS = "feedbacks";

/**
 * Solicitud de contacto: como máximo una por persona y challenge; la empresa solo puede tener una activa.
 * El uid no aparece en el id: el id viaja a la empresa en el tablero y en las respuestas de la API.
 */
export function contactRequestDocId(challengeId: string, userId: string): string {
  return `${challengeId}__${createHash("sha256").update(`${challengeId}:${userId}`).digest("hex").slice(0, 32)}`;
}

/**
 * Identificador opaco de una fila del tablero de talento. El id interno de una entrega individual lleva el uid
 * de quien entregó, así que a la empresa solo le llega este token.
 */
export function talentRowTokenOf(submissionId: string): string {
  return createHash("sha256").update(`fila:${submissionId}`).digest("hex").slice(0, 32);
}
