import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "../firebase/admin.ts";
import { authenticate, type Actor } from "./auth.ts";

/** Identidad de la petición: token de Firebase verificado con el Admin SDK (revocaciones incluidas). */
export function requestActor(request: Request): Promise<Actor> {
  return authenticate(request, async (idToken) => {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    return { uid: decoded.uid, email: decoded.email, c3Admin: decoded.c3Admin === true };
  });
}

export function database(): Firestore {
  return getAdminDb();
}
