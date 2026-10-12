import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

/** Solo servidor. Requiere ADC o identidad administrada en el hosting. */
function adminApp() {
  return getApps().length ? getApps()[0] : initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export async function verifyBearerToken(header: string | null): Promise<DecodedIdToken> {
  if (!header?.startsWith("Bearer ")) throw new Error("Falta token de sesión");
  const token = header.slice(7);
  if (!token) throw new Error("Falta token de sesión");
  return getAuth(adminApp()).verifyIdToken(token, true);
}

/** La autorización de cada recurso debe comprobarse además de la identidad. */
export function requireC3Admin(user: DecodedIdToken): void {
  if (user.c3Admin !== true) throw new Error("Permiso administrativo requerido");
}
