import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { setExperienceStatus, updateExperience } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** Cambio de estado (borrador, publicada, concluida, cancelada) con transiciones validadas. Solo administradores. */
export function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const experience = await setExperienceStatus(database(), actor, id, body, new Date());
    return Response.json({ experience });
  });
}

/** Edición de los datos de la experiencia. Solo administradores. */
export function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const experience = await updateExperience(database(), actor, id, body, new Date());
    return Response.json({ experience });
  });
}
