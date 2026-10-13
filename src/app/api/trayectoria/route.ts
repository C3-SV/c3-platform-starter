import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { ensureProfile } from "@/lib/server/profile";
import { listMyEnrollments } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Perfil autodeclarado y trayectoria registrada por C3 (inscripciones, entregas y resultados publicados). */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const now = new Date();
    const profile = await ensureProfile(database(), actor, now);
    const enrollments = await listMyEnrollments(database(), actor, now);
    return Response.json({ profile, enrollments });
  });
}
