import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const PROJECT_ID = "demo-c3-platform";

function testApp(): App {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Ejecutá estas pruebas con `npm run test:rules` para iniciar los emuladores.");
  }
  return getApps().find((item) => item.name === "tests") ?? initializeApp({ projectId: PROJECT_ID }, "tests");
}

/** Firestore del emulador. Requiere FIRESTORE_EMULATOR_HOST (lo define `firebase emulators:exec`). */
export function testDb(): Firestore {
  return getFirestore(testApp());
}

/** Auth Admin contra el emulador de Auth (FIREBASE_AUTH_EMULATOR_HOST). */
export function testAuth(): Auth {
  return getAuth(testApp());
}

/** Borra todos los documentos del emulador antes de cada caso. */
export async function clearFirestore(): Promise<void> {
  const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) throw new Error(`No se pudo limpiar el emulador: ${response.status}`);
}

/** Borra las cuentas del emulador de Auth. */
export async function clearAuth(): Promise<void> {
  const url = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) throw new Error(`No se pudo limpiar Auth: ${response.status}`);
}

/** Crea una cuenta en el emulador de Auth con el Admin SDK y devuelve su uid (fijo si se indica). */
export async function createAuthUser(email: string, uid?: string): Promise<string> {
  const user = await testAuth().createUser({ email, password: "clave-prueba-123", ...(uid ? { uid } : {}) });
  return user.uid;
}

export const admin = { uid: "admin-1", email: "admin@c3.test", isAdmin: true };
export const joven = { uid: "joven-1", email: "joven@correo.test", isAdmin: false };
