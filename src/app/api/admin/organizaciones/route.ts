import { database, requestActor } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { createOrganization, listOrganizations } from "@/lib/server/companies";

export const dynamic = "force-dynamic";

/** Organizaciones empresariales. Solo administradores. */
export function GET(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    return Response.json({ organizations: await listOrganizations(database(), actor) });
  });
}

export function POST(request: Request) {
  return respond(async () => {
    const actor = await requestActor(request);
    const body = await request.json().catch(() => ({}));
    const organization = await createOrganization(database(), actor, body?.name, new Date());
    return Response.json({ organization }, { status: 201 });
  });
}
