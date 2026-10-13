import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { revokeJudge } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Revoca el acceso de un jurado. Sus evaluaciones finalizadas se conservan. */
export function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    await revokeJudge(database(), actor, id, new Date());
    return Response.json({ ok: true });
  });
}
