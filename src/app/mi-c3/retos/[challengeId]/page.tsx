import { EntregaPanel } from "./EntregaPanel";

/** V07 · Mi reto y entrega. */
export default async function EntregaPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return <EntregaPanel challengeId={challengeId} />;
}
