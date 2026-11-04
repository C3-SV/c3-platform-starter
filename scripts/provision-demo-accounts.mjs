#!/usr/bin/env node
// Provisiona las cuentas demo (joven, empresa, administración) y sus vínculos. Simulación por defecto.
//
// Simulación (no escribe nada):
//   node --experimental-strip-types scripts/provision-demo-accounts.mjs --project c3-challenges-demo
// Aplicar (remoto, con autorización):
//   node --experimental-strip-types scripts/provision-demo-accounts.mjs --project c3-challenges-demo --apply --confirm-project c3-challenges-demo --credentials-file "<ruta FUERA del repositorio>"
// Emulador (pruebas locales):
//   firebase emulators:exec --only auth,firestore --project demo-c3-platform "node --experimental-strip-types scripts/provision-demo-accounts.mjs --emulator --project demo-c3-platform --apply --credentials-file <ruta>"
//
// Las credenciales de Admin SDK salen de FIREBASE_SERVICE_ACCOUNT_JSON o de las credenciales por defecto (ADC).
// Las contraseñas nuevas se escriben una sola vez en --credentials-file, que no puede estar dentro del repositorio
// ni sobrescribir un archivo existente. Nunca se imprimen.
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { assertDemoProject, isOutsideDirectory, provisionDemoAccounts } from "../src/lib/seed/demo-accounts.ts";
import { DEMO_ORGANIZATION_ID } from "../src/lib/seed/seed-data.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flags = new Set(argv);
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};

const emulator = flags.has("--emulator");
const apply = flags.has("--apply");
const project = valueOf("--project");
const confirmProject = valueOf("--confirm-project");
const credentialsPath = valueOf("--credentials-file");

function fail(message) {
  console.error(`Provisión detenida: ${message}`);
  process.exit(1);
}

try {
  assertDemoProject(project, { emulator });
} catch (error) {
  fail(error.message);
}

if (emulator && !process.env.FIRESTORE_EMULATOR_HOST) fail("--emulator requiere FIRESTORE_EMULATOR_HOST: ejecutá el comando dentro de firebase emulators:exec.");
if (apply && !emulator && confirmProject !== project) fail("--apply exige --confirm-project con el mismo ID del proyecto.");

// En emulador, las cuentas usan la contraseña de prueba de la suite (solo emulador): no hay archivo de credenciales.
const EMULATOR_PASSWORD = "clave-prueba-123";
let credentialsTarget = null;
if (apply && !emulator) {
  if (!credentialsPath) fail("--apply exige --credentials-file con una ruta fuera del repositorio.");
  credentialsTarget = resolve(credentialsPath);
  if (!isOutsideDirectory(repoRoot, credentialsTarget)) fail("las credenciales no pueden guardarse dentro del repositorio.");
  if (existsSync(credentialsTarget)) fail("el archivo de credenciales ya existe; elegí otra ruta para no sobrescribirlo.");
}

if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson && !emulator) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.project_id !== project) fail("FIREBASE_SERVICE_ACCOUNT_JSON no pertenece al proyecto indicado.");
    initializeApp({ projectId: project, credential: cert(serviceAccount) });
  } else {
    initializeApp({ projectId: project });
  }
}

function writeCredentials(credentials) {
  const header = [
    `# Cuentas demo C3 Challenges · proyecto ${project} · ${new Date().toISOString()}`,
    "# No versionar ni compartir por chat. Entregar por un canal seguro y rotar tras el ensayo.",
  ];
  const lines = credentials.map((item) => `${item.email}\t${item.password}`);
  try {
    writeFileSync(credentialsTarget, `${[...header, ...lines].join("\n")}\n`, { flag: "wx" });
  } catch (error) {
    // Se escribe antes de crear cuentas: si falla, no queda ninguna cuenta nueva sin credenciales.
    throw new Error(`no se pudo guardar el archivo de credenciales (${error.code ?? "error"}). Revisá que la carpeta exista y que la ruta sea Windows (C:\\...).`);
  }
  console.log(`Credenciales nuevas guardadas fuera del repositorio (${credentials.length}).`);
}

const summary = await provisionDemoAccounts({
  db: getFirestore(),
  auth: getAuth(),
  organizationId: DEMO_ORGANIZATION_ID,
  apply,
  now: new Date(),
  writeCredentials: emulator ? () => {} : writeCredentials,
  passwordFor: emulator ? () => EMULATOR_PASSWORD : undefined,
}).catch((error) => fail(error.message));

console.log(`Destino: ${project}${emulator ? " (emulador)" : ""} · ${summary.dryRun ? "simulación" : "aplicado"}`);
for (const item of summary.plan) {
  const notes = [item.linked ? "vínculo a la organización demo" : null, item.claimPending ? "permiso de administración pendiente" : null].filter(Boolean);
  console.log(`  ${item.email}: ${item.action}${notes.length ? ` · ${notes.join(" · ")}` : ""}`);
}
console.log(`Cuentas nuevas: ${summary.created}`);
if (summary.dryRun) console.log("Simulación: no se modificó nada. Para aplicar, repetí con --apply, --confirm-project y --credentials-file.");
