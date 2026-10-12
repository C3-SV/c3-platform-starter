import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { joinTeamByCode } from "@/lib/server/teams";

export const dynamic = "force-dynamic";

/** Unirse a un equipo con su código. Requiere inscripción por equipo aprobada. */
export function POST(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const body = await request.json().catch(() => ({}));
    const team = await joinTeamByCode(database(), actor, body?.code, new Date());
    return Response.json({ team });
  });
}
