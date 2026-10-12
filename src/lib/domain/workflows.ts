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

export function canEvaluate(args: {
  challengeStatus: ExperienceStatus;
  submissionStatus: SubmissionStatus;
  submissionClosesAt: string;
  now: string;
  assignedJudge: boolean;
}): boolean {
  const limit = Date.parse(args.submissionClosesAt);
  const now = Date.parse(args.now);
  return args.challengeStatus !== "cancelled"
    && args.challengeStatus !== "draft"
    && args.submissionStatus === "submitted"
    && args.assignedJudge
    && Number.isFinite(now) && Number.isFinite(limit) && now >= limit;
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
