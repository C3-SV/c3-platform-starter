import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { listEnrollmentsForChallenge, listEnrollmentsForExperience } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/**
 * Inscripciones para la revisión de C3. Con ?challengeId= devuelve las de un reto; con ?experienceId=
 * devuelve todas las de la experiencia (con o sin reto) y su ocupación de cupos. Solo administradores.
 */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const params = new URL(request.url).searchParams;
    const experienceId = params.get("experienceId");
    if (experienceId) {
      return Response.json(await listEnrollmentsForExperience(database(), actor, experienceId));
    }
    const enrollments = await listEnrollmentsForChallenge(database(), actor, params.get("challengeId") ?? "");
    return Response.json({ enrollments });
  });
}
