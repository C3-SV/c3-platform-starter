import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { resultsBoard } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Tablero de resultados: soluciones, evaluaciones finalizadas, promedio y condición de publicación. */
export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    return Response.json({ board: await resultsBoard(database(), actor, id) });
  });
}
