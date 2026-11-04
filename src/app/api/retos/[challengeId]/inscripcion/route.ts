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
    // La inscripción exige confirmar la elegibilidad y aceptar las reglas; el servidor registra cuándo.
    const consent = { eligibility: body?.confirmedEligibility, rules: body?.acceptedRules };
    const enrollment = await enrollInChallenge(database(), actor, challengeId, body?.mode, new Date(), consent);
    return Response.json({ enrollment }, { status: 201 });
  });
}
