import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AccesoPanel } from "./AccesoPanel";

/** V04 · Acceso. Entrar, crear cuenta y recuperar contraseña con Firebase Authentication. */
export default function AccesoPage() {
  return (
    <div>
      <SiteHeader variant="minima" />
      <main className="c3-page" style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 48px)" }}>
        <Suspense fallback={<p style={{ color: "var(--c3-texto-suave)" }}>Cargando…</p>}>
          <AccesoPanel />
        </Suspense>
      </main>
    </div>
  );
}
