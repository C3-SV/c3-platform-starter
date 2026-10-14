/** Validaciones PURAS de entradas. Se usan en el servidor antes de cualquier escritura. */
import type { ExperienceKind, ExperienceLine, ExperienceStatus, ParticipationMode } from "./types.ts";

export const EXPERIENCE_KINDS: readonly ExperienceKind[] = ["competencia", "hackathon", "challenge_empresarial"];
export const PARTICIPATION_MODES: readonly ParticipationMode[] = ["individual", "team"];

export interface FieldIssue {
  field: string;
  message: string;
}

/** Error de entrada que el servidor devuelve como 400 con los motivos por campo. */
export class ValidationFailure extends Error {
  readonly issues: FieldIssue[];
  constructor(issues: FieldIssue[]) {
    super("Revisá los datos marcados e intentá de nuevo.");
    this.name = "ValidationFailure";
    this.issues = issues;
  }
}

export interface ExperienceInput {
  title: string;
  kind: ExperienceKind;
  summary: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  primaryLine?: ExperienceLine;
  secondaryLines?: ExperienceLine[];
  isDemo?: boolean;
  demoNote?: string | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
}

export interface RubricInputCriterion {
  label: string;
  maxScore: number;
}

export interface ChallengeInput {
  experienceId: string;
  organizationId: string | null;
  title: string;
  summary: string;
  problem: string;
  deliverables: string[];
  rubric: RubricInputCriterion[];
  organizationName: string;
  allows: ParticipationMode[];
  teamMinSize: number | null;
  teamMaxSize: number | null;
  submissionClosesAt: string;
}

export interface StatusInput {
  status: ExperienceStatus;
}

type Raw = Record<string, unknown>;

function asObject(raw: unknown): Raw {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Raw) : {};
}

function text(raw: Raw, field: string, min: number, max: number, issues: FieldIssue[], label: string): string {
  const value = typeof raw[field] === "string" ? (raw[field] as string).trim() : "";
  if (value.length < min) issues.push({ field, message: `${label}: escribí al menos ${min} caracteres.` });
  else if (value.length > max) issues.push({ field, message: `${label}: no puede superar ${max} caracteres.` });
  return value;
}

function optionalDate(raw: Raw, field: string, issues: FieldIssue[], label: string): string | null {
  const value = raw[field];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    issues.push({ field, message: `${label}: la fecha no es válida.` });
    return null;
  }
  return new Date(value).toISOString();
}

function requiredDate(raw: Raw, field: string, issues: FieldIssue[], label: string): string | null {
  if (raw[field] === undefined || raw[field] === null || raw[field] === "") {
    issues.push({ field, message: `${label}: indicá una fecha.` });
    return null;
  }
  return optionalDate(raw, field, issues, label);
}

export function parseExperienceInput(input: unknown): ExperienceInput {
  const raw = asObject(input);
  const issues: FieldIssue[] = [];
  const title = text(raw, "title", 3, 120, issues, "Nombre");
  const summary = text(raw, "summary", 10, 280, issues, "Descripción");
  const kind = raw.kind;
  if (typeof kind !== "string" || !(EXPERIENCE_KINDS as readonly string[]).includes(kind)) {
    issues.push({ field: "kind", message: "Elegí un tipo de experiencia." });
  }
  const registrationOpensAt = optionalDate(raw, "registrationOpensAt", issues, "Inscripciones abren");
  const registrationClosesAt = optionalDate(raw, "registrationClosesAt", issues, "Inscripciones cierran");
  if (registrationOpensAt && registrationClosesAt && Date.parse(registrationClosesAt) <= Date.parse(registrationOpensAt)) {
    issues.push({ field: "registrationClosesAt", message: "El cierre debe ser posterior a la apertura." });
  }
  if (issues.length) throw new ValidationFailure(issues);
  const primaryLine = typeof raw.primaryLine === "string" && ["compite", "crea", "conecta"].includes(raw.primaryLine)
    ? raw.primaryLine as ExperienceLine
    : undefined;
  const secondaryLines = Array.isArray(raw.secondaryLines)
    ? [...new Set(raw.secondaryLines.filter((line): line is ExperienceLine => typeof line === "string" && ["compite", "crea", "conecta"].includes(line)))]
    : undefined;
  return {
    title,
    kind: kind as ExperienceKind,
    summary,
    registrationOpensAt,
    registrationClosesAt,
    primaryLine,
    secondaryLines,
    isDemo: raw.isDemo === true ? true : undefined,
    demoNote: typeof raw.demoNote === "string" && raw.demoNote.trim() ? raw.demoNote.trim().slice(0, 240) : null,
    sourceUrl: typeof raw.sourceUrl === "string" && raw.sourceUrl.trim() ? raw.sourceUrl.trim() : null,
    sourceLabel: typeof raw.sourceLabel === "string" && raw.sourceLabel.trim() ? raw.sourceLabel.trim().slice(0, 120) : null,
  };
}

