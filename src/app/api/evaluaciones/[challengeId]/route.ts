import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { evaluationWorkspace } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Espacio de evaluación de un challenge asignado: soluciones anónimas, rúbrica y mis evaluaciones. */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    return Response.json({ workspace: await evaluationWorkspace(database(), actor, challengeId, new Date()) });
  });
}
