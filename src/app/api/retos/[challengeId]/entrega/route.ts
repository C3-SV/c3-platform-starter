import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getDelivery, saveDelivery } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Estado de mi entrega en el challenge. Solo muestra datos de la persona autenticada. */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const delivery = await getDelivery(database(), actor, challengeId, new Date());
    return Response.json({ delivery });
  });
}

/** Guarda borrador o envía la entrega dentro del plazo. */
export function PUT(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const delivery = await saveDelivery(database(), actor, challengeId, body, new Date());
    return Response.json({ delivery });
  });
}
