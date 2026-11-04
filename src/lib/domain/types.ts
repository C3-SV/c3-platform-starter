/**
 * Entidades del dominio. Los campos de Experience y Challenge ya siguen el esquema que usa
 * Firestore en el Corte 1; el resto (inscripciones, equipos, entregas, evaluaciones,
 * propuestas) sigue siendo conceptual y se ajustará al implementar cada corte.
 */
import type { CommercialPackageId } from "./commercial.ts";
import type { ContactActor, ContactStatus } from "./contact.ts";

export type ExperienceStatus = "draft" | "published" | "closed" | "cancelled";
export type ExperienceKind = "competencia" | "hackathon" | "challenge_empresarial" | "taller" | "charla" | "encuentro";
export type ExperienceLine = "compite" | "crea" | "conecta";
export type ExperienceModality = "presencial" | "virtual" | "hibrida";
export type EnrollmentStatus = "pending" | "approved" | "rejected" | "cancelled";
export type SubmissionStatus = "draft" | "submitted";
export type ParticipationMode = "individual" | "team";
export type EvaluationStatus = "draft" | "finalized" | "invalidated";

export interface Experience {
  id: string;
  title: string;
  kind: ExperienceKind;
  summary: string;
  status: ExperienceStatus;
  primaryLine?: ExperienceLine;
  secondaryLines?: ExperienceLine[];
  isDemo?: boolean;
  demoNote?: string | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  /** Fecha y horario de la sesión (talleres, charlas, encuentros). Las experiencias anteriores no lo tienen. */
  startsAt?: string | null;
  endsAt?: string | null;
  modality?: ExperienceModality | null;
  /** Sede o enlace de la sesión; es información pública. */
  location?: string | null;
  /** Cupos totales de la experiencia; null o ausente significa sin límite. */
  capacity?: number | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  maxScore: number;
}

export interface Challenge {
  id: string;
  experienceId: string;
  title: string;
  summary: string;
  problem: string;
  deliverables: string[];
  rubric: RubricCriterion[];
  organizationName: string;
  /** Paquete de referencia del challenge empresarial (Esencial, Completo o Destacado). Null en el resto. */
  commercialPackage?: CommercialPackageId | null;
  allows: ParticipationMode[];
  teamMinSize: number | null;
  teamMaxSize: number | null;
  status: ExperienceStatus;
  submissionClosesAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  experienceId: string;
  /** Challenge por el que entró la persona; null cuando se inscribió a la experiencia (sin challenge). */
  challengeId?: string | null;
  status: EnrollmentStatus;
}
export interface Team {
  id: string;
  experienceId: string;
  memberIds: string[];
  leaderUserId: string;
}
export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  mode: ParticipationMode;
  userId?: string;
  teamId?: string;
}
export interface Submission {
  id: string;
  participationId: string;
  challengeId: string;
  status: SubmissionStatus;
  text: string;
  links: string[];
  updatedByUserId: string;
  submittedAt?: string;
}
export interface Evaluation {
  id: string;
  challengeId: string;
  submissionId: string;
  judgeUserId: string;
  status: EvaluationStatus;
  scores: { criterionId: string; score: number }[];
}
export interface OfficialResult {
  challengeId: string;
  participationId: string;
  publishedAt?: string;
  visibility: "private" | "authorized" | "public";
}
export interface CompanyProposal {
  id: string;
  companyName: string;
  contactEmail: string;
  problem: string;
  status: "received" | "reviewing" | "accepted" | "not_prioritized";
}
/**
 * Entrega enviada que la empresa marcó para revisar más de cerca. Una entrada por entrega (id = submissionId).
 * userId solo existe en entregas individuales: el contacto con personas de un equipo queda pendiente de decisión.
 */
export interface ShortlistEntry {
  id: string;
  organizationId: string;
  challengeId: string;
  submissionId: string;
  userId: string | null;
  /** Motivo cualitativo obligatorio: por qué destaca la entrega. */
  reason: string;
  addedByUserId: string;
  createdAt: string;
}
/** Solicitud de contacto con consentimiento. Nunca expone el correo de la persona a la empresa antes de «aceptado». */
export interface ContactRequest {
  id: string;
  organizationId: string;
  challengeId: string;
  userId: string;
  status: ContactStatus;
  message: string | null;
  requestedByUserId: string;
  /** Último actor que cambió el estado: la empresa o la persona. */
  lastChangedBy: ContactActor;
  createdAt: string;
  updatedAt: string;
}
