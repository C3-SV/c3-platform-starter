import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { setExperienceRegistration } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** Abrir o cerrar las inscripciones de una experiencia publicada: { action: "open" | "close", registrationClosesAt? }. Solo administradores. */
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const experience = await setExperienceRegistration(database(), actor, id, body, new Date());
    return Response.json({ experience });
  });
}
