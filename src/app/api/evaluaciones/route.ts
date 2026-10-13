import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { myAssignments } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Retos que me asignaron como jurado. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ assignments: await myAssignments(database(), actor, new Date()) });
  });
}
