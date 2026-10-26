/**
 * Perfil público compartible (opt-in). Reglas PURAS: qué datos pueden mostrarse, cómo se arma la dirección y qué se
 * filtra. Es la barrera de privacidad del perfil: la vista pública se construye SOLO con `buildPublicView`, a partir de
 * datos ya elegidos por la persona; correo, identificador interno, inscripciones sin aprobar, borradores, notas,
 * promedios y entregas nunca entran.
 */
import { ValidationFailure } from "./validation.ts";

/** Qué comparte la persona además de su nombre (que es lo que da sentido al perfil). */
export interface PublicProfileShow {
  school: boolean;
  bio: boolean;
  links: boolean;
  trajectory: boolean;
}

/**
 * Valores al activar por primera vez. El centro de estudio empieza oculto: junto al nombre puede ubicar a una persona
 * menor de edad, así que compartirlo es una decisión explícita. Lo demás es lo que un perfil compartible suele mostrar.
 */
export const DEFAULT_SHOW: PublicProfileShow = { school: false, bio: true, links: true, trajectory: true };

export interface PublicProfileSettings {
  enabled: boolean;
  /** Parte final de la dirección pública (`/personas/[slug]`). Null mientras nunca se activó. */
  slug: string | null;
  show: PublicProfileShow;
}

export const NO_PUBLIC_PROFILE: PublicProfileSettings = { enabled: false, slug: null, show: DEFAULT_SHOW };

export interface PublicProfileInput {
  enabled: boolean;
  show: PublicProfileShow;
}

const SHOW_KEYS = ["school", "bio", "links", "trajectory"] as const;

/** Valida lo que envía la persona: solo booleanos conocidos. Cualquier otro campo se ignora. */
export function parsePublicProfileInput(input: unknown): PublicProfileInput {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  if (typeof raw.enabled !== "boolean") {
    throw new ValidationFailure([{ field: "enabled", message: "Indicá si querés activar o desactivar tu perfil público." }]);
  }
  const show = typeof raw.show === "object" && raw.show !== null ? (raw.show as Record<string, unknown>) : {};
  const parsed = { ...DEFAULT_SHOW };
  for (const key of SHOW_KEYS) {
    if (show[key] === undefined) continue;
    if (typeof show[key] !== "boolean") {
      throw new ValidationFailure([{ field: `show.${key}`, message: "Elegí si compartís o no este dato." }]);
    }
    parsed[key] = show[key] as boolean;
  }
  return { enabled: raw.enabled, show: parsed };
}

/** Lee la configuración guardada en el documento de la persona; cualquier forma inesperada equivale a «privado». */
export function settingsFromStored(stored: unknown): PublicProfileSettings {
  if (typeof stored !== "object" || stored === null) return NO_PUBLIC_PROFILE;
  const raw = stored as Record<string, unknown>;
  const slug = typeof raw.slug === "string" && isValidSlug(raw.slug) ? raw.slug : null;
  const show = typeof raw.show === "object" && raw.show !== null ? (raw.show as Record<string, unknown>) : {};
  return {
    // Sin dirección válida no hay perfil público, aunque «enabled» diga otra cosa.
    enabled: raw.enabled === true && slug !== null,
    slug,
    show: {
      school: show.school === true,
      bio: show.bio === true,
      links: show.links === true,
      trajectory: show.trajectory === true,
    },
  };
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 48;
const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function isValidSlug(value: string): boolean {
  return value.length >= 6 && value.length <= SLUG_MAX && SLUG_PATTERN.test(value);
}

/** «Lucía Robles de Prueba» → «lucia-robles-de» (hasta 24 caracteres, sin tildes ni símbolos). */
export function slugBase(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = ascii.slice(0, 24).replace(/-+$/g, "");
  return cut || "persona";
}

/**
 * Dirección con el nombre y un sufijo aleatorio: legible al compartirla y imposible de adivinar a partir del nombre.
 * `random` entrega enteros en [0, n) (se inyecta para poder probarlo).
 */
export function generateSlug(name: string, random: (max: number) => number): string {
  let suffix = "";
  for (let index = 0; index < 6; index += 1) suffix += SLUG_ALPHABET[random(SLUG_ALPHABET.length)];
  return `${slugBase(name)}-${suffix}`;
}

/** Ruta pública de un perfil. */
export function publicProfilePath(slug: string): string {
  return `/personas/${slug}`;
}

/** Una participación que la persona puede mostrar: solo inscripciones aprobadas en experiencias y challenges publicados o concluidos. */
export interface PublicParticipation {
  experienceId: string;
  experienceTitle: string;
  challengeId: string | null;
  challengeTitle: string | null;
  line: "compite" | "crea" | "conecta";
  concluded: boolean;
}

export interface PublicRecognition {
  challengeId: string;
  challengeTitle: string;
  recognition: string;
}

/** Datos candidatos que arma el servidor; `buildPublicView` decide cuáles salen. */
export interface PublicProfileSource {
  slug: string;
  displayName: string;
  school: string;
  bio: string;
  github: string;
  linkedin: string;
  show: PublicProfileShow;
  participations: PublicParticipation[];
  recognitions: PublicRecognition[];
}

export interface PublicProfileView {
  slug: string;
  displayName: string;
  school: string | null;
  bio: string | null;
  links: { github: string | null; linkedin: string | null } | null;
  trajectory: { participations: PublicParticipation[]; recognitions: PublicRecognition[] } | null;
}

/**
 * Única función que produce la vista pública. Aplica lo que la persona decidió mostrar; lo no elegido queda en `null`,
 * no solo vacío, para que la página no tenga nada que pintar ni filtrar.
 */
export function buildPublicView(source: PublicProfileSource): PublicProfileView {
  const text = (value: string) => (value.trim() ? value.trim() : null);
  const github = text(source.github);
  const linkedin = text(source.linkedin);
  return {
    slug: source.slug,
    displayName: source.displayName.trim(),
    school: source.show.school ? text(source.school) : null,
    bio: source.show.bio ? text(source.bio) : null,
    links: source.show.links && (github || linkedin) ? { github, linkedin } : null,
    trajectory: source.show.trajectory
      ? { participations: source.participations, recognitions: source.recognitions }
      : null,
  };
}
