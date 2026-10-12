import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { setChallengeStatus } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const challenge = await setChallengeStatus(database(), actor, id, body, new Date());
    return Response.json({ challenge });
  });
}
