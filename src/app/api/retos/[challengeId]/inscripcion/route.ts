import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { enrollInChallenge } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Inscripción al challenge en la modalidad elegida (individual o equipo). El servidor decide la elegibilidad. */
export function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const enrollment = await enrollInChallenge(database(), actor, challengeId, body?.mode, new Date());
    return Response.json({ enrollment }, { status: 201 });
  });
}
