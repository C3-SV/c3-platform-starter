import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { manageTeam, type TeamAction } from "@/lib/server/teams";

export const dynamic = "force-dynamic";

const ACTIONS: readonly TeamAction[] = ["salir", "quitar", "transferir", "disolver"];

/** Acciones de integrantes sobre su equipo: salir, quitar, transferir liderazgo o disolver. */
export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = ACTIONS.find((item) => item === body?.action);
    if (!action) {
      return Response.json({ error: { code: "accion_no_valida", message: "Acción no válida para el equipo." } }, { status: 400 });
    }
    await manageTeam(database(), actor, id, action, body?.userId, new Date());
    return Response.json({ ok: true });
  });
}
