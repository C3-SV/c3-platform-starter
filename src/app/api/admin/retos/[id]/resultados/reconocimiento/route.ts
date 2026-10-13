import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { setRecognition } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Asigna ganador, finalista, mención o ninguno a una solución, antes de publicar. */
export function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    await setRecognition(database(), actor, id, String(body?.submissionId ?? ""), body?.recognition);
    return Response.json({ ok: true });
  });
}
