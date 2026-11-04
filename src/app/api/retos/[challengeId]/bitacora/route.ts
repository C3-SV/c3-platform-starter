import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { addCheckpoint, listMyCheckpoints } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Mi bitácora en el challenge. Solo muestra datos de la persona autenticada. */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    return Response.json({ checkpoints: await listMyCheckpoints(database(), actor, challengeId) });
  });
}

/** Agrega un avance a la bitácora mientras el plazo de entregas esté abierto. */
export function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const checkpoint = await addCheckpoint(database(), actor, challengeId, body, new Date());
    return Response.json({ checkpoint }, { status: 201 });
  });
}
