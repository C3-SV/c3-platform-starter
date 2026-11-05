import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { catalogCards } from "@/components/catalogCardData";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";
import { FiltrosExplorar } from "./FiltrosExplorar";

export const metadata: Metadata = { title: "Explorar challenges" };

export const dynamic = "force-dynamic";

const LEGEND = [
  { line: "compite", label: "Compite · competencias" },
  { line: "crea", label: "Crea · hackathons" },
  { line: "conecta", label: "Conecta · challenges empresariales" },
] as const;

/** Catalog (V02). The server sends the public catalog; type, line, state and demo filters run in the browser. */
export default async function ExplorarPage() {
  const catalog = await listPublicCatalog(database(), new Date());
  const cards = catalogCards(catalog);

  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-page-head">
          <div className="c3-frame">
            <div className="c3-page-head__text">
              <span className="c3-eyebrow">Catálogo</span>
              <h1>Explora experiencias de C3</h1>
              <p>Challenges reales de empresas, competencias y hackathons de C3. Las que tienen inscripción abierta te dejan participar desde aquí.</p>
              <div className="c3-legend" aria-label="Leyenda de colores">
                {LEGEND.map((item) => (
                  <span key={item.line}><span className={`c3-dot c3-dot--${item.line}`} aria-hidden="true" />{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="c3-catalog">
          <div className="c3-frame">
            {cards.length === 0 ? (
              <p className="c3-empty-card">Todavía no hay experiencias publicadas. Vuelve pronto.</p>
            ) : (
              <FiltrosExplorar cards={cards} />
            )}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
