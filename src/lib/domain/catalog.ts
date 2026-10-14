import type { PresentedState } from "./presentation.ts";
import type { Experience, ExperienceKind, ExperienceLine, ExperienceStatus } from "./types.ts";

export type { ExperienceLine } from "./types.ts";

const KIND_LINE: Record<ExperienceKind, ExperienceLine> = {
  competencia: "compite",
  hackathon: "crea",
  challenge_empresarial: "conecta",
};

const LINES: readonly ExperienceLine[] = ["compite", "crea", "conecta"];

export interface ExperienceMetadata {
  isDemo: boolean;
  demoNote: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
}

export interface ExperienceWindow {
  opensAt?: string | null;
  closesAt?: string | null;
}

export function fallbackLineOf(kind: ExperienceKind): ExperienceLine {
  return KIND_LINE[kind];
}

export function experienceLinesOf(experience: Pick<Experience, "kind" | "primaryLine" | "secondaryLines">): ExperienceLine[] {
  const primary = experience.primaryLine && LINES.includes(experience.primaryLine)
    ? experience.primaryLine
    : fallbackLineOf(experience.kind);
  const secondary = Array.isArray(experience.secondaryLines)
    ? experience.secondaryLines.filter((line): line is ExperienceLine => LINES.includes(line))
    : [];
  return [...new Set([primary, ...secondary])];
}

export function isInExperienceLine(experience: Pick<Experience, "kind" | "primaryLine" | "secondaryLines">, line: ExperienceLine): boolean {
  return experienceLinesOf(experience).includes(line);
}

export function normalizeExperienceMetadata(raw: unknown): ExperienceMetadata {
  const value = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
  const sourceUrl = typeof value.sourceUrl === "string" ? value.sourceUrl.trim() : "";
  let validSourceUrl: string | null = null;
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol === "https:" && parsed.hostname) validSourceUrl = sourceUrl;
  } catch {
    // La procedencia inválida se omite del catálogo público.
  }
  const demoNote = typeof value.demoNote === "string" && value.demoNote.trim()
    ? value.demoNote.trim().slice(0, 240)
    : null;
  const sourceLabel = typeof value.sourceLabel === "string" && value.sourceLabel.trim()
    ? value.sourceLabel.trim().slice(0, 120)
    : null;
  return {
    isDemo: value.isDemo === true,
    demoNote,
    sourceUrl: validSourceUrl,
    sourceLabel,
  };
}

export function presentExperienceState(status: ExperienceStatus, dates: ExperienceWindow, now: Date): PresentedState {
  if (status === "draft") return { label: "Borrador", tone: "neutro" };
  if (status === "cancelled") return { label: "Cancelado", tone: "error" };
  if (status === "closed") return { label: "Concluido", tone: "exito" };
  const opens = dates.opensAt ? Date.parse(dates.opensAt) : null;
  const closes = dates.closesAt ? Date.parse(dates.closesAt) : null;
  if (opens !== null && now.getTime() < opens) return { label: "Próximo", tone: "neutro" };
  if (closes !== null && now.getTime() >= closes) return { label: "En desarrollo", tone: "info" };
  return { label: "Abierto", tone: "info" };
}
