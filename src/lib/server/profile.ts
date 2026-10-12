import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { HttpError } from "./errors.ts";
import type { Actor } from "./auth.ts";

export const USERS = "users";

export interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
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

function toProfile(actor: Actor, data: DocumentData): Profile {
  return {
    uid: actor.uid,
    email: actor.email,
    displayName: data.displayName ?? null,
    isAdmin: actor.isAdmin,
  };
}
