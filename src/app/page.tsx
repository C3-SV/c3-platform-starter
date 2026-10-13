import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { StatePill } from "@/components/StatePill";
import { Footer } from "@/components/Footer";
import { KIND_LABEL, lineColor, lineTextColor } from "@/lib/domain/presentation";
import { modalityLabel } from "@/lib/domain/format";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** V01 · Home. Las experiencias destacadas salen del catálogo público real. */
export default async function HomePage() {
  const catalog = await listPublicCatalog(database(), new Date());
  const featured = catalog
    .flatMap((item) => item.challenges.map((challenge) => ({ kind: item.experience.kind, challenge })))
    .slice(0, 3);

  return (
    <div>
      <SiteHeader />

      <section style={{ background: "var(--c3-navy)", padding: "56px clamp(16px, 4vw, 48px) 72px" }}>
        <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 860 }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-compite-claro)" }}>Competitive Coding Club · El Salvador</span>
            <h1 className="c3-titulo" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 1.05, fontWeight: 800, color: "#ffffff" }}>
              Problemas reales. Talento técnico joven.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#a9b8d0" }}>
              Las empresas plantean retos técnicos de verdad. Equipos jóvenes los resuelven. Lo que entregan queda registrado como evidencia oficial de C3.
            </p>
          </div>

          <div className="c3-home-caminos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24 }}>
            <div style={{ background: "#17294a", border: "1px solid #2c3f63", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="c3-etiqueta" style={{ color: "var(--c3-compite-claro)" }}>Soy estudiante o joven técnico</span>
              <div className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700, color: "#ffffff" }}>
                Resolvé retos y construí una trayectoria que C3 respalda
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#a9b8d0" }}>
                Explorá retos abiertos, inscribite solo o en equipo, entregá tu solución y recibí un resultado oficial.
              </p>
              <div style={{ marginTop: "auto", paddingTop: 8 }}>
                <Link href="/explorar" className="c3-btn" style={{ background: "#2c62b0", color: "#ffffff", padding: "16px 28px", display: "inline-flex" }}>
                  Explorar experiencias
                </Link>
              </div>
            </div>

            <div style={{ background: "var(--c3-conecta)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="c3-etiqueta" style={{ color: "#ffffff" }}>Soy una empresa</span>
              <div className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700, color: "#ffffff" }}>
                Convertí un problema técnico en un reto resuelto por equipos
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#ffffff" }}>
                Contanos tu necesidad. C3 la define contigo, recibís varias soluciones y las evaluás sobre la misma rúbrica.
              </p>
              <div style={{ marginTop: "auto", paddingTop: 8 }}>
                <Link href="/empresa/proponer" className="c3-btn c3-btn--blanco" style={{ padding: "16px 28px", display: "inline-flex" }}>
                  Proponer un challenge
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="c3-page" style={{ padding: "72px clamp(16px, 4vw, 48px) 40px" }}>
        <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
            <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Tres formas de participar</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c3-texto-suave)" }}>
              C3 nació de la programación competitiva y hoy conecta competencia, construcción y empresas.
            </p>
          </div>
          <div className="c3-grilla-tres" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24 }}>
            {[
              { line: "var(--c3-compite)", title: "Compite", color: "var(--c3-compite)", text: "Retos y competencia técnica para medirte contra otros y mejorar.", example: "Ejemplo: Copa Salvadoreña de Programación." },
              { line: "var(--c3-crea)", title: "Crea", color: "var(--c3-crea-texto)", text: "Construcción real: convertí lo que sabés en proyectos y soluciones.", example: "Ejemplo: Hackathon de Turismo Creativo." },
              { line: "var(--c3-conecta)", title: "Conecta", color: "var(--c3-conecta)", text: "El puente entre talento, empresas e instituciones, con retos que plantean las propias empresas.", example: "Ejemplo: C3 Challenges." },
            ].map((item) => (
              <div key={item.title} className="c3-card" style={{ overflow: "hidden" }}>
                <div style={{ height: 6, background: item.line }} />
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                  <span className="c3-titulo" style={{ fontSize: 22, fontWeight: 600, color: item.color }}>{item.title}</span>
                  <span style={{ fontSize: 16, lineHeight: 1.6 }}>{item.text}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="c3-page" style={{ padding: "40px clamp(16px, 4vw, 48px) 72px" }}>
        <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias destacadas</h2>
            <Link href="/explorar" style={{ fontSize: 14, fontWeight: 500 }}>Ver todas</Link>
          </div>
          {featured.length === 0 ? (
            <div className="c3-card" style={{ padding: 24 }}>
              <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Todavía no hay retos publicados. Volvé pronto.</p>
            </div>
          ) : (
            <div className="c3-grilla-tarjetas">
              {featured.map(({ kind, challenge }) => (
                <Link key={challenge.id} href={`/retos/${challenge.id}`} className="c3-tarjeta-enlace">
                  <div style={{ height: 6, background: lineColor(kind) }} />
                  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span className="c3-etiqueta" style={{ color: lineTextColor(kind) }}>{KIND_LABEL[kind]}</span>
                      <StatePill state={challenge.state} />
                    </div>
                    <div className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{challenge.title}</div>
                    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--c3-borde)", fontSize: 14, color: "var(--c3-texto-suave)" }}>
                      {challenge.organizationName} · {modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: "var(--c3-conecta)", padding: "56px clamp(16px, 4vw, 48px)" }}>
        <div className="c3-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 700 }}>
            <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700, color: "#ffffff" }}>
              ¿Tu equipo técnico tiene un problema sin resolver?
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#ffffff" }}>
              No necesitás un brief perfecto. Describí la situación con tus palabras y C3 se encarga de convertirla en un reto.
            </p>
          </div>
          <Link href="/empresa/proponer" className="c3-btn c3-btn--blanco" style={{ padding: "16px 28px" }}>Proponer un challenge</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
