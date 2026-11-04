import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { listMyContactRequests } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Solicitudes de contacto que recibí de empresas. Solo las mías. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ contacts: await listMyContactRequests(database(), actor) });
  });
}
