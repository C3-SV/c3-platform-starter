/**
 * Perfil público compartible (opt-in). La persona decide si existe y qué muestra; el servidor lo arma con
 * `buildPublicView` (dominio) y solo con datos que ya son públicos por sí mismos: inscripciones APROBADAS en
 * experiencias y challenges publicados o concluidos, y reconocimientos publicados por C3 con autorización para mostrar
 * ganadores. Nunca expone correo, uid, borradores, entregas, promedios ni inscripciones sin aprobar.
 *
 * La dirección pública (`publicProfiles/{slug}`) apunta a la persona; rotarla invalida la anterior. Firestore sigue
 * denegando todo acceso directo: esta lectura pública pasa por el servidor.
 */
import { randomInt } from "node:crypto";
import type { DocumentData, Firestore, Transaction } from "firebase-admin/firestore";
import { RECOGNITION_LABEL, type Recognition } from "../domain/evaluation.ts";
import { primaryLineOf } from "../domain/presentation.ts";
import {
  buildPublicView,
  generateSlug,
  isValidSlug,
  parsePublicProfileInput,
  publicProfilePath,
  settingsFromStored,
  type PublicParticipation,
  type PublicProfileSettings,
  type PublicProfileView,
  type PublicRecognition,
} from "../domain/public-profile.ts";
import { ValidationFailure } from "../domain/validation.ts";
import type { Actor } from "./auth.ts";
import { CHALLENGES, EXPERIENCES } from "./catalog.ts";
import { HttpError } from "./errors.ts";
import { ENROLLMENTS, PUBLIC_PROFILES, RESULTS, SUBMISSIONS, TEAMS, USERS } from "./ids.ts";
import { ensureProfile } from "./profile.ts";

const PUBLIC_STATUSES = ["published", "closed"];
const SLUG_ATTEMPTS = 6;

/** Lo que la persona ve de su propio perfil público en Cuenta y Trayectoria. */
export interface MyPublicProfile extends PublicProfileSettings {
  /** Ruta pública (`/personas/[slug]`); null mientras nunca se activó. */
  path: string | null;
}

function withPath(settings: PublicProfileSettings): MyPublicProfile {
  return { ...settings, path: settings.slug ? publicProfilePath(settings.slug) : null };
}

export async function getMyPublicProfile(db: Firestore, actor: Actor): Promise<MyPublicProfile> {
  const snapshot = await db.collection(USERS).doc(actor.uid).get();
  return withPath(settingsFromStored(snapshot.data()?.publicProfile));
}

/** Reserva una dirección libre dentro de la transacción. Las lecturas van antes de las escrituras. */
async function reserveSlug(db: Firestore, transaction: Transaction, name: string, uid: string, now: Date): Promise<string> {
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
    const candidate = generateSlug(name, (max) => randomInt(max));
    const ref = db.collection(PUBLIC_PROFILES).doc(candidate);
    if (!(await transaction.get(ref)).exists) {
      transaction.create(ref, { userId: uid, createdAt: now.toISOString() });
      return candidate;
    }
  }
  throw new HttpError(503, "sin_direccion", "No pudimos generar la dirección de tu perfil. Intentá de nuevo.");
}

function displayNameOf(data: DocumentData | undefined): string {
  return typeof data?.displayName === "string" ? data.displayName.trim() : "";
}

/** Activa, desactiva o ajusta qué se comparte. Solo la propia persona (el uid sale del token verificado). */
export async function savePublicProfile(db: Firestore, actor: Actor, rawInput: unknown, now: Date): Promise<MyPublicProfile> {
  const input = parsePublicProfileInput(rawInput);
  await ensureProfile(db, actor, now);
  const userRef = db.collection(USERS).doc(actor.uid);
  const saved = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data();
    const name = displayNameOf(data);
    if (input.enabled && name.length < 3) {
      throw new ValidationFailure([{ field: "enabled", message: "Completá tu nombre en Cuenta antes de activar tu perfil público." }]);
    }
    const current = settingsFromStored(data?.publicProfile);
    const slug = current.slug ?? (input.enabled ? await reserveSlug(db, transaction, name, actor.uid, now) : null);
    const next = { enabled: input.enabled, slug, show: input.show, updatedAt: now.toISOString() };
    transaction.update(userRef, { publicProfile: next, updatedAt: now.toISOString() });
    return settingsFromStored(next);
  });
  return withPath(saved);
}

/** Cambia la dirección pública: la anterior deja de funcionar. Útil si el enlace se compartió donde no debía. */
export async function rotatePublicProfileLink(db: Firestore, actor: Actor, now: Date): Promise<MyPublicProfile> {
  await ensureProfile(db, actor, now);
  const userRef = db.collection(USERS).doc(actor.uid);
  const saved = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const data = snapshot.data();
    const name = displayNameOf(data);
    const stored = (data?.publicProfile ?? {}) as Record<string, unknown>;
    const current = settingsFromStored(stored);
    const slug = await reserveSlug(db, transaction, name || "persona", actor.uid, now);
    if (current.slug) transaction.delete(db.collection(PUBLIC_PROFILES).doc(current.slug));
    const next = { enabled: current.enabled, slug, show: current.show, updatedAt: now.toISOString() };
    transaction.update(userRef, { publicProfile: next, updatedAt: now.toISOString() });
    return settingsFromStored(next);
  });
  return withPath(saved);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Participaciones y reconocimientos que ya son públicos por sí mismos. Solo se llama si la persona comparte su trayectoria. */
