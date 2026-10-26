import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { initialsOf } from "@/lib/domain/format";
import { lineTextColorOf } from "@/lib/domain/presentation";
import { database } from "@/lib/server/context";
import { getPublicProfileBySlug } from "@/lib/server/publicProfiles";
import { PropietarioAviso } from "./PropietarioAviso";

export const dynamic = "force-dynamic";

// Se comparte por enlace: los buscadores no lo indexan ni lo siguen.
const NO_INDEX = { index: false, follow: false } as const;

const LINE_LABEL = { compite: "Compite", crea: "Crea", conecta: "Conecta" } as const;

// La misma lectura sirve al título de la pestaña y a la página (una consulta por petición).
const load = cache((slug: string) => getPublicProfileBySlug(database(), slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const view = await load((await params).slug);
  return view
    ? { title: `${view.displayName} · Perfil público`, description: `Perfil público de ${view.displayName} en C3 Platform.`, robots: NO_INDEX }
    : { title: "Perfil no disponible", robots: NO_INDEX };
}

/**
 * Perfil público compartible. Existe solo si la propia persona lo activó; muestra únicamente lo que ella eligió y la
 * trayectoria que C3 registró (participaciones aprobadas y reconocimientos publicados). Una dirección que no existe,
 * fue cambiada o se desactivó responde igual: 404.
 */
export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await load(slug);
  if (!view) notFound();

  const trajectory = view.trajectory;
  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-persona__hero">
          <div className="c3-container c3-persona__hero-interior">
            <span aria-hidden="true" className="c3-tray__avatar">{initialsOf(view.displayName, null)}</span>
            <div className="c3-persona__datos">
              <span className="c3-etiqueta" style={{ color: "var(--c3-conecta-claro)" }}>Perfil público</span>
              <h1 className="c3-titulo">{view.displayName}</h1>
              {view.school ? <p className="c3-persona__centro">{view.school}</p> : null}
              {view.links ? (
                <div className="c3-tray__acciones">
                  {view.links.github ? <a href={view.links.github} target="_blank" rel="noopener noreferrer nofollow" className="c3-tray__chip">GitHub</a> : null}
                  {view.links.linkedin ? <a href={view.links.linkedin} target="_blank" rel="noopener noreferrer nofollow" className="c3-tray__chip">LinkedIn</a> : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="c3-container c3-page c3-persona__cuerpo">
          <PropietarioAviso slug={view.slug} />

          <div className="c3-persona__grilla">
            {view.bio ? (
              <section className="c3-card c3-persona__panel c3-persona__lado" aria-labelledby="persona-presentacion">
                <h2 id="persona-presentacion" className="c3-titulo">Presentación</h2>
                <p className="c3-persona__bio">{view.bio}</p>
                <p className="c3-tray__aviso">Lo escribe la propia persona y C3 no lo verifica.</p>
              </section>
            ) : null}

            {trajectory ? (
              <section className="c3-persona__trayectoria" aria-labelledby="persona-trayectoria">
                <header className="c3-persona__trayectoria-cabecera">
                  <h2 id="persona-trayectoria" className="c3-titulo">Trayectoria en C3</h2>
                  <span className="c3-pill c3-pill--exito">Registrada por C3</span>
                </header>

                {trajectory.recognitions.length > 0 ? (
                  <section className="c3-card c3-persona__panel" aria-labelledby="persona-reconocimientos">
                    <h3 id="persona-reconocimientos" className="c3-titulo">Reconocimientos</h3>
                    <ul className="c3-persona__lista">
                      {trajectory.recognitions.map((item) => (
                        <li key={`${item.challengeId}-${item.recognition}`}>
                          <Link href={`/retos/${item.challengeId}`}>{item.challengeTitle}</Link>
                          <span className="c3-pill c3-pill--exito">{item.recognition}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="c3-card c3-persona__panel" aria-labelledby="persona-participaciones">
                  <h3 id="persona-participaciones" className="c3-titulo">Participaciones</h3>
                  {trajectory.participations.length === 0 ? (
                    <p className="c3-persona__vacio">Todavía no hay participaciones públicas.</p>
                  ) : (
                    <ul className="c3-persona__lista">
                      {trajectory.participations.map((item) => (
                        <li key={`${item.experienceId}-${item.challengeId ?? "experiencia"}`}>
                          <div className="c3-persona__item">
                            <Link href={item.challengeId ? `/retos/${item.challengeId}` : `/experiencias/${item.experienceId}`}>
                              {item.challengeTitle ?? item.experienceTitle}
                            </Link>
                            <span className="c3-persona__meta" style={{ color: lineTextColorOf(item.line) }}>
                              {LINE_LABEL[item.line]}{item.challengeTitle ? ` · ${item.experienceTitle}` : ""}
                            </span>
                          </div>
                          {item.concluded ? <span className="c3-pill c3-pill--neutro">Concluida</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </section>
            ) : null}
          </div>

          <aside className="c3-persona__cierre" aria-label="Sobre este perfil">
            <p>Este perfil lo comparte la propia persona. La trayectoria la registra C3; el resto lo escribe ella.</p>
            <div className="c3-persona__acciones">
              <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar experiencias</Link>
              <Link href="/acceso?modo=registro" className="c3-btn c3-btn--contorno">Crear mi perfil</Link>
            </div>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
