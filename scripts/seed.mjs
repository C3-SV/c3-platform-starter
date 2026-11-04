import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_RECORDS, validateSeedRecords } from "../src/lib/seed/seed-data.ts";
import { buildSeedPlan } from "../src/lib/seed/seed-plan.ts";
import { isOutsideDirectory } from "../src/lib/seed/demo-accounts.ts";

const args = new Set(process.argv.slice(2));
const valueOf = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};
const mode = valueOf("--mode") ?? "dry-run";
const project = valueOf("--project");
const confirmProject = valueOf("--confirm-project");
const emulator = args.has("--emulator");
const cliAccessToken = process.env.FIREBASE_CLI_ACCESS_TOKEN;
const useRest = Boolean(cliAccessToken) && !emulator;
const firestoreApiRoot = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project ?? "")}/databases/(default)/documents`;

// Corta la ejecución: un fallo nunca debe seguir hasta las escrituras.
function fail(message) {
  console.error(`Seed detenido: ${message}`);
  process.exit(1);
}

if (!project) fail("indicá --project <id> de forma explícita.");
// Lista cerrada: el seed de la demo solo escribe en el proyecto de la demo o en el de los emuladores.
const SEED_PROJECTS = ["c3-platform-demo", "demo-c3-platform"];
if (project && !SEED_PROJECTS.includes(project)) fail(`el proyecto ${project} no está en la lista del seed de la demo (${SEED_PROJECTS.join(", ")}).`);
if (!["dry-run", "apply", "update"].includes(mode)) fail("--mode debe ser dry-run, apply o update.");
if (mode !== "dry-run" && (confirmProject !== project || !args.has("--allow-write"))) {
  fail("apply y update exigen --confirm-project con el mismo ID y --allow-write.");
}
// update reemplaza campos de documentos del seed con versión anterior. Exige respaldo previo fuera del repositorio.
const backupPath = valueOf("--backup-file") ? resolve(valueOf("--backup-file")) : null;
if (mode === "update") {
  if (!args.has("--allow-update")) fail("update exige --allow-update.");
  if (!backupPath) fail("update exige --backup-file con una ruta fuera del repositorio.");
  if (backupPath && !isOutsideDirectory(resolve(dirname(fileURLToPath(import.meta.url)), ".."), backupPath)) {
    fail("el respaldo no puede guardarse dentro del repositorio.");
  }
  if (backupPath && existsSync(backupPath)) fail("el archivo de respaldo ya existe; elegí otra ruta.");
}
if (emulator && !process.env.FIRESTORE_EMULATOR_HOST) {
  fail("--emulator requiere FIRESTORE_EMULATOR_HOST; ejecutá el comando dentro de Firebase Emulator Suite.");
}
if (process.exitCode) process.exit();

// .env.local mantiene la configuración del emulador para el desarrollo diario.
// Un seed real debe ser explícito y nunca heredar accidentalmente ese endpoint.
if (!emulator) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
}

function encodeFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  if (typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeFirestoreValue(item)])) } };
  }
  throw new Error("El seed contiene un valor no compatible con Firestore.");
}

function decodeFirestoreValue(value) {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeFirestoreValue);
  if ("mapValue" in value) return decodeFirestoreFields(value.mapValue.fields ?? {});
  return undefined;
}

function decodeFirestoreFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
}

async function firestoreRestRequest(path, init = {}) {
  const response = await fetch(`${firestoreApiRoot}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cliAccessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Firestore REST ${response.status}: ${body.slice(0, 400)}`);
  return body ? JSON.parse(body) : null;
}

async function readRestCollection(collection) {
  const documents = [];
  let pageToken = null;
  do {
    const query = new URLSearchParams({ pageSize: "1000" });
    if (pageToken) query.set("pageToken", pageToken);
    const result = await firestoreRestRequest(`/${encodeURIComponent(collection)}?${query}`);
    documents.push(...(result?.documents ?? []).map((document) => ({
      id: document.name.split("/").at(-1),
      data: decodeFirestoreFields(document.fields ?? {}),
    })));
    pageToken = result?.nextPageToken ?? null;
  } while (pageToken);
  return documents;
}

async function createRestDocument(collection, record) {
  await firestoreRestRequest(`/${encodeURIComponent(collection)}?documentId=${encodeURIComponent(record.id)}`, {
    method: "POST",
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(record.data).map(([key, value]) => [key, encodeFirestoreValue(value)])) }),
  });
}

validateSeedRecords(Object.values(SEED_RECORDS).flat());
let db = null;
if (!useRest && !getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (serviceAccount.project_id && serviceAccount.project_id !== project) {
        fail("FIREBASE_SERVICE_ACCOUNT_JSON no pertenece al proyecto indicado.");
      } else {
        initializeApp({ projectId: project, credential: cert(serviceAccount) });
      }
    } catch {
      fail("FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido.");
    }
  } else {
    initializeApp({ projectId: project });
  }
}
if (process.exitCode) process.exit();
if (!useRest) db = getFirestore();
// Las organizaciones van primero: los challenges las referencian por organizationId.
const groups = Object.values(SEED_RECORDS);
const plans = [];

for (const records of groups) {
  const collection = records[0]?.collection;
  const existing = useRest
    ? await readRestCollection(collection)
    : (await db.collection(collection).get()).docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  plans.push({ collection, existing, plan: buildSeedPlan(existing, records) });
}

console.log(`Destino: ${project}${emulator ? " (emulador)" : useRest ? " (Firebase CLI REST)" : ""} · modo ${mode}`);
let writes = 0;
let conflicts = 0;
let updates = 0;
for (const { collection, plan } of plans) {
  console.log(`${collection}: crear ${plan.toCreate.length}, actualizar ${plan.toUpdate.length}, existentes ${plan.existing.length}, conflictos ${plan.conflicts.length}`);
  for (const conflict of plan.conflicts) console.log(`  conflicto ${collection}/${conflict.record.id}: ${conflict.reason}`);
  for (const update of plan.toUpdate) console.log(`  actualizar ${collection}/${update.record.id}: campos ${update.changed.join(", ")}`);
  writes += plan.writes;
  conflicts += plan.conflicts.length;
  updates += plan.toUpdate.length;
}
console.log(`Escrituras previstas: ${writes}`);

if (conflicts > 0) fail("hay conflictos; no se aplican escrituras.");
if (mode === "dry-run") {
  console.log("Dry-run: no se modificaron datos.");
  process.exit(0);
}
if (mode === "apply" && updates > 0) fail("hay documentos del seed con versión anterior: usá --mode update con respaldo.");
if (mode === "update" && useRest) fail("update requiere credenciales de Admin SDK (FIREBASE_SERVICE_ACCOUNT_JSON o ADC), no FIREBASE_CLI_ACCESS_TOKEN.");

if (mode === "update" && updates > 0) {
  // Respaldo del estado anterior antes de tocar nada: si algo sale mal, se puede restaurar desde este archivo.
  const backup = plans.flatMap(({ collection, existing, plan }) => plan.toUpdate.map((update) => ({
    collection,
    id: update.record.id,
    data: existing.find((item) => item.id === update.record.id)?.data ?? null,
  })));
  writeFileSync(backupPath, `${JSON.stringify({ project, createdAt: new Date().toISOString(), documents: backup }, null, 2)}\n`, { flag: "wx" });
  console.log(`Respaldo de ${backup.length} documentos guardado fuera del repositorio.`);
}

for (const { collection, plan } of plans) {
  for (const record of plan.toCreate) {
    if (useRest) await createRestDocument(collection, record);
    else await db.collection(collection).doc(record.id).create(record.data);
    console.log(`creado ${collection}/${record.id}`);
  }
  if (mode === "update") {
    for (const { record } of plan.toUpdate) {
      // merge: conserva campos que el seed no define; sobrescribe los del seed.
      await db.collection(collection).doc(record.id).set(record.data, { merge: true });
      console.log(`actualizado ${collection}/${record.id}`);
    }
  }
}
console.log(mode === "update" ? "Seed actualizado: no se eliminó ningún documento." : "Seed aplicado sin sobrescribir ni eliminar documentos.");
