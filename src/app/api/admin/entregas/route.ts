import { listAdminDeliveries } from "@/lib/server/admin";
import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ deliveries: await listAdminDeliveries(database(), actor) });
  });
}
