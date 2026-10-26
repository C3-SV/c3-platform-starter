/**
 * Nombres de colecciones e identificadores deterministas compartidos por el servidor.
 * Viven aquí para que los servicios no dependan unos de otros (sin ciclos de importación).
 */
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
