import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { saveProfileDetails } from "@/lib/server/profile";

export const dynamic = "force-dynamic";

/** Guarda lo que la persona declara de sí misma: nombre, centro de estudio, presentación y enlaces. */
export function PUT(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const body = await request.json().catch(() => ({}));
    const profile = await saveProfileDetails(database(), actor, body, new Date());
    return Response.json({ profile });
  });
}
