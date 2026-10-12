#!/usr/bin/env node
// Deja los emuladores en estado conocido para Playwright: limpia Auth y Firestore y crea la cuenta
// administradora de prueba con el claim c3Admin. Se ejecuta con Node (no con Playwright) porque
// firebase-admin no carga bien dentro del transpilador de Playwright.
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../e2e/constants.ts";

const PROJECT_ID = "demo-c3-platform";
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

const authClear = await fetch(`http://${authHost}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
const firestoreClear = await fetch(`http://${firestoreHost}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: "DELETE" });
if (!authClear.ok || !firestoreClear.ok) {
  console.error("No se pudieron limpiar los emuladores. ¿Están iniciados?");
  process.exit(1);
}

const signUp = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
});
if (!signUp.ok) {
  console.error(`No se pudo crear la cuenta administradora de prueba: ${signUp.status}`);
  process.exit(1);
}
const { localId } = await signUp.json();
const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
await getAuth(app).setCustomUserClaims(localId, { c3Admin: true });
console.log("Emuladores listos: cuenta administradora de prueba creada.");
