import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

/** Solo para componentes cliente. No importar esto en Server Components ni en rutas de API. */
export function getClientApp(): FirebaseApp {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Configuración de Firebase incompleta. Revisá .env.local.");
  }
  return getApps().length ? getApp() : initializeApp(config);
}

/** Comprobación sin SDK: indica si la configuración pública está completa. */
export function isClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

let emulatorConnected = false;

/**
 * Autenticación del navegador. Con NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true se conecta al
 * Auth Emulator local. Firestore no se usa desde el cliente: todos los datos pasan por rutas de servidor.
 */
export function getClientAuth(): Auth {
  const auth = getAuth(getClientApp());
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" && !emulatorConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    emulatorConnected = true;
  }
  return auth;
}
