/** Validaciones PURAS para UX/pruebas. NO sustituyen autorización backend. */
import type { EnrollmentStatus, ExperienceStatus, SubmissionStatus } from "./types.ts";

export function canSubmit(args: {
  challengeStatus: ExperienceStatus;
  enrollmentStatus: EnrollmentStatus;
  submissionClosesAt: string;
  now: string;
}): boolean {
  const limit = Date.parse(args.submissionClosesAt);
  const now = Date.parse(args.now);
  return args.challengeStatus === "published"
    && args.enrollmentStatus === "approved"
    && Number.isFinite(now) && Number.isFinite(limit) && now < limit;
}

/** Un jurado asignado evalúa una entrega enviada de un challenge publicado, sin esperar al cierre de entregas (igual que el servidor). */
export function canEvaluate(args: {
  challengeStatus: ExperienceStatus;
  submissionStatus: SubmissionStatus;
  assignedJudge: boolean;
}): boolean {
  return args.challengeStatus === "published"
    && args.submissionStatus === "submitted"
    && args.assignedJudge;
}

export function canSeeResult(args: {
  publishedAt?: string;
  visibility: "private" | "authorized" | "public";
  isRecipient: boolean;
}): boolean {
  return !!args.publishedAt && (
    args.visibility === "public" || (args.visibility === "authorized" && args.isRecipient)
  );
}
