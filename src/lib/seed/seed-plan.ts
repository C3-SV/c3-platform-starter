import type { SeedRecord } from "./seed-data.ts";

export interface ExistingSeedRecord {
  id: string;
  data: Record<string, unknown>;
}

export interface SeedPlan {
  toCreate: SeedRecord[];
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

export function buildSeedPlan(existing: readonly ExistingSeedRecord[], records: readonly SeedRecord[]): SeedPlan {
  const byId = new Map(existing.map((item) => [item.id, item]));
  const toCreate: SeedRecord[] = [];
  const existingRecords: SeedRecord[] = [];
  const conflicts: SeedPlan["conflicts"] = [];
  for (const record of records) {
    const found = byId.get(record.id);
    if (!found) {
      toCreate.push(record);
    } else if (stable(found.data) === stable(record.data)) {
      existingRecords.push(record);
    } else {
      conflicts.push({ record, reason: "El documento ya existe con contenido diferente." });
    }
  }
  return { toCreate, existing: existingRecords, conflicts, writes: toCreate.length };
}
