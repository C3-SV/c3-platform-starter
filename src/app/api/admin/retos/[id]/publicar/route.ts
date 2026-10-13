import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { publishResults } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Publicación oficial por C3. Bloqueada hasta que cada solución tenga dos evaluaciones finalizadas. */
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    await publishResults(database(), actor, id, body, new Date());
    return Response.json({ ok: true });
  });
}
