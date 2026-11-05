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

// Shared by link only: search engines neither index nor follow it.
const NO_INDEX = { index: false, follow: false } as const;

const LINE_LABEL = { compite: "Compite", crea: "Crea", conecta: "Conecta" } as const;

// One read serves both the tab title and the page (a single query per request).
const load = cache((slug: string) => getPublicProfileBySlug(database(), slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const view = await load((await params).slug);
  return view
    ? { title: `${view.displayName} · Perfil público`, description: `Perfil público de ${view.displayName} en C3 Platform.`, robots: NO_INDEX }
    : { title: "Perfil no disponible", robots: NO_INDEX };
}

/**
 * Shareable public profile. It exists only if the person turned it on, and shows only what they chose plus the record
 * C3 keeps (approved participations and published recognitions). Unknown, changed or disabled links all return 404.
 */
export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await load(slug);
  if (!view) notFound();

  const trajectory = view.trajectory;
  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-profile-head">
          <div className="c3-frame c3-profile-head__row">
            <span aria-hidden="true" className="c3-profile-avatar">{initialsOf(view.displayName, null)}</span>
            <div className="c3-profile-head__data">
              <span className="c3-eyebrow">Perfil público</span>
              <h1>{view.displayName}</h1>
              {view.school ? <p className="c3-profile-school">{view.school}</p> : null}
              {view.links ? (
                <div className="c3-chips">
                  {view.links.github ? <a href={view.links.github} target="_blank" rel="noopener noreferrer nofollow" className="c3-chip">GitHub</a> : null}
                  {view.links.linkedin ? <a href={view.links.linkedin} target="_blank" rel="noopener noreferrer nofollow" className="c3-chip">LinkedIn</a> : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="c3-frame c3-profile">
          <PropietarioAviso slug={view.slug} />

          <div className={`c3-profile__grid${view.bio ? "" : " c3-profile__grid--single"}`}>
            {view.bio ? (
              <section className="c3-block" aria-labelledby="persona-presentacion">
                <span className="c3-eyebrow">Sobre la persona</span>
                <h2 id="persona-presentacion">Presentación</h2>
                <p className="c3-long-text" style={{ fontSize: 16 }}>{view.bio}</p>
                <p className="c3-block__intro" style={{ fontSize: 12 }}>Lo escribe la propia persona y C3 no lo verifica.</p>
              </section>
            ) : null}

            {trajectory ? (
              <section className="c3-profile__record" aria-labelledby="persona-trayectoria">
                <header className="c3-profile__record-head">
                  <h2 id="persona-trayectoria">Trayectoria en C3</h2>
                  <span className="c3-pill c3-pill--exito">Registrada por C3</span>
                </header>

                {trajectory.recognitions.length > 0 ? (
                  <section className="c3-block" aria-labelledby="persona-reconocimientos">
                    <h3 id="persona-reconocimientos">Reconocimientos</h3>
                    <ul className="c3-record-list">
                      {trajectory.recognitions.map((item) => (
                        <li key={`${item.challengeId}-${item.recognition}`}>
                          <Link href={`/retos/${item.challengeId}`}>{item.challengeTitle}</Link>
                          <span className="c3-pill c3-pill--exito">{item.recognition}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="c3-block" aria-labelledby="persona-participaciones">
                  <h3 id="persona-participaciones">Participaciones</h3>
                  {trajectory.participations.length === 0 ? (
                    <p className="c3-block__intro">Todavía no hay participaciones públicas.</p>
                  ) : (
                    <ul className="c3-record-list">
                      {trajectory.participations.map((item) => (
                        <li key={`${item.experienceId}-${item.challengeId ?? "experiencia"}`}>
                          <span>
                            <Link href={item.challengeId ? `/retos/${item.challengeId}` : `/experiencias/${item.experienceId}`}>
                              {item.challengeTitle ?? item.experienceTitle}
                            </Link>
                            <small>
                              <span style={{ color: lineTextColorOf(item.line), fontWeight: 600 }}>{LINE_LABEL[item.line]}</span>
                              {item.challengeTitle ? ` · ${item.experienceTitle}` : ""}
                            </small>
                          </span>
                          {item.concluded ? <span className="c3-pill c3-pill--neutro">Concluida</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </section>
            ) : null}
          </div>

          <aside className="c3-profile__closing" aria-label="Sobre este perfil">
            <p>Este perfil lo comparte la propia persona. La trayectoria la registra C3; el resto lo escribe ella.</p>
            <div className="c3-actions">
              <Link href="/acceso?modo=registro" className="c3-btn c3-btn--contorno">Crear mi perfil</Link>
              <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar experiencias <span className="c3-arrow" aria-hidden="true">↗</span></Link>
            </div>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
