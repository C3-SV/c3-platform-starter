/**
 * Organizaciones, representantes y espacio de empresa (Corte 4).
 * Un representante ve solo los retos y las soluciones enviadas de sus organizaciones vinculadas.
 * La vinculación la hace C3 por correo: nunca la pide la propia persona.
 */
import type { Auth } from "firebase-admin/auth";
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { presentState, type PresentedState } from "../domain/presentation.ts";
import { ValidationFailure } from "../domain/validation.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { CHALLENGES, ORGANIZATIONS, loadExperience, windowOf } from "./catalog.ts";
import { notFound } from "./errors.ts";
import { PROPOSALS, toProposalView, type ProposalView } from "./proposals.ts";
import { companyResults } from "./evaluation.ts";
import { SUBMISSIONS, TEAMS, USERS } from "./ids.ts";

export const ORGANIZATION_MEMBERS = "organizationMembers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface OrganizationView {
  id: string;
  name: string;
  createdAt: string;
}

export interface CompanySubmission {
  id: string;
  submittedAt: string | null;
  name: string | null;
  mode: "individual" | "team";
  text: string;
  links: string[];
}

export interface CompanyChallenge {
  id: string;
  title: string;
  organizationId: string;
  state: PresentedState;
  submissions: CompanySubmission[];
  results: Awaited<ReturnType<typeof companyResults>>;
}

export interface CompanySpace {
  organizations: OrganizationView[];
  challenges: CompanyChallenge[];
  proposals: ProposalView[];
}

function toOrganization(id: string, data: DocumentData): OrganizationView {
  return { id, name: data.name, createdAt: data.createdAt };
}

export async function createOrganization(db: Firestore, actor: Actor, rawName: unknown, now: Date): Promise<OrganizationView> {
  requireAdmin(actor);
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (name.length < 2 || name.length > 120) {
    throw new ValidationFailure([{ field: "name", message: "El nombre de la organización tiene entre 2 y 120 caracteres." }]);
  }
  const ref = db.collection(ORGANIZATIONS).doc();
  const data = { name, createdAt: now.toISOString(), createdByUid: actor.uid };
  await ref.set(data);
  return toOrganization(ref.id, data);
}

export async function listOrganizations(db: Firestore, actor: Actor): Promise<OrganizationView[]> {
  requireAdmin(actor);
  const snapshot = await db.collection(ORGANIZATIONS).get();
  return snapshot.docs.map((doc) => toOrganization(doc.id, doc.data())).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Vincula una cuenta existente como representante de una organización. Solo C3, por correo.
 * La cuenta debe existir: C3 no crea cuentas empresariales ni acepta vinculaciones pedidas por la propia persona.
 */
export async function linkRepresentative(db: Firestore, auth: Auth, actor: Actor, organizationId: string, rawEmail: unknown, now: Date): Promise<void> {
  requireAdmin(actor);
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationFailure([{ field: "email", message: "Revisá el formato del correo." }]);
  }
  const organization = await db.collection(ORGANIZATIONS).doc(organizationId).get();
  if (!organization.exists) throw notFound("La organización no existe.");
  const user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) throw notFound("No encontramos una cuenta con ese correo. La persona debe registrarse primero.");

  await db.collection(ORGANIZATION_MEMBERS).doc(`${organizationId}__${user.uid}`).set({
    organizationId,
    userId: user.uid,
    email,
    role: "representante",
    createdAt: now.toISOString(),
    createdByUid: actor.uid,
  }, { merge: true });
}

async function myOrganizationIds(db: Firestore, uid: string): Promise<string[]> {
  const snapshot = await db.collection(ORGANIZATION_MEMBERS).where("userId", "==", uid).get();
  return snapshot.docs.map((doc) => doc.data().organizationId as string);
}

/** Espacio de empresa: organizaciones vinculadas, sus retos publicados, soluciones enviadas y propuestas. */
export async function getCompanySpace(db: Firestore, actor: Actor, now: Date): Promise<CompanySpace> {
  const ids = await myOrganizationIds(db, actor.uid);
  if (ids.length === 0) return { organizations: [], challenges: [], proposals: [] };

  const organizations = (await Promise.all(ids.map((id) => db.collection(ORGANIZATIONS).doc(id).get())))
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => toOrganization(snapshot.id, snapshot.data() as DocumentData));

  const challenges: CompanyChallenge[] = [];
  const proposals: ProposalView[] = [];
  for (const organization of organizations) {
    const challengeSnapshot = await db.collection(CHALLENGES).where("organizationId", "==", organization.id).get();
    for (const doc of challengeSnapshot.docs) {
      const data = doc.data();
      if (data.status === "draft") continue;
      const experience = await loadExperience(db, data.experienceId).catch(() => null);
      const state = presentState(data.status, experience ? windowOf(experience) : {}, now);
      const submissions = await submittedSolutions(db, doc.id);
      const results = await companyResults(db, doc.id);
      challenges.push({ id: doc.id, title: data.title, organizationId: organization.id, state, submissions, results });
    }
    const proposalSnapshot = await db.collection(PROPOSALS).where("organizationId", "==", organization.id).get();
    proposals.push(...proposalSnapshot.docs.map((doc) => toProposalView(doc.id, doc.data())));
  }

  return {
    organizations,
    challenges: challenges.sort((a, b) => a.title.localeCompare(b.title)),
    proposals: proposals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

/** Solo soluciones enviadas. Los borradores son privados de quien los escribe. */
async function submittedSolutions(db: Firestore, challengeId: string): Promise<CompanySubmission[]> {
  const snapshot = await db.collection(SUBMISSIONS).where("challengeId", "==", challengeId).where("status", "==", "submitted").get();
  return Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const isTeam = data.mode === "team";
    let name: string | null = null;
    if (isTeam) {
      const teamId = doc.id.split("__team__")[1];
      name = ((await db.collection(TEAMS).doc(teamId).get()).data()?.name as string | undefined) ?? null;
    } else {
      name = ((await db.collection(USERS).doc(data.userId).get()).data()?.displayName as string | undefined) ?? null;
    }
    return {
      id: doc.id,
      submittedAt: data.submittedAt ?? null,
      name,
      mode: isTeam ? "team" : "individual",
      text: data.text ?? "",
      links: data.links ?? [],
    };
  }));
}
