import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { parseProfileDetails } from "../domain/profile.ts";
import { HttpError } from "./errors.ts";
import type { Actor } from "./auth.ts";

export const USERS = "users";

export interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
  school: string;
  bio: string;
  github: string;
  linkedin: string;
  isAdmin: boolean;
}

/** Crea el perfil la primera vez y devuelve el estado actual. La identidad viene solo del token verificado. */
export async function ensureProfile(db: Firestore, actor: Actor, now: Date): Promise<Profile> {
  const ref = db.collection(USERS).doc(actor.uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    await ref.set({ email: actor.email, displayName: null, createdAt: now.toISOString(), updatedAt: now.toISOString() });
  } else if (snapshot.data()?.email !== actor.email) {
    await ref.update({ email: actor.email, updatedAt: now.toISOString() });
  }
  const data: DocumentData = (await ref.get()).data() ?? {};
  return toProfile(actor, data);
}

export async function saveDisplayName(db: Firestore, actor: Actor, rawName: unknown, now: Date): Promise<Profile> {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (name.length < 3 || name.length > 120) {
    throw new HttpError(400, "datos_invalidos", "Escribí tu nombre completo (entre 3 y 120 caracteres).");
  }
  await ensureProfile(db, actor, now);
  await db.collection(USERS).doc(actor.uid).update({ displayName: name, updatedAt: now.toISOString() });
  return ensureProfile(db, actor, now);
}

/** Datos autodeclarados por la persona. Nada de esto es evidencia oficial de C3. */
export async function saveProfileDetails(db: Firestore, actor: Actor, rawInput: unknown, now: Date): Promise<Profile> {
  const details = parseProfileDetails(rawInput);
  await ensureProfile(db, actor, now);
  await db.collection(USERS).doc(actor.uid).update({
    displayName: details.displayName,
    school: details.school,
    bio: details.bio,
    github: details.github,
    linkedin: details.linkedin,
    updatedAt: now.toISOString(),
  });
  return ensureProfile(db, actor, now);
}

function toProfile(actor: Actor, data: DocumentData): Profile {
  return {
    uid: actor.uid,
    email: actor.email,
    displayName: data.displayName ?? null,
    school: data.school ?? "",
    bio: data.bio ?? "",
    github: data.github ?? "",
    linkedin: data.linkedin ?? "",
    isAdmin: actor.isAdmin,
  };
}
