#!/usr/bin/env node
// Reset de los datos de demostración. Simulación por defecto: lista lo que borraría y no escribe nada.
//
// Simulación (remoto):  node --env-file-if-exists=.env.local --experimental-strip-types scripts/demo-reset.mjs --project c3-platform-demo
// Aplicar (con autorización):  ... --project c3-platform-demo --apply --confirm-project c3-platform-demo --backup-file "<ruta FUERA del repositorio>"
// Emulador:  firebase emulators:exec --only auth,firestore --project demo-c3-platform "node --experimental-strip-types scripts/demo-reset.mjs --emulator --project demo-c3-platform"
//
// Antes de borrar escribe un respaldo JSON de todo lo que elimina. No toca cuentas de Auth ni datos históricos.
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_COLLECTIONS, SEED_RECORDS, seedId } from "../src/lib/seed/seed-data.ts";
import { isResettableDemoRecord } from "../src/lib/seed/demo-reset.ts";
import { isOutsideDirectory } from "../src/lib/seed/demo-accounts.ts";

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
const backupPath = valueOf("--backup-file") ? resolve(valueOf("--backup-file")) : null;
const DEMO_PROJECTS = ["c3-platform-demo", "demo-c3-platform"];
const DEMO_CHALLENGE_ID = seedId("challenge", "empresa-demostracion-rutas");

function fail(message) {
  console.error(`Reset detenido: ${message}`);
  process.exit(1);
}

if (!project || !DEMO_PROJECTS.includes(project)) fail(`el proyecto debe ser uno de: ${DEMO_PROJECTS.join(", ")}.`);
if (emulator && project !== "demo-c3-platform") fail("con --emulator el proyecto es demo-c3-platform.");
if (apply) {
  if (confirmProject !== project) fail("--apply exige --confirm-project con el mismo ID del proyecto.");
  if (!backupPath) fail("--apply exige --backup-file con una ruta fuera del repositorio.");
  if (!isOutsideDirectory(repoRoot, backupPath)) fail("el respaldo no puede guardarse dentro del repositorio.");
  if (existsSync(backupPath)) fail("el archivo de respaldo ya existe; elegí otra ruta.");
}
if (emulator && !process.env.FIRESTORE_EMULATOR_HOST) fail("--emulator requiere FIRESTORE_EMULATOR_HOST: ejecutá el comando dentro de firebase emulators:exec.");

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
const db = getFirestore();

// Candidatos: documentos de las colecciones del seed que cumplen la regla. Se leen de Firestore, no de un listado fijo.
const candidates = [];
for (const collection of SEED_COLLECTIONS) {
  const snapshot = await db.collection(collection).get();
  for (const doc of snapshot.docs) {
    if (isResettableDemoRecord(collection, doc.id, doc.data(), DEMO_CHALLENGE_ID)) {
      candidates.push({ collection, id: doc.id, data: doc.data() });
    }
  }
}

console.log(`Destino: ${project}${emulator ? " (emulador)" : ""} · ${apply ? "aplicar" : "simulación"}`);
const byCollection = new Map();
for (const item of candidates) byCollection.set(item.collection, (byCollection.get(item.collection) ?? 0) + 1);
for (const [collection, count] of byCollection) console.log(`  ${collection}: ${count}`);
console.log(`Documentos de demostración a eliminar: ${candidates.length}`);
console.log(`Del seed definido en código: ${SEED_RECORDS.experiences.length + SEED_RECORDS.challenges.length + SEED_RECORDS.organizations.length} experiencias, challenge y organización (solo los marcados demo).`);

if (!apply) {
  console.log("Simulación: no se borró nada. Para aplicar, repetí con --apply, --confirm-project y --backup-file.");
  process.exit(0);
}

writeFileSync(backupPath, `${JSON.stringify({ project, createdAt: new Date().toISOString(), documents: candidates }, null, 2)}\n`, { flag: "wx" });
console.log(`Respaldo de ${candidates.length} documentos guardado fuera del repositorio.`);

for (let index = 0; index < candidates.length; index += 400) {
  const batch = db.batch();
  for (const item of candidates.slice(index, index + 400)) batch.delete(db.collection(item.collection).doc(item.id));
  await batch.commit();
}
console.log(`Eliminados ${candidates.length} documentos de demostración. Cuentas de Auth y datos históricos intactos.`);
