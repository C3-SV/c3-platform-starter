import { listAudit } from "@/lib/server/audit";
import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

/** Bitácora de operaciones sensibles. Solo administración C3. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ entries: await listAudit(database(), actor) });
  });
}
