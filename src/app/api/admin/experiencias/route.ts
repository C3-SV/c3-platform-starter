import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { createExperience } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const body = await request.json().catch(() => ({}));
    const experience = await createExperience(database(), actor, body, new Date());
    return Response.json({ experience }, { status: 201 });
  });
}
