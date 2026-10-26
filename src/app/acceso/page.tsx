import { Suspense } from "react";
import { SiteShell } from "@/components/SiteShell";
import { AccesoPanel } from "./AccesoPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Entrar o crear cuenta" };

/** V04 · Acceso. Entrar, crear cuenta y recuperar contraseña con Firebase Authentication. */
export default function AccesoPage() {
  return (
    <SiteShell header="minima">
      <main id="contenido" className="c3-page c3-ancho" style={{ display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 48px)" }}>
        <Suspense fallback={<p style={{ color: "var(--c3-texto-suave)" }}>Cargando…</p>}>
          <AccesoPanel />
        </Suspense>
      </main>
    </SiteShell>
  );
}
