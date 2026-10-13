import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { getCompanySpace } from "@/lib/server/companies";

export const dynamic = "force-dynamic";

/** Espacio de empresa: solo organizaciones vinculadas a la persona autenticada. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ space: await getCompanySpace(database(), actor, new Date()) });
  });
}
