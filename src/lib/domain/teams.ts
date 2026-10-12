/** Reglas PURAS de equipos: códigos C3-XXXX, nombre, tamaño y estado. La autorización vive en el servidor. */
import { ValidationFailure } from "./validation.ts";

/** Sin 0, 1, I, L ni O: el código se dicta y se escribe sin ambigüedad. */
export const TEAM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const TEAM_CODE_PATTERN = /^C3-[23456789A-HJ-KMNP-Z]{4}$/;
export const TEAM_NAME_MIN = 2;
export const TEAM_NAME_MAX = 60;

export type TeamStatus = "incompleto" | "habilitado";
export type TeamRole = "lider" | "integrante";

/** Genera un código C3-XXXX con el generador que reciba (permite pruebas deterministas). */
export function generateTeamCode(random: () => number = Math.random): string {
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += TEAM_CODE_ALPHABET[Math.floor(random() * TEAM_CODE_ALPHABET.length)];
  }
  return `C3-${code}`;
}

/**
 * Normaliza lo que escribe la persona: sin espacios ni guiones, en mayúsculas, con el guion del formato.
 * Acepta «c3-7kq4», «C3 7KQ4» o «C37KQ4». Devuelve null si no es un código válido.
 */
export function normalizeTeamCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const compact = input.replace(/[\s-]+/g, "").toUpperCase();
  if (!/^C3[23456789A-HJ-KMNP-Z]{4}$/.test(compact)) return null;
  const code = `C3-${compact.slice(2)}`;
  return TEAM_CODE_PATTERN.test(code) ? code : null;
}

export function parseTeamName(input: unknown): string {
  const name = typeof input === "string" ? input.trim() : "";
  if (name.length < TEAM_NAME_MIN || name.length > TEAM_NAME_MAX) {
    throw new ValidationFailure([{ field: "name", message: `El nombre del equipo tiene entre ${TEAM_NAME_MIN} y ${TEAM_NAME_MAX} caracteres.` }]);
  }
  return name;
}

/** Un equipo está habilitado cuando alcanza el mínimo de integrantes; antes queda incompleto. */
export function teamStatus(memberCount: number, minSize: number): TeamStatus {
  return memberCount >= minSize ? "habilitado" : "incompleto";
}

/** Tamaño de la membresía del equipo para la leyenda «N de M integrantes · mínimo X». */
export function teamSlotsLabel(memberCount: number, minSize: number, maxSize: number): string {
  return `${memberCount} de ${maxSize} integrantes · mínimo ${minSize}`;
}
