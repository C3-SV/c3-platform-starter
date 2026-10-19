import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_RECORDS, validateSeedRecords } from "../src/lib/seed/seed-data.ts";
import { buildSeedPlan } from "../src/lib/seed/seed-plan.ts";

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

function fail(message) {
  console.error(`Seed detenido: ${message}`);
  process.exitCode = 1;
}

if (!project) fail("indicá --project <id> de forma explícita.");
if (mode !== "dry-run" && mode !== "apply") fail("--mode debe ser dry-run o apply.");
if (mode === "apply" && (confirmProject !== project || !args.has("--allow-write"))) {
  fail("apply exige --confirm-project con el mismo ID y --allow-write.");
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

validateSeedRecords([...SEED_RECORDS.experiences, ...SEED_RECORDS.challenges]);
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
const groups = [SEED_RECORDS.experiences, SEED_RECORDS.challenges];
const plans = [];

for (const records of groups) {
  const collection = records[0]?.collection;
  const existing = useRest
    ? await readRestCollection(collection)
    : (await db.collection(collection).get()).docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  plans.push({ collection, plan: buildSeedPlan(existing, records) });
}

console.log(`Destino: ${project}${emulator ? " (emulador)" : useRest ? " (Firebase CLI REST)" : ""}`);
let writes = 0;
let conflicts = 0;
for (const { collection, plan } of plans) {
  console.log(`${collection}: crear ${plan.toCreate.length}, existentes ${plan.existing.length}, conflictos ${plan.conflicts.length}`);
  for (const conflict of plan.conflicts) console.log(`  conflicto ${collection}/${conflict.record.id}: ${conflict.reason}`);
  writes += plan.writes;
  conflicts += plan.conflicts.length;
}
console.log(`Escrituras previstas: ${writes}`);

if (conflicts > 0) fail("hay conflictos; no se aplican escrituras.");
if (mode === "dry-run") {
  console.log("Dry-run: no se modificaron datos.");
  process.exit(0);
}

for (const { collection, plan } of plans) {
  for (const record of plan.toCreate) {
    if (useRest) await createRestDocument(collection, record);
    else await db.collection(collection).doc(record.id).create(record.data);
    console.log(`creado ${collection}/${record.id}`);
  }
}
console.log("Seed aplicado sin sobrescribir ni eliminar documentos.");
