import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { requestContact } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Solicita contacto con una persona de la lista corta. Queda esperando su consentimiento. */
export function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const contact = await requestContact(database(), actor, challengeId, body, new Date());
    return Response.json({ contact }, { status: 201 });
  });
}
