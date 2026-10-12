import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { listEnrollmentsForChallenge } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Inscripciones de un reto para la revisión de C3. Solo administradores. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const challengeId = new URL(request.url).searchParams.get("challengeId") ?? "";
    const enrollments = await listEnrollmentsForChallenge(database(), actor, challengeId);
    return Response.json({ enrollments });
  });
}
