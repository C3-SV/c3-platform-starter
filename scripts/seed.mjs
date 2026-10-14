import { initializeApp, getApps } from "firebase-admin/app";
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

validateSeedRecords([...SEED_RECORDS.experiences, ...SEED_RECORDS.challenges]);
if (!getApps().length) initializeApp({ projectId: project });
const db = getFirestore();
const groups = [SEED_RECORDS.experiences, SEED_RECORDS.challenges];
const plans = [];

for (const records of groups) {
  const collection = records[0]?.collection;
  const snapshot = await db.collection(collection).get();
  plans.push({ collection, plan: buildSeedPlan(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })), records) });
}

console.log(`Destino: ${project}${emulator ? " (emulador)" : ""}`);
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
    await db.collection(collection).doc(record.id).create(record.data);
    console.log(`creado ${collection}/${record.id}`);
  }
}
console.log("Seed aplicado sin sobrescribir ni eliminar documentos.");
