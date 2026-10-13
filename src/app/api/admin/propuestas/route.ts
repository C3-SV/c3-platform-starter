import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { listProposals } from "@/lib/server/proposals";

export const dynamic = "force-dynamic";

/** Propuestas de empresa para la revisión de C3. Solo administradores. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ proposals: await listProposals(database(), actor) });
  });
}
