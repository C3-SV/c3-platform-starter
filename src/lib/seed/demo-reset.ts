/**
 * Selección PURA de los documentos que un reset de demostración puede borrar.
 * Solo entra lo que el seed creó como demostración: nunca experiencias históricas (con procedencia), nunca cuentas
 * de Auth ni perfiles de personas reales (no tienen id del seed), y nunca un documento sin la marca del seed.
 */
import type { SeedRecord } from "./seed-data.ts";

export function isResettableDemoRecord(collection: string, id: string, data: Record<string, unknown>, demoChallengeId: string): boolean {
  if (!id.startsWith("seed_")) return false;
  if (data.managedBy !== "c3-seed") return false;
  if (collection === "experiences") return data.isDemo === true && !data.sourceUrl;
  if (collection === "challenges") return id === demoChallengeId;
  return data.demo === true || data.isDemo === true;
}

/** Selección sobre el dataset definido en el seed, para pruebas y para el dry-run sin consultar Firestore. */
export function resettableFrom(records: readonly SeedRecord[], demoChallengeId: string): SeedRecord[] {
  return records.filter((record) => isResettableDemoRecord(record.collection, record.id, record.data, demoChallengeId));
}
