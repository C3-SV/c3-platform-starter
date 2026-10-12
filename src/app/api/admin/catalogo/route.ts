import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { listAdminCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** Experiencias y retos, incluidos borradores. Solo administradores. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json(await listAdminCatalog(database(), actor));
  });
}
