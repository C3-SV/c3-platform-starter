import { EvaluadorPanel } from "@/components/EvaluadorPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Evaluar" };

/** Evaluación de un challenge asignado (jurado externo o representante de la empresa). Es la dirección canónica de la evaluación. */
export default async function EvaluarMovilPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  return <EvaluadorPanel challengeId={challengeId} />;
}
