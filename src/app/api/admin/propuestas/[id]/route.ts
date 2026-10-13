import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { reviewProposal } from "@/lib/server/proposals";

export const dynamic = "force-dynamic";

/** Revisión de C3: pedir ajustes, aceptar (con organización opcional) o no priorizar. */
export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const proposal = await reviewProposal(database(), actor, id, body, new Date());
    return Response.json({ proposal });
  });
}
