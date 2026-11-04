import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { saveFeedback } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** La empresa guarda la retroalimentación de una entrega y decide si la persona la ve. */
export function PUT(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const feedback = await saveFeedback(database(), actor, challengeId, body, new Date());
    return Response.json({ feedback });
  });
}
