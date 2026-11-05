import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentCta } from "@/components/EnrollmentCta";
import { Migas } from "@/components/Migas";
import { SiteShell } from "@/components/SiteShell";
import { StatePill } from "@/components/StatePill";
import { experienceLabel, lineTextColorOf, primaryLineOf } from "@/lib/domain/presentation";
import { formatDate, formatDeadline, formatDateTime, modalityLabel } from "@/lib/domain/format";
import { database } from "@/lib/server/context";
import { getPublicChallenge } from "@/lib/server/catalog";
import { publicWinners } from "@/lib/server/evaluation";
import { HttpError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

// One read serves both the tab title and the page (a single query per request).
const loadChallenge = cache((challengeId: string) => getPublicChallenge(database(), challengeId, new Date()));

export async function generateMetadata({ params }: { params: Promise<{ challengeId: string }> }): Promise<Metadata> {
  const { challengeId } = await params;
  try {
    const { challenge } = await loadChallenge(challengeId);
    return { title: challenge.title, description: challenge.summary };
  } catch {
    return { title: "Challenge no encontrado" };
  }
}

/** Challenge detail (V03). Only published challenges of published experiences are shown. */
export default async function RetoPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  let detail;
  try {
    detail = await loadChallenge(challengeId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const { challenge, experience, state } = detail;
  const winners = await publicWinners(database(), challengeId);
  const registrationOpen = state.label === "Abierto";
  const modality = modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize);
  const line = primaryLineOf(experience);
  const weighted = challenge.rubric.length > 0 && challenge.rubric.every((criterion) => typeof criterion.weight === "number");

  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-detail-head">
          <div className="c3-frame">
            <Migas items={[{ label: "Explorar", href: "/explorar" }, { label: "Challenge" }]} />
            <div className="c3-detail-head__grid">
              <div className="c3-detail-head__text">
                <div className="c3-chips">
                  <span className="c3-exp__line" style={{ color: lineTextColorOf(line) }}>
                    <span className={`c3-dot c3-dot--${line}`} aria-hidden="true" />{experienceLabel(experience)}
                  </span>
                  <StatePill state={state} />
                  {experience.isDemo ? <span className="c3-pill c3-pill--advertencia">Demo · no oficial</span> : null}
                </div>
                <h1>{challenge.title}</h1>
                <p className="c3-lead" style={{ maxWidth: "60ch" }}>{challenge.summary}</p>
                <dl className="c3-meta-list">
                  <div className="c3-meta"><dt>Organización responsable</dt><dd>{challenge.organizationName}</dd></div>
                  <div className="c3-meta"><dt>Modalidad</dt><dd>{modality}</dd></div>
                  {challenge.submissionClosesAt ? (
                    <div className="c3-meta"><dt>Cierre de entregas</dt><dd>{formatDeadline(challenge.submissionClosesAt)}</dd></div>
                  ) : null}
                </dl>
              </div>
              <div className="c3-detail-head__action">
                <EnrollmentCta enrollHref={`/retos/${challenge.id}/inscripcion`} registrationOpen={registrationOpen} variant="hero" />
              </div>
            </div>
          </div>
        </section>

        <section className="c3-detail">
          <div className="c3-frame c3-detail__grid">
            <div className="c3-detail__main">
              <section className="c3-block" aria-labelledby="titulo-problema">
                <span className="c3-eyebrow">Contexto</span>
                <h2 id="titulo-problema">El problema</h2>
                {challenge.problem.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="c3-long-text">{paragraph.trim()}</p>
                ))}
                {experience.demoNote ? <p className="c3-demo-note">{experience.demoNote}</p> : null}
              </section>

              <section className="c3-block" aria-labelledby="titulo-entregables">
                <span className="c3-eyebrow">Entregables</span>
                <h2 id="titulo-entregables">Qué tienes que entregar</h2>
                <ul className="c3-deliverables">
                  {challenge.deliverables.map((item) => (
                    <li key={item} className="c3-deliverable">
                      <span className="c3-deliverable__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                          <path d="M14 3v5h5M9 13h6M9 17h4" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="c3-block" aria-labelledby="titulo-rubrica">
                <span className="c3-eyebrow">Evaluación</span>
                <h2 id="titulo-rubrica">Cómo se evalúa</h2>
                <p className="c3-block__intro">La rúbrica es pública antes de inscribirte. Los jurados evalúan de forma independiente y C3 publica el resultado consolidado.</p>
                <div className="c3-table-frame">
                  <table className="c3-rubric">
                    <thead>
                      <tr>
                        <th scope="col">Criterio</th>
                        <th scope="col" className="c3-num">Puntos</th>
                        {weighted ? <th scope="col" className="c3-num">Peso</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {challenge.rubric.map((criterion) => (
                        <tr key={criterion.id}>
                          <td>{criterion.label}</td>
                          <td className="c3-num">0 a {criterion.maxScore}</td>
                          {weighted ? (
                            <td className="c3-num">
                              <span className="c3-weight">
                                <span className="c3-weight__bar" aria-hidden="true"><i style={{ width: `${criterion.weight}%` }} /></span>
                                {criterion.weight}%
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                    {weighted ? (
                      <tfoot>
                        <tr><td>Total ponderado</td><td className="c3-num" colSpan={2}>0 a 100</td></tr>
                      </tfoot>
                    ) : null}
                  </table>
                </div>
              </section>

              {winners.length > 0 ? (
                <section className="c3-block" aria-labelledby="titulo-ganadores">
                  <span className="c3-eyebrow">Resultados</span>
                  <h2 id="titulo-ganadores">Ganadores y reconocimientos</h2>
                  <ul className="c3-record-list">
                    {winners.map((winner) => (
                      <li key={`${winner.recognition}-${winner.name}`}>
                        <span>
                          {winner.profileSlug ? <Link href={`/personas/${winner.profileSlug}`}>{winner.name ?? "Ver perfil"}</Link> : (winner.name ?? "Solución sin nombre")}
                        </span>
                        <span className="c3-pill c3-pill--exito">{winner.recognition}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="c3-detail__aside" aria-label="Inscripción y calendario">
              <div className="c3-side-card">
                <span className="c3-eyebrow">Inscripción</span>
                <p>Necesitas una cuenta C3 para inscribirte. La inscripción la revisa C3 antes de habilitarte.</p>
                <EnrollmentCta enrollHref={`/retos/${challenge.id}/inscripcion`} registrationOpen={registrationOpen} variant="aside" />
                <div className="c3-divider" />
                <dl className="c3-rows">
                  {experience.registrationClosesAt ? (
                    <div className="c3-row"><dt>Inscripciones cierran</dt><dd>{formatDate(experience.registrationClosesAt)}</dd></div>
                  ) : null}
                  <div className="c3-row"><dt>Equipo</dt><dd>{modality}</dd></div>
                  <div className="c3-row"><dt>Aprobación</dt><dd>Revisión de C3</dd></div>
                </dl>
              </div>

              {experience.registrationOpensAt || experience.registrationClosesAt || challenge.submissionClosesAt ? (
                <div className="c3-side-card">
                  <span className="c3-eyebrow">Calendario</span>
                  <ol className="c3-timeline">
                    {experience.registrationOpensAt ? <Milestone title="Inscripciones abren" detail={formatDateTime(experience.registrationOpensAt) ?? ""} /> : null}
                    {experience.registrationClosesAt ? <Milestone title="Inscripciones cierran" detail={formatDateTime(experience.registrationClosesAt) ?? ""} /> : null}
                    {challenge.submissionClosesAt ? <Milestone title="Cierre de entregas" detail={formatDateTime(challenge.submissionClosesAt) ?? ""} /> : null}
                  </ol>
                </div>
              ) : null}

              <div className="c3-mini-cta">
                <div className="c3-rings" aria-hidden="true"><span /><span /><span /><i /><i /><i /></div>
                <span className="c3-etiqueta">Para empresas</span>
                <h3>¿Tienes un problema así?</h3>
                <p>Cuéntanos la necesidad técnica de tu equipo y C3 la convierte en un challenge como este.</p>
                <Link href="/empresa/proponer" className="c3-btn c3-btn--blanco">Proponer un challenge</Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function Milestone({ title, detail }: { title: string; detail: string }) {
  return (
    <li className="c3-milestone">
      <span className="c3-milestone__dot" aria-hidden="true" />
      <span className="c3-milestone__text"><b>{title}</b><span>{detail}</span></span>
    </li>
  );
}
