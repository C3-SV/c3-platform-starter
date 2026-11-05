import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { catalogCards } from "@/components/catalogCardData";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";
import { FeaturedGrid } from "./FeaturedGrid";
import { HomeOrbit } from "./HomeOrbit";

export const dynamic = "force-dynamic";

const LINES = [
  { href: "/compite", key: "compite", title: "Compite", text: "Mide tus habilidades en competencias y challenges técnicos." },
  { href: "/crea", key: "crea", title: "Crea", text: "Convierte ideas en proyectos." },
  { href: "/conecta", key: "conecta", title: "Conecta", text: "Muestra tus capacidades a empresas." },
] as const;

const STEPS = [
  { title: "Eliges un challenge", text: "De Compite, Crea o Conecta.", icon: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "m20 20-3.5-3.5"] },
  { title: "Te inscribes", text: "Solo o en equipo.", icon: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M19 8v6M22 11h-6"] },
  { title: "Entregas tu solución", text: "Y documentas tu proceso.", icon: ["M12 15V3M7 8l5-5 5 5", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"] },
  { title: "Recibes tu evaluación", text: "Un jurado revisa cada solución y C3 publica los resultados.", icon: ["M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", "M15.5 13 17 22l-5-3-5 3 1.5-9"] },
];

/** Home (V01). Featured experiences come from the real public catalog. */
export default async function HomePage() {
  const catalog = await listPublicCatalog(database(), new Date());
  const cards = catalogCards(catalog);

  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-hero">
          <div className="c3-frame c3-hero__grid">
            <div className="c3-hero__text">
              <span className="c3-eyebrow">Competitive Coding Club · El Salvador</span>
              <h1>El talento se ve <em>en acción.</em></h1>
              <p className="c3-lead">Participa en challenges donde tus ideas, tu proceso y lo que construyes hablan por ti. C3 conecta ese trabajo con oportunidades reales.</p>
              <div className="c3-actions">
                <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar challenges <span className="c3-arrow" aria-hidden="true">↗</span></Link>
                <Link href="/empresa/proponer" className="c3-btn c3-btn--contorno">Para empresas</Link>
              </div>
            </div>
            <HomeOrbit />
          </div>
        </section>

        <div className="c3-frame">
          <div className="c3-lines">
            {LINES.map((line) => (
              <Link key={line.key} href={line.href} className="c3-line-card">
                <span className={`c3-dot c3-dot--${line.key}`} aria-hidden="true" />
                <h2 className="c3-line-card__title">{line.title}</h2>
                <p>{line.text}</p>
                <span className="c3-line-card__go">Conocer {line.title} <span aria-hidden="true">↗</span></span>
              </Link>
            ))}
          </div>
        </div>

        <section className="c3-paths" aria-labelledby="titulo-caminos">
          <div className="c3-frame">
            <div className="c3-section-head">
              <span className="c3-eyebrow">Dos caminos</span>
              <h2 id="titulo-caminos">¿Por dónde empiezas?</h2>
              <p>Talento que quiere demostrar lo que sabe y empresas que quieren verlo en acción.</p>
            </div>
            <div className="c3-paths__grid">
              <article className="c3-path-card">
                <div className="c3-path-card__brand"><span className="c3-dot c3-dot--compite" aria-hidden="true" /><span className="c3-etiqueta" style={{ color: "var(--c3-compite)" }}>Soy estudiante o joven técnico</span></div>
                <h3>Demuestra lo que sabes construir</h3>
                <p>Explora challenges, participa, documenta tu proceso y convierte tu trabajo en evidencia.</p>
                <div className="c3-path-card__action"><Link href="/explorar" className="c3-btn c3-btn--primario">Explorar challenges <span className="c3-arrow" aria-hidden="true">↗</span></Link></div>
              </article>
              <article className="c3-path-card c3-path-card--dark">
                <div className="c3-path-card__brand"><span className="c3-dot c3-dot--conecta" aria-hidden="true" /><span className="c3-etiqueta">Soy una empresa</span></div>
                <h3>Descubre talento con evidencia, no solo con currículums</h3>
                <p>Cuéntanos una necesidad y C3 la convierte en un challenge que te permite comparar capacidades.</p>
                <div className="c3-path-card__action"><Link href="/empresa/proponer" className="c3-btn c3-btn--blanco">Proponer un challenge</Link></div>
              </article>
            </div>
            <div className="c3-band">
              <div className="c3-band__head">
                <span className="c3-eyebrow">Así funciona</span>
                <h3>De la idea a la evidencia, en cuatro pasos</h3>
              </div>
              <ol className="c3-steps">
                {STEPS.map((step, index) => (
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
            </div>
          </div>
        </section>

        <section className="c3-featured" aria-labelledby="titulo-destacadas">
          <div className="c3-frame">
            <div className="c3-featured__head">
              <div className="c3-section-head">
                <span className="c3-eyebrow">Experiencias destacadas</span>
                <h2 id="titulo-destacadas">Lo que está pasando en C3</h2>
              </div>
              <Link href="/explorar" className="c3-featured__all">Ver todas <span aria-hidden="true">↗</span></Link>
            </div>
            {cards.length === 0 ? (
              <p className="c3-empty-card">Todavía no hay experiencias publicadas. Vuelve pronto.</p>
            ) : (
              <FeaturedGrid cards={cards} />
            )}
          </div>
        </section>

        <section className="c3-cta">
          <div className="c3-frame">
            <div className="c3-cta__panel">
              <div className="c3-rings" aria-hidden="true"><span /><span /><span /><i /><i /><i /></div>
              <div className="c3-cta__text">
                <span className="c3-etiqueta">Para empresas</span>
                <h2>¿Quieres ver cómo resuelve problemas el talento joven?</h2>
                <p>No necesitas un brief perfecto. Describe la situación con tus palabras y C3 se encarga de convertirla en un challenge.</p>
              </div>
              <div className="c3-cta__action">
                <Link href="/empresa/proponer" className="c3-btn c3-btn--blanco">Proponer un challenge <span className="c3-arrow" aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
