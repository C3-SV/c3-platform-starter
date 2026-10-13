import { clientKeyOf, database } from "@/lib/server/context";
import { respond } from "@/lib/server/errors";
import { submitProposal } from "@/lib/server/proposals";

export const dynamic = "force-dynamic";

/** Propuesta pública de empresa. No requiere cuenta; el servidor valida y limita las altas por conexión. */
export function POST(request: Request) {
  return respond(async () => {
    const body = await request.json().catch(() => ({}));
    const proposal = await submitProposal(database(), body, clientKeyOf(request), new Date());
    return Response.json({ proposal }, { status: 201 });
  });
}
