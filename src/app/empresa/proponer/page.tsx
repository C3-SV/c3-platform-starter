import { SiteShell } from "@/components/SiteShell";
import { ProponerForm } from "./ProponerForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Proponer un challenge" };

/** V10 · Proponer challenge. Pública y sin cuenta. */
export default function ProponerPage() {
  return (
    <SiteShell>
      <main id="contenido" className="c3-page c3-ancho" style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start", padding: "clamp(16px, 4vw, 48px)" }}>
        <div style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Conecta · Para empresas</span>
            <h1 className="c3-titulo" style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 700 }}>Contanos el problema técnico de tu equipo</h1>
            <p style={{ maxWidth: 640, fontSize: 18, lineHeight: 1.6, color: "var(--c3-texto-suave)" }}>
              No necesitás un brief perfecto. Describí la situación con tus palabras y C3 te ayuda a convertirla en un challenge que equipos jóvenes puedan resolver.
            </p>
          </div>
          <ProponerForm />
        </div>

        <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Qué pasa después</span>
            {[
              ["C3 revisa tu propuesta", "Vemos si el problema se puede convertir en un challenge resoluble."],
              ["Definimos el challenge juntos", "Alcance, entregables, rúbrica y fechas."],
              ["Equipos entregan soluciones", "Las ves en tu espacio de empresa, lado a lado."],
              ["Evaluás y C3 publica", "Calificás con la rúbrica y C3 publica el resultado oficial."],
            ].map(([title, text], index) => (
              <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--c3-conecta)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{index + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{text}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--c3-superficie-sutil)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>No necesitás cuenta para proponer</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Creás una después, cuando quieras seguir tus challenges y evaluar soluciones.</span>
          </div>
        </aside>
      </main>
    </SiteShell>
  );
}
