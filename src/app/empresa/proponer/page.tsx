import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { ProponerForm } from "./ProponerForm";

export const metadata: Metadata = { title: "Proponer un challenge" };

const NEXT_STEPS = [
  { title: "C3 revisa tu propuesta", text: "Vemos si el problema se puede convertir en un challenge resoluble.", icon: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "m20 20-3.5-3.5"] },
  { title: "Definimos el challenge juntos", text: "Alcance, entregables, rúbrica y fechas.", icon: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"] },
  { title: "Equipos entregan soluciones", text: "Las ves en tu espacio de empresa, lado a lado.", icon: ["M12 15V3M7 8l5-5 5 5", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"] },
  { title: "Evalúas y C3 publica", text: "Calificas con la rúbrica y C3 publica el resultado oficial.", icon: ["M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", "M15.5 13 17 22l-5-3-5 3 1.5-9"] },
];

/** Proposal page (V10). Public, no account needed. */
export default function ProponerPage() {
  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-page-head">
          <div className="c3-frame">
            <div className="c3-page-head__text">
              <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Conecta · Para empresas</span>
              <h1>Cuéntanos qué quieres descubrir en tu <em>próximo challenge</em></h1>
              <p>
                No necesitas un brief perfecto. Cuéntanos qué necesita explorar tu equipo (un problema técnico, una iniciativa propia o una forma de identificar talento)
                y C3 te ayuda a convertirlo en un challenge evaluable. No envíes datos personales sensibles ni información confidencial de clientes.
              </p>
            </div>
          </div>
        </section>

        <div className="c3-frame c3-columns">
          <ProponerForm />
          <aside className="c3-detail__aside" aria-label="Qué pasa después">
            <div className="c3-side-card">
              <span className="c3-eyebrow">Qué pasa después</span>
              <ol className="c3-steps c3-steps--vertical">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step.title} className="c3-step">
                    <span className="c3-step__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {step.icon.map((d) => <path key={d} d={d} />)}
                      </svg>
                    </span>
                    <span className="c3-step__body">
                      <span className="c3-step__number">Paso {index + 1}</span>
                      <b>{step.title}</b>
                      <span className="c3-step__text">{step.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="c3-divider" />
              <p className="c3-no-account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
                </svg>
                <span><b>No necesitas cuenta para proponer.</b> Creas una después, cuando quieras seguir tus challenges y evaluar soluciones.</span>
              </p>
            </div>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
