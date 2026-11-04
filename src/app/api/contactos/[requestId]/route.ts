import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { answerContactRequest } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Acepto, declino o revoco el permiso de una solicitud propia. */
export function PATCH(request: Request, context: { params: Promise<{ requestId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { requestId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const contact = await answerContactRequest(database(), actor, requestId, body, new Date());
    return Response.json({ contact });
  });
}
