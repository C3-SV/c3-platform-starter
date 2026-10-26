/** Validaciones PURAS de entradas. Se usan en el servidor antes de cualquier escritura. */
import { fallbackLineOf } from "./catalog.ts";
import type { ExperienceKind, ExperienceLine, ExperienceModality, ExperienceStatus, ParticipationMode } from "./types.ts";

export const EXPERIENCE_KINDS: readonly ExperienceKind[] = ["competencia", "hackathon", "challenge_empresarial", "taller", "charla", "encuentro"];
export const EXPERIENCE_MODALITIES: readonly ExperienceModality[] = ["presencial", "virtual", "hibrida"];
export const EXPERIENCE_LINES: readonly ExperienceLine[] = ["compite", "crea", "conecta"];
export const PARTICIPATION_MODES: readonly ParticipationMode[] = ["individual", "team"];
export const CAPACITY_MAX = 5000;

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
  primaryLine: ExperienceLine;
  secondaryLines: ExperienceLine[];
  startsAt: string | null;
  endsAt: string | null;
  modality: ExperienceModality | null;
  location: string | null;
  capacity: number | null;
  isDemo?: boolean;
  demoNote: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
}

/** Apertura o cierre manual de inscripciones de una experiencia publicada. */
export interface RegistrationActionInput {
  action: "open" | "close";
  registrationClosesAt: string | null;
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

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function optionalText(raw: Raw, field: string, max: number, issues: FieldIssue[], label: string): string | null {
  const value = typeof raw[field] === "string" ? (raw[field] as string).trim() : "";
  if (!value) return null;
  if (value.length > max) {
    issues.push({ field, message: `${label}: no puede superar ${max} caracteres.` });
    return null;
  }
  return value;
}

function optionalCapacity(raw: Raw, issues: FieldIssue[]): number | null {
  const value = raw.capacity;
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > CAPACITY_MAX) {
    issues.push({ field: "capacity", message: `Cupos: indicá un entero de 1 a ${CAPACITY_MAX}, o dejalo vacío si no hay límite.` });
    return null;
  }
  return parsed;
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

  const startsAt = optionalDate(raw, "startsAt", issues, "Inicio");
  const endsAt = optionalDate(raw, "endsAt", issues, "Fin");
  if (endsAt && !startsAt) {
    issues.push({ field: "startsAt", message: "Inicio: indicá cuándo empieza si definís el fin." });
  } else if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    issues.push({ field: "endsAt", message: "El fin debe ser posterior al inicio." });
  }
  if (registrationClosesAt && endsAt && Date.parse(registrationClosesAt) > Date.parse(endsAt)) {
    issues.push({ field: "registrationClosesAt", message: "Las inscripciones deben cerrar antes de que termine la sesión." });
  }

  const modalityRaw = raw.modality;
  let modality: ExperienceModality | null = null;
  if (modalityRaw !== undefined && modalityRaw !== null && modalityRaw !== "") {
    if (typeof modalityRaw === "string" && (EXPERIENCE_MODALITIES as readonly string[]).includes(modalityRaw)) {
      modality = modalityRaw as ExperienceModality;
    } else {
      issues.push({ field: "modality", message: "Elegí una modalidad válida: presencial, virtual o híbrida." });
    }
  }
  const location = optionalText(raw, "location", 200, issues, "Sede o enlace");
  if (location && modality === "virtual" && !isHttpsUrl(location)) {
    issues.push({ field: "location", message: "Para una sesión virtual, indicá el enlace completo que empieza con https://." });
  }
  const capacity = optionalCapacity(raw, issues);

  const sourceUrl = typeof raw.sourceUrl === "string" ? raw.sourceUrl.trim() : "";
  if (sourceUrl && !isHttpsUrl(sourceUrl)) {
    issues.push({ field: "sourceUrl", message: "Fuente: indicá un enlace completo que empiece con https://." });
  }
  const sourceLabel = optionalText(raw, "sourceLabel", 120, issues, "Nombre de la fuente");
  const demoNote = optionalText(raw, "demoNote", 240, issues, "Nota de demostración");

  if (issues.length) throw new ValidationFailure(issues);
  const experienceKind = kind as ExperienceKind;
  const primaryLine = typeof raw.primaryLine === "string" && (EXPERIENCE_LINES as readonly string[]).includes(raw.primaryLine)
    ? raw.primaryLine as ExperienceLine
    : fallbackLineOf(experienceKind);
  const secondaryLines = Array.isArray(raw.secondaryLines)
    ? [...new Set(raw.secondaryLines.filter((line): line is ExperienceLine => typeof line === "string" && (EXPERIENCE_LINES as readonly string[]).includes(line)))]
        .filter((line) => line !== primaryLine)
    : [];
  return {
    title,
    kind: experienceKind,
    summary,
    registrationOpensAt,
    registrationClosesAt,
    primaryLine,
    secondaryLines,
    startsAt,
    endsAt,
    modality,
    location,
    capacity,
    isDemo: raw.isDemo === true ? true : undefined,
    demoNote,
    sourceUrl: sourceUrl || null,
    sourceLabel,
  };
}

export function parseRegistrationAction(input: unknown): RegistrationActionInput {
  const raw = asObject(input);
  if (raw.action !== "open" && raw.action !== "close") {
    throw new ValidationFailure([{ field: "action", message: "Elegí si abrir o cerrar las inscripciones." }]);
  }
  const issues: FieldIssue[] = [];
  const registrationClosesAt = optionalDate(raw, "registrationClosesAt", issues, "Inscripciones cierran");
  if (issues.length) throw new ValidationFailure(issues);
  return { action: raw.action, registrationClosesAt };
}

export function parseChallengeInput(input: unknown, now: Date): ChallengeInput {
  const raw = asObject(input);
  const issues: FieldIssue[] = [];
  const experienceId = text(raw, "experienceId", 1, 128, issues, "Experiencia");
  const organizationId = typeof raw.organizationId === "string" && raw.organizationId.trim() ? raw.organizationId.trim() : null;
  const title = text(raw, "title", 3, 120, issues, "Nombre del challenge");
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
