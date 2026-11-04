import { getChallengeConfig, updateChallengeConfig } from "@/lib/server/challengeConfig";
import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

/** Configuración del challenge: solo la empresa vinculada (o C3). */
export function GET(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    return Response.json({ config: await getChallengeConfig(database(), actor, challengeId) });
  });
}

/** Edita resumen, problema, entregables, rúbrica (mientras no haya entregas) y cierre de entregas. */
export function PATCH(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { challengeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    return Response.json({ config: await updateChallengeConfig(database(), actor, challengeId, body, new Date()) });
  });
}
