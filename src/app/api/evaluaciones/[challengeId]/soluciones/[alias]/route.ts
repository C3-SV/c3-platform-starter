import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { saveEvaluation } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Guarda o finaliza mi evaluación de una solución del challenge (alias «s1», «s2»…). */
export function PUT(request: Request, context: { params: Promise<{ challengeId: string; alias: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId, alias } = await context.params;
    const body = await request.json().catch(() => ({}));
    await saveEvaluation(database(), actor, challengeId, alias, body, new Date());
    return Response.json({ ok: true });
  });
}
