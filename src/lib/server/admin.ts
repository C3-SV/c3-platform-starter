import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { requireAdmin, type Actor } from "./auth.ts";
import { EVALUATIONS } from "./evaluation.ts";
import { ENROLLMENTS, SUBMISSIONS, TEAMS, USERS, enrollmentDocId } from "./ids.ts";
import { PROPOSALS } from "./proposals.ts";

export interface AdminDashboard {
  experiences: number;
  proposals: number;
  pendingEnrollments: number;
  submissions: number;
  evaluations: number;
}

export interface AdminDeliveryRow {
  id: string;
  challengeId: string;
  challengeTitle: string;
  experienceTitle: string;
  status: "draft" | "submitted";
  mode: "individual" | "team";
  teamId: string | null;
  teamName: string | null;
  participantIds: string[];
  participantNames: string[];
  authorized: boolean;
  textPreview: string;
  links: string[];
  updatedAt: string;
  submittedAt: string | null;
}

export async function getAdminDashboard(db: Firestore, actor: Actor): Promise<AdminDashboard> {
  requireAdmin(actor);
  const [experiences, proposals, enrollments, submissions, evaluations] = await Promise.all([
    db.collection("experiences").get(),
    db.collection(PROPOSALS).get(),
    db.collection(ENROLLMENTS).get(),
    db.collection(SUBMISSIONS).get(),
    db.collection(EVALUATIONS).get(),
  ]);
  return {
    experiences: experiences.size,
    proposals: proposals.size,
    pendingEnrollments: enrollments.docs.filter((doc) => doc.data().status === "pending").length,
    submissions: submissions.size,
    evaluations: evaluations.size,
  };
}

function teamIdOf(submissionId: string, data: DocumentData): string | null {
  if (data.mode !== "team") return null;
  const explicit = typeof data.teamId === "string" ? data.teamId : null;
  return explicit ?? submissionId.split("__team__")[1] ?? null;
}

export async function listAdminDeliveries(db: Firestore, actor: Actor): Promise<AdminDeliveryRow[]> {
  requireAdmin(actor);
  const [submissions, challenges, experiences, users, teams] = await Promise.all([
    db.collection(SUBMISSIONS).get(),
    db.collection("challenges").get(),
    db.collection("experiences").get(),
    db.collection(USERS).get(),
    db.collection(TEAMS).get(),
  ]);
  const challengeById = new Map(challenges.docs.map((doc) => [doc.id, doc.data()]));
  const experienceById = new Map(experiences.docs.map((doc) => [doc.id, doc.data()]));
  const userById = new Map(users.docs.map((doc) => [doc.id, doc.data()]));
  const teamById = new Map(teams.docs.map((doc) => [doc.id, doc.data()]));

  const rows = await Promise.all(submissions.docs.map(async (doc) => {
    const data = doc.data();
    const challenge = challengeById.get(data.challengeId) ?? {};
    const experience = experienceById.get(challenge.experienceId) ?? {};
    const mode = data.mode === "team" ? "team" : "individual";
    const teamId = teamIdOf(doc.id, data);
    const team = teamId ? teamById.get(teamId) : null;
    const participantIds = mode === "team"
      ? ((team?.memberIds as string[] | undefined) ?? (data.userId ? [data.userId] : []))
      : (data.userId ? [data.userId] : []);
    const participantNames = participantIds.map((id) => {
      const profile = userById.get(id);
      return (profile?.displayName as string | undefined) ?? (profile?.email as string | undefined) ?? id;
    });
    const authorized = mode === "team"
      ? team?.status === "habilitado"
      : Boolean(data.userId && (await db.collection(ENROLLMENTS).doc(enrollmentDocId(challenge.experienceId, data.userId)).get()).data()?.status === "approved");
    return {
      id: doc.id,
      challengeId: data.challengeId,
      challengeTitle: (challenge.title as string | undefined) ?? "Reto eliminado",
      experienceTitle: (experience.title as string | undefined) ?? "Experiencia eliminada",
      status: data.status === "submitted" ? "submitted" : "draft",
      mode,
      teamId,
      teamName: (team?.name as string | undefined) ?? null,
      participantIds,
      participantNames,
      authorized,
      textPreview: typeof data.text === "string" ? data.text.slice(0, 180) : "",
      links: Array.isArray(data.links) ? data.links.filter((link: unknown): link is string => typeof link === "string") : [],
      updatedAt: (data.updatedAt as string | undefined) ?? "",
      submittedAt: (data.submittedAt as string | undefined) ?? null,
    } satisfies AdminDeliveryRow;
  }));
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}
