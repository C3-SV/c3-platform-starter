import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { AccesoPanel } from "./AccesoPanel";

export const metadata: Metadata = { title: "Iniciar sesión o crear cuenta" };

/** Sign in (V04) and, with `?modo=registro`, sign up: one screen each, both with Firebase Authentication. */
export default function AccesoPage() {
  return (
    <SiteShell header="minima">
      <main id="contenido" className="c3-auth">
        <div className="c3-frame c3-auth__column">
          <Suspense fallback={<p className="c3-auth__switch">Cargando…</p>}>
            <AccesoPanel />
          </Suspense>
        </div>
      </main>
    </SiteShell>
  );
}
