import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { listMyEnrollments } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Mi C3: inscripciones y entregas de la persona autenticada. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const enrollments = await listMyEnrollments(database(), actor, new Date());
    return Response.json({ enrollments });
  });
}
