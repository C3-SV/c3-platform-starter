import { database, requestActor } from "@/lib/server/context";
import { ValidationFailure } from "@/lib/domain/validation";
import { respond } from "@/lib/server/errors";
import { cancelMyEnrollment } from "@/lib/server/participation";

export const dynamic = "force-dynamic";

/** Cancelación de la propia inscripción. Solo el body { status: "cancelled" } es válido. */
export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    if (body?.status !== "cancelled") {
      throw new ValidationFailure([{ field: "status", message: "Solo podés cancelar tu inscripción." }]);
    }
    await cancelMyEnrollment(database(), actor, id, new Date());
    return Response.json({ ok: true });
  });
}
