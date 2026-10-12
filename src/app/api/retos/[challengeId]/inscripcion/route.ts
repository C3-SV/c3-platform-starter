import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { enrollIndividual } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Inscripción individual al reto. El servidor decide la elegibilidad: el cliente no se la asigna. */
export function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const enrollment = await enrollIndividual(database(), actor, challengeId, new Date());
    return Response.json({ enrollment }, { status: 201 });
  });
}
