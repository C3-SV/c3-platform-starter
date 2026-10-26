import { EvaluadorPanel } from "@/components/EvaluadorPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Evaluar" };

/** Evaluación de un reto asignado, desde Mi C3 (jurado externo). */
export default async function EvaluarMovilPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return <EvaluadorPanel challengeId={challengeId} variant="movil" />;
}
