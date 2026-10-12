import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Solo para uso desde componentes cliente. No importar esto en Server Components. */
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

export function getClientAuth(): Auth { return getAuth(getClientApp()); }
export function getClientDb(): Firestore { return getFirestore(getClientApp()); }
