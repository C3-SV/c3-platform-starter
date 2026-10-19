import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Solo servidor. En desarrollo, las variables FIRESTORE_EMULATOR_HOST y FIREBASE_AUTH_EMULATOR_HOST
 * dirigen el SDK a los emuladores. En producción usa credenciales del entorno (ADC) o la identidad
 * administrada del hosting. Nunca se configuran claves privadas en NEXT_PUBLIC_*.
 */
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const serviceAccount = serviceAccountFromEnv();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || serviceAccount?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Falta GOOGLE_CLOUD_PROJECT o NEXT_PUBLIC_FIREBASE_PROJECT_ID. Revisá .env.local.");
  }

  if (serviceAccount && projectId !== serviceAccount.projectId) {
    throw new Error("El proyecto de Firebase y la cuenta de servicio no coinciden. Revisá las variables de producción.");
  }

  return initializeApp({
    projectId,
    ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
  });
}

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

/**
 * Vercel no entrega ADC de Google automáticamente. En producción se puede usar
 * un JSON completo o las tres variables separadas, siempre como variables
 * privadas del proyecto Vercel; nunca NEXT_PUBLIC_* ni archivos versionados.
 */
function serviceAccountFromEnv(): FirebaseServiceAccount | undefined {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(json) as Record<string, unknown>;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido de cuenta de servicio.");
    }
    return normalizeServiceAccount(parsed);
  }

  // GOOGLE_CLOUD_PROJECT identifica el proyecto del emulador/ADC; no es una cuenta
  // de servicio. Solo activamos la validación de credenciales separadas cuando se
  // proporcionó explícitamente alguna de sus variables privadas.
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId && !clientEmail && !privateKey) return undefined;
  return normalizeServiceAccount({ project_id: projectId, client_email: clientEmail, private_key: privateKey });
}

function normalizeServiceAccount(value: Record<string, unknown>): FirebaseServiceAccount {
  const projectId = typeof value.project_id === "string" ? value.project_id : undefined;
  const clientEmail = typeof value.client_email === "string" ? value.client_email : undefined;
  const privateKey = typeof value.private_key === "string" ? value.private_key.replace(/\\n/g, "\n") : undefined;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("La cuenta de servicio de Firebase requiere project_id, client_email y private_key.");
  }
  return { projectId, clientEmail, privateKey };
}

export function getAdminDb(): Firestore {
  return getFirestore(adminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(adminApp());
}
