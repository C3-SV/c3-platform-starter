const requiredPublic = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const missing = requiredPublic.filter((name) => !process.env[name]?.trim());
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  console.error("Producción no puede usar NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.");
  process.exit(1);
}

const hasJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
const hasSplitCredentials = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
].every((name) => Boolean(process.env[name]?.trim()));

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!hasJson && !hasSplitCredentials) {
  console.error("Faltan credenciales privadas de Firebase Admin: FIREBASE_SERVICE_ACCOUNT_JSON o el conjunto separado de FIREBASE_ADMIN_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

if (hasJson) {
  try {
    const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (!account?.project_id || !account?.client_email || !account?.private_key) {
      throw new Error("missing-fields");
    }
    if (account.project_id !== projectId) {
      console.error("La cuenta de servicio de Firebase y NEXT_PUBLIC_FIREBASE_PROJECT_ID apuntan a proyectos distintos.");
      process.exit(1);
    }
  } catch (error) {
    if (error?.message === "missing-fields") {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene project_id, client_email y private_key completos.");
    } else {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido.");
    }
    process.exit(1);
  }
}

if (hasSplitCredentials && process.env.FIREBASE_ADMIN_PROJECT_ID !== projectId) {
  console.error("FIREBASE_ADMIN_PROJECT_ID y NEXT_PUBLIC_FIREBASE_PROJECT_ID apuntan a proyectos distintos.");
  process.exit(1);
}

if (missing.length > 0) {
  console.error(`Faltan variables públicas de Firebase: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Variables de producción válidas para Firebase: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
