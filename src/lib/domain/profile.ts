/** Datos autodeclarados del perfil. Son distintos de la trayectoria registrada por C3 (resultados, entregas y participaciones). */
import { ValidationFailure, type FieldIssue } from "./validation.ts";

export interface ProfileDetailsInput {
  displayName: string;
  school: string;
  bio: string;
  github: string;
  linkedin: string;
}

export const PROFILE_LIMITS = { name: [3, 120], school: 120, bio: 500, link: 200 } as const;

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

/** Valida lo que la persona declara de sí misma. Los enlaces son opcionales, pero deben ser https. */
export function parseProfileDetails(input: unknown): ProfileDetailsInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const issues: FieldIssue[] = [];
  const text = (field: string, max: number): string => {
    const value = typeof raw[field] === "string" ? (raw[field] as string).trim() : "";
    if (value.length > max) issues.push({ field, message: `Este campo puede tener hasta ${max} caracteres.` });
    return value;
  };
  const displayName = typeof raw.displayName === "string" ? raw.displayName.trim() : "";
  if (displayName.length < PROFILE_LIMITS.name[0] || displayName.length > PROFILE_LIMITS.name[1]) {
    issues.push({ field: "displayName", message: "Escribí tu nombre completo (entre 3 y 120 caracteres)." });
  }
  const link = (field: string): string => {
    const value = typeof raw[field] === "string" ? (raw[field] as string).trim() : "";
    if (value && (value.length > PROFILE_LIMITS.link || !isHttpsUrl(value))) {
      issues.push({ field, message: "El enlace debe empezar con https:// y ser una dirección válida." });
    }
    return value;
  };
  const details = {
    displayName,
    school: text("school", PROFILE_LIMITS.school),
    bio: text("bio", PROFILE_LIMITS.bio),
    github: link("github"),
    linkedin: link("linkedin"),
  };
  if (issues.length) throw new ValidationFailure(issues);
  return details;
}
