import { getAdminAuth } from "@/lib/firebase/admin";
import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { assignJudge, listJudges } from "@/lib/server/evaluation";

export const dynamic = "force-dynamic";

/** Jurados asignados a un challenge. Solo C3. */
export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    return Response.json({ judges: await listJudges(database(), actor, id) });
  });
}

/** Asigna un jurado por correo: externo o representante de la empresa. */
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    await assignJudge(database(), getAdminAuth(), actor, id, body?.email, body?.kind, new Date());
    return Response.json({ ok: true }, { status: 201 });
  });
}
