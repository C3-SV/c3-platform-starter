import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { ensureProfile, saveDisplayName } from "@/lib/server/profile";

export const dynamic = "force-dynamic";

/** Perfil de la persona autenticada. Crea el documento la primera vez. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const profile = await ensureProfile(database(), actor, new Date());
    return Response.json({ profile });
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
