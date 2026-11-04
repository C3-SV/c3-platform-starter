import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { removeFromShortlist } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Quita una entrega de la lista corta, salvo que haya una solicitud de contacto activa. */
export function DELETE(request: Request, context: { params: Promise<{ challengeId: string; submissionId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId, submissionId } = await context.params;
    await removeFromShortlist(database(), actor, challengeId, submissionId, new Date());
    return Response.json({ ok: true });
  });
}
