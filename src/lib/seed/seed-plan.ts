import type { SeedRecord } from "./seed-data.ts";

export interface ExistingSeedRecord {
  id: string;
  data: Record<string, unknown>;
}

export interface SeedUpdate {
  record: SeedRecord;
  /** Campos de primer nivel que cambian respecto del documento aplicado. */
  changed: string[];
}

export interface SeedPlan {
  toCreate: SeedRecord[];
  /** Documentos del seed con versión anterior: solo se actualizan en modo `update`, con respaldo previo. */
  toUpdate: SeedUpdate[];
  existing: SeedRecord[];
  conflicts: { record: SeedRecord; reason: string }[];
  writes: number;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function titleKey(data: Record<string, unknown>): string | null {
  return typeof data.title === "string" && data.title.trim() ? data.title.trim().toLowerCase() : null;
}

/** Campos de primer nivel del seed que difieren del documento aplicado. Un campo ausente en el seed no cuenta como cambio. */
export function changedFields(existing: Record<string, unknown>, record: Record<string, unknown>): string[] {
  return Object.keys(record)
    .filter((key) => stable(existing[key]) !== stable(record[key]))
    .sort();
}

/** Un documento del seed aplicado con una versión menor se puede actualizar; el resto es conflicto. */
function isOlderSeedDocument(existing: Record<string, unknown>, record: SeedRecord): boolean {
  return existing.managedBy === "c3-seed"
    && typeof existing.seedVersion === "number"
    && typeof record.data.seedVersion === "number"
    && existing.seedVersion < record.data.seedVersion;
}

export function buildSeedPlan(existing: readonly ExistingSeedRecord[], records: readonly SeedRecord[]): SeedPlan {
  const byId = new Map(existing.map((item) => [item.id, item]));
  const seedIds = new Set(records.map((record) => record.id));
  // Un documento que no es del seed con el mismo título haría aparecer dos veces la misma experiencia en el catálogo público.
  const foreignTitles = new Map<string, string>();
  for (const item of existing) {
    const key = titleKey(item.data);
    if (key && !seedIds.has(item.id)) foreignTitles.set(key, item.id);
  }
  const toCreate: SeedRecord[] = [];
  const toUpdate: SeedUpdate[] = [];
  const existingRecords: SeedRecord[] = [];
  const conflicts: SeedPlan["conflicts"] = [];
  for (const record of records) {
    const found = byId.get(record.id);
    if (!found) {
      const duplicate = titleKey(record.data) ? foreignTitles.get(titleKey(record.data) as string) : undefined;
      if (duplicate) {
        conflicts.push({ record, reason: `Ya existe el documento ${duplicate} con el mismo título. Revisalo antes de crear este.` });
      } else {
        toCreate.push(record);
      }
    } else if (stable(found.data) === stable(record.data)) {
      existingRecords.push(record);
    } else if (isOlderSeedDocument(found.data, record)) {
      // Una actualización que deja el mismo título que un documento ajeno también duplicaría la experiencia.
      const duplicate = titleKey(record.data) ? foreignTitles.get(titleKey(record.data) as string) : undefined;
      if (duplicate) {
        conflicts.push({ record, reason: `Ya existe el documento ${duplicate} con el mismo título. Revisalo antes de actualizar este.` });
      } else {
        toUpdate.push({ record, changed: changedFields(found.data, record.data) });
      }
    } else {
      conflicts.push({ record, reason: "El documento ya existe con contenido diferente y no es una versión anterior del seed." });
    }
  }
  return { toCreate, toUpdate, existing: existingRecords, conflicts, writes: toCreate.length + toUpdate.length };
}
