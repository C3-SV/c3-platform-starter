import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { enrollInExperience } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Inscripción individual a una experiencia sin retos publicados. El servidor decide la elegibilidad y los cupos. */
export function POST(request: Request, context: { params: Promise<{ experienceId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { experienceId } = await context.params;
    const enrollment = await enrollInExperience(database(), actor, experienceId, new Date());
    return Response.json({ enrollment }, { status: 201 });
  });
}
