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

/**
 * Crea el perfil la primera vez y devuelve el estado actual. La identidad viene solo del token verificado.
 * Es una transacción: al crear la cuenta llegan casi a la vez la lectura de `/api/me` (que la interfaz hace al
 * iniciar sesión) y el guardado del nombre; sin ella, la creación tardía podía pisar el nombre recién guardado.
 */
export async function ensureProfile(db: Firestore, actor: Actor, now: Date): Promise<Profile> {
  const ref = db.collection(USERS).doc(actor.uid);
  const data = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      const created = { email: actor.email, displayName: null, createdAt: now.toISOString(), updatedAt: now.toISOString() };
      transaction.set(ref, created);
      return created as DocumentData;
    }
    const current: DocumentData = snapshot.data() ?? {};
    if (current.email !== actor.email) {
      transaction.update(ref, { email: actor.email, updatedAt: now.toISOString() });
      return { ...current, email: actor.email };
    }
    return current;
  });
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