async function publicTrajectory(db: Firestore, uid: string): Promise<{ participations: PublicParticipation[]; recognitions: PublicRecognition[] }> {
  const approved = await db.collection(ENROLLMENTS).where("userId", "==", uid).where("status", "==", "approved").get();
  const teams = await db.collection(TEAMS).where("memberIds", "array-contains", uid).get();

  const participations: PublicParticipation[] = [];
  const recognitions: PublicRecognition[] = [];
  for (const doc of approved.docs) {
    const enrollment = doc.data();
    const experienceSnap = await db.collection(EXPERIENCES).doc(String(enrollment.experienceId)).get();
    const experience = experienceSnap.data();
    if (!experience || !PUBLIC_STATUSES.includes(experience.status)) continue;

    let challengeId: string | null = null;
    let challengeTitle: string | null = null;
    if (typeof enrollment.challengeId === "string" && enrollment.challengeId) {
      const challengeSnap = await db.collection(CHALLENGES).doc(enrollment.challengeId).get();
      const challenge = challengeSnap.data();
      if (!challenge || !PUBLIC_STATUSES.includes(challenge.status)) continue;
      challengeId = challengeSnap.id;
      challengeTitle = text(challenge.title);
    }

    participations.push({
      experienceId: experienceSnap.id,
      experienceTitle: text(experience.title),
      challengeId,
      challengeTitle,
      line: primaryLineOf({ kind: experience.kind, primaryLine: experience.primaryLine }),
      concluded: experience.status === "closed",
    });

    if (!challengeId) continue;
    // Reconocimiento: solo si C3 publicó el resultado y autorizó mostrar ganadores (la misma regla de la página del challenge).
    const results = (await db.collection(RESULTS).doc(challengeId).get()).data();
    if (!results || results.status !== "published" || results.showWinners === false) continue;
    const marks = (results.recognitions ?? {}) as Record<string, Recognition | null>;
    const candidates = [
      `${challengeId}__${uid}`,
      ...teams.docs.filter((team) => team.data().experienceId === enrollment.experienceId).map((team) => `${challengeId}__team__${team.id}`),
    ];
    for (const submissionId of candidates) {
      const recognition = marks[submissionId];
      if (!recognition) continue;
      const submission = await db.collection(SUBMISSIONS).doc(submissionId).get();
      if (!submission.exists || submission.data()?.status !== "submitted") continue;
      recognitions.push({ challengeId, challengeTitle: challengeTitle ?? "", recognition: RECOGNITION_LABEL[recognition] });
    }
  }

  const byTitle = (a: { experienceTitle?: string; challengeTitle?: string | null }, b: { experienceTitle?: string; challengeTitle?: string | null }) =>
    `${a.experienceTitle ?? ""} ${a.challengeTitle ?? ""}`.localeCompare(`${b.experienceTitle ?? ""} ${b.challengeTitle ?? ""}`);
  participations.sort(byTitle);
  return { participations, recognitions };
}

/**
 * Perfil público por dirección. Devuelve null —igual que si no existiera— cuando la dirección no es válida, no
 * existe, fue rotada o la persona lo desactivó: así nadie puede saber si una persona tiene o tuvo un perfil.
 */
export async function getPublicProfileBySlug(db: Firestore, slug: string): Promise<PublicProfileView | null> {
  if (!isValidSlug(slug)) return null;
  const mapping = (await db.collection(PUBLIC_PROFILES).doc(slug).get()).data();
  const uid = mapping?.userId;
  if (typeof uid !== "string" || !uid) return null;
  const data = (await db.collection(USERS).doc(uid).get()).data();
  if (!data) return null;
  const settings = settingsFromStored(data.publicProfile);
  const name = displayNameOf(data);
  if (!settings.enabled || settings.slug !== slug || name.length < 3) return null;
  const trajectory = settings.show.trajectory ? await publicTrajectory(db, uid) : { participations: [], recognitions: [] };
  return buildPublicView({
    slug,
    displayName: name,
    school: text(data.school),
    bio: text(data.bio),
    github: text(data.github),
    linkedin: text(data.linkedin),
    show: settings.show,
    ...trajectory,
  });
}

/** Dirección pública de una persona si la activó; sirve para enlazar su nombre desde otras páginas (p. ej. ganadores). */
export async function publicSlugOf(db: Firestore, uid: string): Promise<string | null> {
  const data = (await db.collection(USERS).doc(uid).get()).data();
  const settings = settingsFromStored(data?.publicProfile);
  return settings.enabled && displayNameOf(data).length >= 3 ? settings.slug : null;
}
