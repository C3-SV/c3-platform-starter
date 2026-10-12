import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const PROJECT_ID = "demo-c3-platform";

/** Firestore del emulador. Requiere FIRESTORE_EMULATOR_HOST (lo define `firebase emulators:exec`). */
export function testDb(): Firestore {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Ejecutá estas pruebas con `npm run test:rules` para iniciar los emuladores.");
  }
  const app = getApps().find((item) => item.name === "tests") ?? initializeApp({ projectId: PROJECT_ID }, "tests");
  return getFirestore(app);
}

/** Borra todos los documentos del emulador antes de cada caso. */
export async function clearFirestore(): Promise<void> {
  const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) throw new Error(`No se pudo limpiar el emulador: ${response.status}`);
}

export const admin = { uid: "admin-1", email: "admin@c3.test", isAdmin: true };
export const joven = { uid: "joven-1", email: "joven@correo.test", isAdmin: false };
