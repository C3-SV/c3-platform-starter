import { ValidationFailure, type FieldIssue } from "../domain/validation.ts";

/** Error con estado HTTP y mensaje ya redactado para la persona usuaria (en español). */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function notFound(message = "No encontramos lo que buscabas."): HttpError {
  return new HttpError(404, "no_encontrado", message);
}

/** Convierte cualquier error en una respuesta JSON. Nunca expone trazas ni detalles internos. */
export function errorResponse(error: unknown): Response {
  if (error instanceof ValidationFailure) {
    return Response.json(
      { error: { code: "datos_invalidos", message: error.message, issues: error.issues satisfies FieldIssue[] } },
      { status: 400 },
    );
  }
  if (error instanceof HttpError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error("Error no controlado en API:", error);
  return Response.json(
    { error: { code: "error_interno", message: "No pudimos completar la operación. Intentá de nuevo en unos minutos." } },
    { status: 500 },
  );
}

/** Envuelve un manejador de ruta para devolver siempre JSON con el error redactado. */
export async function respond(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    return errorResponse(error);
  }
}
