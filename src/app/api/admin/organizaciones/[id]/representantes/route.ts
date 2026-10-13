import { getAdminAuth } from "@/lib/firebase/admin";
import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { linkRepresentative } from "@/lib/server/companies";

export const dynamic = "force-dynamic";

/** Vincula una cuenta existente como representante, por correo. Solo C3. */
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const actor = await requestActor(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    await linkRepresentative(database(), getAdminAuth(), actor, id, body?.email, new Date());
    return Response.json({ ok: true }, { status: 201 });
  });
}
