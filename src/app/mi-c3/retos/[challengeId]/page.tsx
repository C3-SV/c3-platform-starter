import { EntregaPanel } from "./EntregaPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi challenge y entrega" };

/** V07 · Mi challenge y entrega. */
export default async function EntregaPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return <EntregaPanel challengeId={challengeId} />;
}
