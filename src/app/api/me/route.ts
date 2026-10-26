import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getCapabilities } from "@/lib/server/capabilities";
import { ensureProfile, saveDisplayName } from "@/lib/server/profile";

export const dynamic = "force-dynamic";

/**
 * Perfil y capacidades de la persona autenticada. Crea el documento la primera vez. Las capacidades (espacio
 * de empresa, evaluación, administración) son SOLO las propias, calculadas con el uid del token verificado:
 * la interfaz las usa para mostrar accesos, no para autorizar.
 */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const now = new Date();
    const profile = await ensureProfile(database(), actor, now);
    const capabilities = await getCapabilities(database(), actor);
    return Response.json({ profile, capabilities });
  });
}

/** Guarda el nombre completo tras crear la cuenta. */
export function PUT(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const body = await request.json().catch(() => ({}));
    const profile = await saveDisplayName(database(), actor, body?.displayName, new Date());
    return Response.json({ profile });
  });
}
