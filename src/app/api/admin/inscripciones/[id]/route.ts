import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { reviewEnrollment } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Aprobar o rechazar una inscripción pendiente. Solo administradores. */
export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    await reviewEnrollment(database(), actor, id, body?.status, new Date());
    return Response.json({ ok: true });
  });
}
