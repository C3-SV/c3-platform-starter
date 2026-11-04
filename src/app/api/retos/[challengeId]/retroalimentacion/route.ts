import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getMyFeedback } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Mi retroalimentación publicada en el challenge. Un borrador de la empresa no se devuelve. */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    return Response.json({ feedback: await getMyFeedback(database(), actor, challengeId) });
  });
}
