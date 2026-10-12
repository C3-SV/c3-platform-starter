import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { setExperienceStatus } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const experience = await setExperienceStatus(database(), actor, id, body, new Date());
    return Response.json({ experience });
  });
}
