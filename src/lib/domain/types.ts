/**
 * Entidades del dominio. Los campos de Experience y Challenge ya siguen el esquema que usa
 * Firestore en el Corte 1; el resto (inscripciones, equipos, entregas, evaluaciones,
 * propuestas) sigue siendo conceptual y se ajustará al implementar cada corte.
 */
export type ExperienceStatus = "draft" | "published" | "closed" | "cancelled";
export type ExperienceKind = "competencia" | "hackathon" | "challenge_empresarial";
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
