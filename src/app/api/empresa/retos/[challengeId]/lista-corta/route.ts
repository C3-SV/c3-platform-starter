import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { addToShortlist } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Agrega una entrega enviada a la lista corta con su motivo cualitativo. */
export function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    await addToShortlist(database(), actor, challengeId, body, new Date());
    return Response.json({ ok: true }, { status: 201 });
  });
}
