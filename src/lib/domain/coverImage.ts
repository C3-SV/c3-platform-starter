/** Cover image by link for experiences and challenges. Pure rules shared by validation, public reads and next.config. */

/** Only C3 sites (and their subdomains): visitors never load images from third parties. */
export const COVER_IMAGE_HOSTS: readonly string[] = ["c3.com.sv"];
export const COVER_IMAGE_URL_MAX = 500;
export const COVER_IMAGE_ALT_MIN = 5;
export const COVER_IMAGE_ALT_MAX = 160;

export interface CoverImage {
  url: string;
  alt: string;
}

/** Stored shape: two flat fields on the experience or challenge document, like sourceUrl. */
export interface CoverImageFields {
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
}

export interface CoverIssue {
  field: "coverImageUrl" | "coverImageAlt";
  message: string;
}

export function isAllowedCoverHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return COVER_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export function isAllowedCoverUrl(value: string): boolean {
  if (value.length > COVER_IMAGE_URL_MAX) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port && isAllowedCoverHost(parsed.hostname);
  } catch {
    return false;
  }
}

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates the cover fields of a create or edit request. An empty link means no cover, and then the
 * description is ignored. Returns the values to store plus the issues, so callers merge them with their own.
 */
export function parseCoverFields(raw: Record<string, unknown>): { cover: Required<CoverImageFields>; issues: CoverIssue[] } {
  const url = trimmed(raw.coverImageUrl);
  const alt = trimmed(raw.coverImageAlt);
  const issues: CoverIssue[] = [];
  if (!url) return { cover: { coverImageUrl: null, coverImageAlt: null }, issues };
  if (url.length > COVER_IMAGE_URL_MAX) {
    issues.push({ field: "coverImageUrl", message: `Portada: el enlace no puede superar ${COVER_IMAGE_URL_MAX} caracteres.` });
  } else if (!isAllowedCoverUrl(url)) {
    issues.push({ field: "coverImageUrl", message: "Portada: usa una imagen publicada en un sitio de C3 (c3.com.sv o sus subdominios), con https://." });
  }
  if (alt.length < COVER_IMAGE_ALT_MIN) {
    issues.push({ field: "coverImageAlt", message: `Descripción de la imagen: escribe al menos ${COVER_IMAGE_ALT_MIN} caracteres.` });
  } else if (alt.length > COVER_IMAGE_ALT_MAX) {
    issues.push({ field: "coverImageAlt", message: `Descripción de la imagen: no puede superar ${COVER_IMAGE_ALT_MAX} caracteres.` });
  }
  return { cover: { coverImageUrl: url, coverImageAlt: alt }, issues };
}

/** Public read of a stored cover. Anything invalid (old data, a host removed from the list) is dropped instead of shown. */
export function coverOf(source: CoverImageFields | null | undefined): CoverImage | null {
  const url = trimmed(source?.coverImageUrl);
  const alt = trimmed(source?.coverImageAlt);
  if (!url || !isAllowedCoverUrl(url)) return null;
  if (alt.length < COVER_IMAGE_ALT_MIN || alt.length > COVER_IMAGE_ALT_MAX) return null;
  return { url, alt };
}

/** A challenge without its own cover shows its experience's. */
export function challengeCoverOf(challenge: CoverImageFields | null | undefined, experience: CoverImageFields | null | undefined): CoverImage | null {
  return coverOf(challenge) ?? coverOf(experience);
}

/** Patterns for next/image, so the platform fetches and serves only allowed hosts. */
export function coverRemotePatterns(): { protocol: "https"; hostname: string; pathname: string }[] {
  return COVER_IMAGE_HOSTS.flatMap((host) => [
    { protocol: "https" as const, hostname: host, pathname: "/**" },
    { protocol: "https" as const, hostname: `**.${host}`, pathname: "/**" },
  ]);
}
