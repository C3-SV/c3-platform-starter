import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getTalentBoard } from "@/lib/server/talent";

export const dynamic = "force-dynamic";

/** Tablero de talento del challenge: solo la empresa vinculada (o admin) y solo entregas enviadas. */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    return Response.json({ board: await getTalentBoard(database(), actor, challengeId) });
  });
}
