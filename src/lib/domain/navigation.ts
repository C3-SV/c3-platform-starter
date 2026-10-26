/**
 * Reglas puras de navegación: a dónde se vuelve después de entrar y cuál es la dirección de cada tarea.
 * No consultan la sesión ni Firebase; la autorización de cada destino sigue en el servidor.
 */

/** Destino tras iniciar sesión cuando la persona no venía de ninguna ruta concreta. */
export const AFTER_LOGIN_PATH = "/mi-c3";

const MAX_NEXT_LENGTH = 512;
const ACCESS_PATH = /^\/acceso(?:[/?#]|$)/;
// Espacios, controles y barras invertidas: los navegadores los normalizan y pueden convertir la ruta en otro sitio.
const FORBIDDEN_CHARS = /[\u0000- \u007f\\]/;

/**
 * Acepta solo rutas internas del propio sitio (parámetro `next`). Cualquier otra cosa —dirección externa,
 * ruta con `//` o `\`, controles, demasiado larga, o la propia pantalla de acceso— se cambia por `fallback`.
 */
export function safeNext(value: string | null | undefined, fallback: string = AFTER_LOGIN_PATH): string {
  if (!value || value.length > MAX_NEXT_LENGTH) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (FORBIDDEN_CHARS.test(value)) return fallback;
  if (ACCESS_PATH.test(value)) return fallback;
  return value;
}

/**
 * Enlace a la pantalla de acceso. `next` se incluye solo si es una ruta interna que aporta algo: la Home y el
 * propio acceso no se recuerdan, porque sin destino la persona llega a Mi C3.
 */
export function loginHref(options: { next?: string | null; mode?: "registro" } = {}): string {
  const params = new URLSearchParams();
  if (options.mode) params.set("modo", options.mode);
  const next = options.next ? safeNext(options.next, "") : "";
  if (next && next !== "/") params.set("next", next);
  const query = params.toString();
  return query ? `/acceso?${query}` : "/acceso";
}

/** Dirección canónica de la evaluación de un challenge, para jurado externo y para representantes de empresa. */
export function evaluationHref(challengeId: string): string {
  return `/mi-c3/evaluar/${encodeURIComponent(challengeId)}`;
}
