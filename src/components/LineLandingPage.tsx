import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ExperienceCard } from "@/components/ExperienceCard";
import { SiteHeader } from "@/components/SiteHeader";
import { LINE_LANDING } from "@/lib/content/lineLanding";
import { experienceLinesOf } from "@/lib/domain/catalog";
import type { ExperienceLine } from "@/lib/domain/types";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function LineLandingPage({ line }: { line: ExperienceLine }) {
  const content = LINE_LANDING[line];
  const catalog = await listPublicCatalog(database(), new Date());
  const items = catalog.filter((item) => experienceLinesOf(item.experience).includes(line));
  const active = items.filter((item) => item.experience.status !== "closed" && item.experience.status !== "cancelled");
  const historical = items.filter((item) => item.experience.status === "closed");
  const cards = (group: typeof items) => group.flatMap((item) => (
    item.challenges.length > 0
      ? item.challenges.map((challenge) => <ExperienceCard key={challenge.id} item={item} challenge={challenge} line={line} />)
      : [<ExperienceCard key={item.experience.id} item={item} line={line} />]
  ));

  return (
    <div>
      <SiteHeader />
      <main>
        <section style={{ background: "var(--c3-navy)", padding: "64px clamp(16px, 4vw, 48px) 72px" }}>
          <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span className="c3-etiqueta" style={{ color: content.accent }}>{content.eyebrow}</span>
            <h1 className="c3-titulo" style={{ color: "#ffffff", fontSize: "clamp(40px, 8vw, 72px)", lineHeight: 1, fontWeight: 800 }}>{content.title}</h1>
            <p style={{ maxWidth: 760, color: "var(--c3-texto-cabecera)", fontSize: 20, lineHeight: 1.55 }}>{content.intro}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8 }}>
              <Link href="/explorar" className="c3-btn" style={{ background: content.accent, color: "#ffffff" }}>{content.ctaLabel}</Link>
              <Link href="#como-funciona" className="c3-btn c3-btn--contorno" style={{ background: "transparent", color: "#ffffff", borderColor: "#617595" }}>Conocer la línea</Link>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="c3-page">
          <div className="c3-container" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24 }}>
            <article className="c3-card" style={{ padding: 28, borderTop: "6px solid " + content.accent }}>
              <h2 className="c3-titulo" style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700 }}>{content.whatTitle}</h2>
              <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65, color: "var(--c3-texto-suave)" }}>{content.what}</p>
            </article>
            <article className="c3-card" style={{ padding: 28 }}>
              <h2 className="c3-titulo" style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700 }}>{content.participateTitle}</h2>
              <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65, color: "var(--c3-texto-suave)" }}>{content.participate}</p>
            </article>
          </div>
        </section>

        <section className="c3-page" style={{ paddingTop: 8 }}>
          <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias destacadas</h2>
              <p style={{ marginTop: 8, color: "var(--c3-texto-suave)" }}>Experiencias y retos de {content.title} que podés explorar desde el catálogo compartido.</p>
            </div>
            {active.length > 0 ? <div className="c3-grilla-tarjetas">{cards(active)}</div> : (
              <div className="c3-card" style={{ padding: 24 }}><p style={{ color: "var(--c3-texto-suave)" }}>Todavía no hay convocatorias activas en esta línea.</p></div>
            )}
          </div>
        </section>

        {historical.length > 0 ? (
          <section className="c3-page" style={{ paddingTop: 8 }}>
            <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias pasadas</h2>
                <p style={{ marginTop: 8, color: "var(--c3-texto-suave)" }}>Historia visible para aprender de lo que ya ocurrió. Las experiencias concluidas no aceptan nuevas inscripciones.</p>
              </div>
              <div className="c3-grilla-tarjetas">{cards(historical)}</div>
            </div>
          </section>
        ) : null}

        <section style={{ background: content.accent, padding: "52px clamp(16px, 4vw, 48px)" }}>
          <div className="c3-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 className="c3-titulo" style={{ color: "#ffffff", fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Encontrá tu próxima experiencia</h2>
              <p style={{ color: "#ffffff", lineHeight: 1.6 }}>El catálogo C3 reúne competencia, creación y comunidad en un mismo recorrido.</p>
            </div>
            <Link href={content.ctaHref} className="c3-btn c3-btn--blanco">{content.ctaLabel}</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
