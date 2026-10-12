import { HttpError } from "./errors.ts";

/** Datos del token de Firebase ya verificado por el servidor. */
export interface VerifiedToken {
  uid: string;
  email?: string;
  c3Admin?: boolean;
}

export type TokenVerifier = (idToken: string) => Promise<VerifiedToken>;

/** Quien ejecuta una acción de servidor. Solo se construye desde un token verificado. */
export interface Actor {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

export function bearerToken(header: string | null): string {
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "sin_sesion", "Iniciá sesión para continuar.");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new HttpError(401, "sin_sesion", "Iniciá sesión para continuar.");
  return token;
}

/** Verifica identidad. Los permisos de cada recurso se comprueban después, en cada servicio. */
export async function authenticate(request: Request, verify: TokenVerifier): Promise<Actor> {
  const token = bearerToken(request.headers.get("authorization"));
  let decoded: VerifiedToken;
  try {
    decoded = await verify(token);
  } catch {
    throw new HttpError(401, "sesion_invalida", "Tu sesión venció o no es válida. Volvé a entrar.");
  }
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    isAdmin: decoded.c3Admin === true,
  };
}

export function requireAdmin(actor: Actor): void {
  if (!actor.isAdmin) {
    throw new HttpError(403, "sin_permiso", "Esta acción es solo para el equipo administrador de C3.");
  }
}
