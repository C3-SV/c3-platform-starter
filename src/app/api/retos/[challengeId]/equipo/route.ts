import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { createTeam, getMyTeamState } from "@/lib/server/teams";

export const dynamic = "force-dynamic";

/** Mi equipo en este reto y lo que puedo hacer con él. */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const state = await getMyTeamState(database(), actor, challengeId, new Date());
    return Response.json({ state });
  });
}

/** Crea un equipo con su código C3-XXXX. La persona queda como líder. */
export function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const team = await createTeam(database(), actor, challengeId, body?.name, new Date());
    return Response.json({ team }, { status: 201 });
  });
}
