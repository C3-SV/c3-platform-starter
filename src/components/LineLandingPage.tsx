import Link from "next/link";
import type { CSSProperties } from "react";
import { LineBrandMark } from "@/components/BrandMark";
import { CatalogCard } from "@/components/CatalogCard";
import { SiteShell } from "@/components/SiteShell";
import { catalogCards } from "@/components/catalogCardData";
import { LINE_LANDING } from "@/lib/content/lineLanding";
import { experienceLinesOf } from "@/lib/domain/catalog";
import { lineColorOf, lineTextColorOf } from "@/lib/domain/presentation";
import type { ExperienceLine } from "@/lib/domain/types";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

const LINE_TINT: Record<ExperienceLine, string> = {
  compite: "#f3f6fc",
  crea: "#f1faf8",
  conecta: "#f4f5fb",
};

/** Shared template for the Compite, Crea and Conecta pages; the accent follows the line. */
export async function LineLandingPage({ line }: { line: ExperienceLine }) {
  const content = LINE_LANDING[line];
  const catalog = await listPublicCatalog(database(), new Date());
  const items = catalog.filter((item) => experienceLinesOf(item.experience).includes(line));
  const active = catalogCards(items.filter((item) => item.experience.status !== "closed" && item.experience.status !== "cancelled"), { pageLine: line });
  const historical = catalogCards(items.filter((item) => item.experience.status === "closed"), { pageLine: line });
  const accent = {
    "--c3-line-accent": lineColorOf(line),
    "--c3-line-text": lineTextColorOf(line),
    "--c3-line-tint": LINE_TINT[line],
  } as CSSProperties;

  return (
    <SiteShell>
      <main id="contenido" style={accent}>
        <section className="c3-line-intro">
          <div className="c3-frame c3-hero__grid">
            <div className="c3-hero__text">
              <span className="c3-etiqueta">{content.eyebrow}</span>
              <h1><span className="c3-line-intro__dot" aria-hidden="true" />{content.title}</h1>
              <p className="c3-lead">{content.intro}</p>
              <div className="c3-actions">
                <Link href={content.ctaHref} className="c3-btn c3-btn--primario">{content.ctaLabel} <span className="c3-arrow" aria-hidden="true">↗</span></Link>
                <Link href="#como-funciona" className="c3-btn c3-btn--contorno">Conocer la línea</Link>
              </div>
            </div>
            <div className="c3-orbit-visual" aria-hidden="true">
              <div className="c3-orbit">
                <span className="c3-orbit__ring c3-orbit__ring--outer" />
                <span className="c3-orbit__ring c3-orbit__ring--inner" />
                <span className="c3-orbit__spin c3-orbit__spin--outer">
                  <span className="c3-orbit__satellite" />
                  <span className="c3-orbit__satellite c3-orbit__satellite--bottom" />
                </span>
                <span className="c3-orbit__spin c3-orbit__spin--inner">
                  <span className="c3-orbit__satellite c3-orbit__satellite--bottom" />
                </span>
                <div className="c3-orbit__mark"><LineBrandMark line={line} decorative eager /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="c3-soft-section">
          <div className="c3-frame c3-two-cards">
            <article className="c3-path-card">
              <div className="c3-path-card__brand"><span className={`c3-dot c3-dot--${line}`} aria-hidden="true" /><span className="c3-etiqueta" style={{ color: "var(--c3-line-text)" }}>La línea</span></div>
              <h2>{content.whatTitle}</h2>
              <p>{content.what}</p>
            </article>
            <article className={`c3-path-card${line === "conecta" ? " c3-path-card--dark" : ""}`}>
              <div className="c3-path-card__brand"><span className={`c3-dot c3-dot--${line}`} aria-hidden="true" /><span className="c3-etiqueta" style={line === "conecta" ? undefined : { color: "var(--c3-line-text)" }}>{line === "conecta" ? "Para organizaciones" : "Tu recorrido"}</span></div>
              <h2>{content.participateTitle}</h2>
              <p>{content.participate}</p>
              {line === "conecta" ? (
                <div className="c3-path-card__action"><Link href="/empresa/proponer" className="c3-btn c3-btn--blanco">Proponer un challenge</Link></div>
              ) : null}
            </article>
          </div>
        </section>

        <section className="c3-featured" aria-labelledby="titulo-convocatorias">
          <div className="c3-frame">
            <div className="c3-featured__head">
              <div className="c3-section-head">
                <span className="c3-eyebrow">Convocatorias de {content.title}</span>
                <h2 id="titulo-convocatorias">Experiencias destacadas</h2>
                <p>Experiencias y challenges de {content.title} que puedes explorar desde el catálogo compartido.</p>
              </div>
              <Link href="/explorar" className="c3-featured__all">Ver todo el catálogo <span aria-hidden="true">↗</span></Link>
            </div>
            {active.length > 0 ? (
              <div className="c3-featured__grid">{active.map((card) => <CatalogCard key={card.key} card={card} />)}</div>
            ) : (
              <p className="c3-empty-card">Todavía no hay convocatorias activas en esta línea.</p>
            )}
          </div>
        </section>

        {historical.length > 0 ? (
          <section className="c3-featured c3-featured--flush" aria-labelledby="titulo-pasadas">
            <div className="c3-frame">
              <div className="c3-featured__head">
                <div className="c3-section-head">
                  <span className="c3-eyebrow">Historia de {content.title}</span>
                  <h2 id="titulo-pasadas">Experiencias pasadas</h2>
                  <p>Historia visible para aprender de lo que ya ocurrió. Las experiencias concluidas no aceptan nuevas inscripciones.</p>
                </div>
              </div>
              <div className="c3-featured__grid">{historical.map((card) => <CatalogCard key={card.key} card={card} />)}</div>
            </div>
          </section>
        ) : null}

        <section className="c3-cta">
          <div className="c3-frame">
            <div className="c3-cta__panel">
              <div className="c3-rings" aria-hidden="true"><span /><span /><span /><i /><i /><i /></div>
              <div className="c3-cta__text">
                <span className="c3-etiqueta">Catálogo C3</span>
                <h2>Encuentra tu próxima experiencia</h2>
                <p>El catálogo C3 reúne competencia, creación y comunidad en un mismo recorrido.</p>
              </div>
              <div className="c3-cta__action">
                <Link href={content.ctaHref} className="c3-btn c3-btn--blanco">{content.ctaLabel} <span className="c3-arrow" aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
