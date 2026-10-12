/** Entidades conceptuales para el primer corte. No es aún un esquema físico de Firestore. */
export type ExperienceStatus = "draft" | "published" | "closed" | "cancelled";
export type EnrollmentStatus = "pending" | "approved" | "rejected" | "cancelled";
export type SubmissionStatus = "draft" | "submitted";
export type ParticipationMode = "individual" | "team";
export type EvaluationStatus = "draft" | "finalized" | "invalidated";

export interface Experience {
  id: string;
  title: string;
  status: ExperienceStatus;
  challengeIds: string[]; // 0, 1 o varios retos.
  registrationOpenAt?: string;
  registrationClosesAt?: string;
}
export interface Challenge {
  id: string;
  experienceId: string;
  title: string;
  status: ExperienceStatus;
  submissionClosesAt: string;
  responsibleOrganizationIds: string[]; // 1 o varias, ninguna principal obligatoria.
  allows: ParticipationMode[];
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
