import "server-only";
import { createHash } from "node:crypto";
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

/**
 * Clave de límite por conexión. Usa un hash con sal: la IP nunca se guarda en claro.
 * Sin IP visible (desarrollo), todas las pruebas comparten una sola clave.
 */
export function clientKeyOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(`${process.env.RATE_LIMIT_SALT ?? "c3"}:${forwarded}`).digest("hex").slice(0, 40);
}
