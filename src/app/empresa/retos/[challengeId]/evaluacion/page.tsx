import { SiteHeader } from "@/components/SiteHeader";
import { EvaluadorPanel } from "@/components/EvaluadorPanel";

/** V11 · Seguimiento y evaluación para el representante de la empresa autorizado por C3. */
export default async function EvaluacionEmpresaPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return (
    <div>
      <SiteHeader />
      <EvaluadorPanel challengeId={challengeId} variant="escritorio" />
    </div>
  );
}
