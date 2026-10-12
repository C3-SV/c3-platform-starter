import type { PresentedState } from "@/lib/domain/presentation";

/** Estado visible con texto y tono de la guía de estilo. Nunca se muestra solo con color. */
export function StatePill({ state }: { state: PresentedState }) {
  return <span className={`c3-pill c3-pill--${state.tone}`}>{state.label}</span>;
}
