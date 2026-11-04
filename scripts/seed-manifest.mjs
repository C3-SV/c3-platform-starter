#!/usr/bin/env node
// Genera el manifiesto del seed de demostración a partir de SEED_RECORDS: versión, conteos por colección e identificadores.
// No lee Firestore ni necesita credenciales. Uso: node --experimental-strip-types scripts/seed-manifest.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_RECORDS, SEED_COLLECTIONS } from "../src/lib/seed/seed-data.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(repoRoot, "docs/demo/seed-manifest.json");

const collections = SEED_COLLECTIONS.map((collection) => {
  const records = SEED_RECORDS[collection] ?? [];
  return {
    collection,
    count: records.length,
    ids: records.map((record) => record.id),
  };
});

const seedVersions = [...new Set(Object.values(SEED_RECORDS).flat().map((record) => record.data.seedVersion))];
const manifest = {
  description: "Manifiesto del seed de demostración C3 Challenges. Generado por scripts/seed-manifest.mjs; no contiene credenciales.",
  seedVersions,
  total: collections.reduce((sum, item) => sum + item.count, 0),
  collections,
};

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Manifiesto escrito: ${target} (${manifest.total} registros, versión ${seedVersions.join(", ")})`);