export function parseChallengeInput(input: unknown, now: Date): ChallengeInput {
  const raw = asObject(input);
  const issues: FieldIssue[] = [];
  const experienceId = text(raw, "experienceId", 1, 128, issues, "Experiencia");
  const organizationId = typeof raw.organizationId === "string" && raw.organizationId.trim() ? raw.organizationId.trim() : null;
  const title = text(raw, "title", 3, 120, issues, "Nombre del reto");
  const summary = text(raw, "summary", 10, 280, issues, "Resumen");
  const problem = text(raw, "problem", 20, 4000, issues, "Problema");
  const organizationName = text(raw, "organizationName", 2, 120, issues, "Organización responsable");

  const deliverables = Array.isArray(raw.deliverables)
    ? raw.deliverables.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
  if (deliverables.length < 1 || deliverables.length > 10) {
    issues.push({ field: "deliverables", message: "Indicá entre 1 y 10 entregables." });
  } else if (deliverables.some((item) => item.length > 200)) {
    issues.push({ field: "deliverables", message: "Cada entregable puede tener hasta 200 caracteres." });
  }

  const rubric: RubricInputCriterion[] = Array.isArray(raw.rubric)
    ? raw.rubric.map((item) => {
        const criterion = asObject(item);
        return {
          label: typeof criterion.label === "string" ? criterion.label.trim() : "",
          maxScore: Number(criterion.maxScore),
        };
      }).filter((criterion) => criterion.label !== "")
    : [];
  if (rubric.length < 1 || rubric.length > 8) {
    issues.push({ field: "rubric", message: "Indicá entre 1 y 8 criterios de evaluación." });
  } else if (rubric.some((criterion) => criterion.label.length < 3 || criterion.label.length > 120)) {
    issues.push({ field: "rubric", message: "Cada criterio necesita entre 3 y 120 caracteres." });
  } else if (rubric.some((criterion) => !Number.isInteger(criterion.maxScore) || criterion.maxScore < 1 || criterion.maxScore > 10)) {
    issues.push({ field: "rubric", message: "El puntaje máximo de cada criterio debe ser un entero de 1 a 10." });
  }

  const allows = Array.isArray(raw.allows)
    ? raw.allows.filter((mode): mode is ParticipationMode => (PARTICIPATION_MODES as readonly unknown[]).includes(mode))
    : [];
  const uniqueAllows = [...new Set(allows)];
  if (uniqueAllows.length < 1) issues.push({ field: "allows", message: "Elegí al menos una modalidad: individual o equipo." });

  let teamMinSize: number | null = null;
  let teamMaxSize: number | null = null;
  if (uniqueAllows.includes("team")) {
    teamMinSize = Number(raw.teamMinSize);
    teamMaxSize = Number(raw.teamMaxSize);
    if (!Number.isInteger(teamMinSize) || teamMinSize < 2 || teamMinSize > 10) {
      issues.push({ field: "teamMinSize", message: "El mínimo de un equipo es un entero de 2 a 10." });
    }
    if (!Number.isInteger(teamMaxSize) || teamMaxSize < 2 || teamMaxSize > 10) {
      issues.push({ field: "teamMaxSize", message: "El máximo de un equipo es un entero de 2 a 10." });
    } else if (Number.isInteger(teamMinSize) && teamMaxSize < (teamMinSize as number)) {
      issues.push({ field: "teamMaxSize", message: "El máximo no puede ser menor que el mínimo." });
    }
  }

  const submissionClosesAt = requiredDate(raw, "submissionClosesAt", issues, "Cierre de entregas");
  if (submissionClosesAt && Date.parse(submissionClosesAt) <= now.getTime()) {
    issues.push({ field: "submissionClosesAt", message: "El cierre de entregas debe ser una fecha futura." });
  }

  if (issues.length) throw new ValidationFailure(issues);
  return {
    experienceId,
    organizationId,
    title,
    summary,
    problem,
    deliverables,
    rubric: rubric.map((criterion) => ({ label: criterion.label, maxScore: criterion.maxScore })),
    organizationName,
    allows: uniqueAllows,
    teamMinSize: uniqueAllows.includes("team") ? teamMinSize : null,
    teamMaxSize: uniqueAllows.includes("team") ? teamMaxSize : null,
    submissionClosesAt: submissionClosesAt as string,
  };
}

export function parseStatusInput(input: unknown): StatusInput {
  const raw = asObject(input);
  const allowed: readonly string[] = ["draft", "published", "closed", "cancelled"];
  if (typeof raw.status !== "string" || !allowed.includes(raw.status)) {
    throw new ValidationFailure([{ field: "status", message: "Estado no válido." }]);
  }
  return { status: raw.status as ExperienceStatus };
}
