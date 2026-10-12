import "server-only";
import { getApps, initializeApp, type App } from "firebase-admin/app";
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
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Falta GOOGLE_CLOUD_PROJECT o NEXT_PUBLIC_FIREBASE_PROJECT_ID. Revisá .env.local.");
  }
  return initializeApp({ projectId });
}

export function getAdminDb(): Firestore {
  return getFirestore(adminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(adminApp());
}
