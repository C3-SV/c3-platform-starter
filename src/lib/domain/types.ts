/*
 * Domain entities. Experience and Challenge already follow the Firestore schema from Corte 1; the rest
 * (enrollments, teams, deliveries, evaluations, proposals) is still conceptual and gets adjusted per cut.
 */
import type { CommercialPackageId } from "./commercial.ts";
import type { ContactActor, ContactStatus } from "./contact.ts";
import type { CoverImageFields } from "./coverImage.ts";

export type ExperienceStatus = "draft" | "published" | "closed" | "cancelled";
export type ExperienceKind = "competencia" | "hackathon" | "challenge_empresarial" | "taller" | "charla" | "encuentro";
export type ExperienceLine = "compite" | "crea" | "conecta";
export type ExperienceModality = "presencial" | "virtual" | "hibrida";
export type EnrollmentStatus = "pending" | "approved" | "rejected" | "cancelled";
export type SubmissionStatus = "draft" | "submitted";
export type ParticipationMode = "individual" | "team";
export type EvaluationStatus = "draft" | "finalized" | "invalidated";

export interface Experience extends CoverImageFields {
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
  /** Session date and time (workshops, talks, meetups). Older experiences don't have it. */
  startsAt?: string | null;
  endsAt?: string | null;
  modality?: ExperienceModality | null;
  /** Session venue or link; it's public information. */
  location?: string | null;
  /** Total spots of the experience; null or missing means no limit. */
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
  /** Weight in percent when the rubric is weighted: every criterion has one and they add up to 100. */
  weight?: number;
}

export interface Challenge extends CoverImageFields {
  id: string;
  experienceId: string;
  title: string;
  summary: string;
  problem: string;
  deliverables: string[];
  rubric: RubricCriterion[];
  organizationName: string;
  /** Reference package of a company challenge (Esencial, Completo or Destacado). Null for the rest. */
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
  /** Challenge the person enrolled through; null when they enrolled in the experience itself (no challenge). */
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
 * Submitted delivery the company marked for a closer look. One entry per delivery (id = submissionId).
 * userId only exists on individual deliveries: contacting team members is still pending a decision.
 */
export interface ShortlistEntry {
  id: string;
  organizationId: string;
  challengeId: string;
  submissionId: string;
  userId: string | null;
  /** Required qualitative reason: why the delivery stands out. */
  reason: string;
  addedByUserId: string;
  createdAt: string;
}
/** Contact request with consent. Never shows the person's email to the company before it's accepted. */
export interface ContactRequest {
  id: string;
  organizationId: string;
  challengeId: string;
  userId: string;
  status: ContactStatus;
  message: string | null;
  requestedByUserId: string;
  /** Last actor that changed the status: the company or the person. */
  lastChangedBy: ContactActor;
  createdAt: string;
  updatedAt: string;
}
