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
 * Sal del hash de conexión. Sin una sal secreta, las IPv4 se revierten por fuerza bruta: en producción la variable es obligatoria.
 * El emulador (desarrollo y E2E) usa una sal fija de prueba.
 */
function rateLimitSalt(): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (salt) return salt;
  if (process.env.NODE_ENV === "production" && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Falta RATE_LIMIT_SALT en el entorno de despliegue: sin sal no se protege la conexión de quien propone.");
  }
  return "c3-desarrollo";
}

/**
 * Clave de límite por conexión. Usa un hash con sal: la IP nunca se guarda en claro.
 * Sin IP visible (desarrollo), todas las pruebas comparten una sola clave.
 */
export function clientKeyOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return createHash("sha256").update(`${rateLimitSalt()}:${forwarded}`).digest("hex").slice(0, 40);
}
