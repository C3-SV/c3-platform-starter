import type { Metadata } from "next";
import { NotFoundActions } from "@/components/NotFoundActions";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = { title: "No encontramos esta página" };

/** 404 con la cabecera y el pie del sitio: la persona no queda sin camino de vuelta. */
export default function NotFound() {
  return (
    <SiteShell>
      <main id="contenido" className="c3-page" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Error 404</span>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>No encontramos esta página</h1>
        <p style={{ color: "var(--c3-texto-suave)" }}>Puede que el challenge haya sido retirado o que la dirección esté mal escrita.</p>
        <NotFoundActions />
      </main>
    </SiteShell>
  );
}
