import { getClientAuth } from "../firebase/client.ts";

export interface FieldIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: FieldIssue[];

  constructor(status: number, code: string, message: string, issues: FieldIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

/** Llama a una ruta de la API adjuntando el token de la sesión actual. Lanza ApiError si falla. */
export async function apiRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const user = getClientAuth().currentUser;
  if (!user) throw new ApiError(401, "sin_sesion", "Iniciá sesión para continuar.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "error",
      payload?.error?.message ?? "No pudimos completar la operación. Intentá de nuevo.",
      payload?.error?.issues ?? [],
    );
  }
  return payload as T;
}
