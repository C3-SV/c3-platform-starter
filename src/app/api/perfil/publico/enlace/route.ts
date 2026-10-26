import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { rotatePublicProfileLink } from "@/lib/server/publicProfiles";

export const dynamic = "force-dynamic";

/** Cambia la dirección pública del perfil: el enlace anterior deja de funcionar. Solo la propia persona. */
export function POST(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ publicProfile: await rotatePublicProfileLink(database(), actor, new Date()) });
  });
}
