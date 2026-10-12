#!/usr/bin/env node
// Otorga el claim c3Admin a una cuenta existente. Uso:
//   node --env-file-if-exists=.env.local scripts/grant-admin.mjs correo@dominio
// Con emuladores, define FIREBASE_AUTH_EMULATOR_HOST. En producción usa credenciales del entorno (ADC).
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/grant-admin.mjs correo@dominio");
  process.exit(1);
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta GOOGLE_CLOUD_PROJECT o NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ projectId });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No existe una cuenta con el correo ${email}. Creala primero desde /acceso.`);
  process.exit(1);
}
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), c3Admin: true });
console.log(`Permiso de administrador otorgado a ${email}.`);
console.log("Cerrá sesión y volvé a entrar para que el nuevo token incluya el permiso.");
