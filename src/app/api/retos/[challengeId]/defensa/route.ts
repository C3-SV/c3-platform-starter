import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getMyDefense, saveDefense } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Defensa de mi entrega en el challenge (la de mi equipo, si soy integrante). */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    return Response.json({ defense: await getMyDefense(database(), actor, challengeId) });
  });
}

/** Registra o actualiza la defensa. Solo con la entrega enviada; en equipo, solo la líder. */
export function PUT(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const defense = await saveDefense(database(), actor, challengeId, body, new Date());
    return Response.json({ defense });
  });
}
