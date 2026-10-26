import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getMyPublicProfile, savePublicProfile } from "@/lib/server/publicProfiles";

export const dynamic = "force-dynamic";

/** Configuración del perfil público de la persona autenticada (privado por defecto). Solo la propia. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ publicProfile: await getMyPublicProfile(database(), actor) });
  });
}

/** Activa, desactiva o ajusta qué se comparte. El uid sale del token verificado, nunca del cuerpo de la petición. */
export function PUT(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const body = await request.json().catch(() => ({}));
    return Response.json({ publicProfile: await savePublicProfile(database(), actor, body, new Date()) });
  });
}
