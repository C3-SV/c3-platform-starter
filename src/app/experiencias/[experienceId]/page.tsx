import { cache, type CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverImage } from "@/components/CoverImage";
import { EnrollmentCta } from "@/components/EnrollmentCta";
import { Migas } from "@/components/Migas";
import { SiteShell } from "@/components/SiteShell";
import { StatePill } from "@/components/StatePill";
import { formatDate, formatDateTime, formatSession, modalityLabel } from "@/lib/domain/format";
import { coverOf } from "@/lib/domain/coverImage";
import { experienceLabel, lineTextColorOf, MODALITY_LABEL, primaryLineOf } from "@/lib/domain/presentation";
import { database } from "@/lib/server/context";
import { getPublicExperience } from "@/lib/server/catalog";
import { HttpError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

// One read serves both the tab title and the page (a single query per request).
const loadExperience = cache((experienceId: string) => getPublicExperience(database(), experienceId, new Date()));

export async function generateMetadata({ params }: { params: Promise<{ experienceId: string }> }): Promise<Metadata> {
  const { experienceId } = await params;
  try {
    const { experience } = await loadExperience(experienceId);
    return { title: experience.title, description: experience.summary };
  } catch {
    return { title: "Experiencia no encontrada" };
  }
}

const ENROLL_STEPS = [
  { title: "Entras con tu cuenta", text: "O la creas en un minuto.", icon: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M19 8v6M22 11h-6"] },
  { title: "Te inscribes", text: "La participación es individual.", icon: ["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"] },
  { title: "C3 confirma tu lugar", text: "Revisa la inscripción antes de confirmarla.", icon: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"] },
];

/** Public experience detail. Without published challenges, people enroll in the experience itself. */
export default async function ExperienciaPage({ params }: { params: Promise<{ experienceId: string }> }) {
  const { experienceId } = await params;
  let detail;
  try {
    detail = await loadExperience(experienceId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const { experience, state, challenges, registration } = detail;
  const concluded = experience.status === "closed";
  const session = formatSession(experience.startsAt, experience.endsAt);
  const enrollHref = `/experiencias/${experience.id}/inscripcion`;
  const closedLabel = registration.full ? "Cupos completos" : "Inscripciones cerradas";
  const line = primaryLineOf(experience);
  const accent = lineTextColorOf(line);
  const cover = coverOf(experience);

  return (
    <SiteShell>
      <main id="contenido">
        <section className="c3-detail-head">
          <div className="c3-frame">
            <Migas items={[{ label: "Explorar", href: "/explorar" }, { label: "Experiencia" }]} />
            <div className="c3-detail-head__grid">
              <div className="c3-detail-head__text">
                <div className="c3-chips">
                  <span className="c3-exp__line" style={{ color: accent }}><span className={`c3-dot c3-dot--${line}`} aria-hidden="true" />{experienceLabel(experience)}</span>
                  <StatePill state={state} />
                  {experience.isDemo ? <span className="c3-pill c3-pill--advertencia">Demo · no oficial</span> : null}
                </div>
                <h1>{experience.title}</h1>
                <dl className="c3-meta-list">
                  {session ? <div className="c3-meta"><dt>Fecha y horario</dt><dd>{session}</dd></div> : null}
                  {experience.modality ? <div className="c3-meta"><dt>Modalidad</dt><dd>{MODALITY_LABEL[experience.modality]}</dd></div> : null}
                  {experience.location ? <div className="c3-meta"><dt>Sede o enlace</dt><dd>{experience.location}</dd></div> : null}
                  {experience.capacity != null && !concluded ? (
                    <div className="c3-meta"><dt>Cupos</dt><dd>{registration.spotsLeft === 0 ? "Completos" : `${registration.spotsLeft} disponibles de ${experience.capacity}`}</dd></div>
                  ) : null}
                </dl>
              </div>
              {registration.direct && !concluded ? (
                <div className="c3-detail-head__action">
                  <EnrollmentCta enrollHref={enrollHref} registrationOpen={registration.open} variant="hero" label="Inscribirme" closedLabel={closedLabel} />
                </div>
              ) : null}
            </div>
            {cover ? <CoverImage cover={cover} frameClassName="c3-cover-band" className="c3-cover-band__img" sizes="(max-width: 1180px) 100vw, 1100px" priority /> : null}
          </div>
        </section>

        <section className="c3-detail">
          <div className="c3-frame c3-detail__grid">
            <div className="c3-detail__main">
              <section className="c3-block" aria-labelledby="titulo-sobre">
                <span className="c3-eyebrow">La experiencia</span>
                <h2 id="titulo-sobre">Sobre esta experiencia</h2>
                <p className="c3-long-text">{experience.summary}</p>
                {experience.demoNote ? <p className="c3-demo-note">{experience.demoNote}</p> : null}
                {experience.sourceUrl ? (
                  <p className="c3-block__intro">
                    Fuente: <a href={experience.sourceUrl} rel="noopener noreferrer">{experience.sourceLabel ?? experience.sourceUrl}</a>
                  </p>
                ) : null}
              </section>

              {challenges.length > 0 ? (
                <section className="c3-block" aria-labelledby="titulo-retos">
                  <span className="c3-eyebrow">Challenges</span>
                  <h2 id="titulo-retos">Challenges de esta experiencia</h2>
                  <ul className="c3-record-list">
                    {challenges.map((challenge) => (
                      <li key={challenge.id}>
                        <span>
                          <Link href={`/retos/${challenge.id}`}>{challenge.title}</Link>
                          <span className="c3-record-list__summary">{challenge.summary}</span>
                          <small>{challenge.organizationName} · {modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize)}</small>
                        </span>
                        <StatePill state={challenge.state} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {registration.direct && !concluded ? (
                <section className="c3-block" aria-labelledby="titulo-como-inscribirte">
                  <span className="c3-eyebrow">Inscripción</span>
                  <h2 id="titulo-como-inscribirte">Cómo te inscribes</h2>
                  <ol className="c3-steps" style={{ "--c3-steps": 3 } as CSSProperties}>
                    {ENROLL_STEPS.map((step, index) => (
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
                </section>
              ) : null}
            </div>

            <aside className="c3-detail__aside" aria-label="Inscripción y calendario">
              <div className="c3-side-card">
                <span className="c3-eyebrow">Inscripción</span>
                {concluded ? (
                  <p>Esta experiencia concluyó. Queda en el catálogo como parte de la historia de C3 y no acepta nuevas inscripciones.</p>
                ) : registration.direct ? (
                  <>
                    <p>Necesitas una cuenta C3 para inscribirte. La inscripción la revisa C3 antes de confirmar tu lugar.</p>
                    <EnrollmentCta enrollHref={enrollHref} registrationOpen={registration.open} variant="aside" closedLabel={closedLabel} />
                  </>
                ) : (
                  <p>Esta experiencia se inscribe desde cada uno de sus challenges. Elige uno de la lista para ver sus requisitos.</p>
                )}
                <div className="c3-divider" />
                <dl className="c3-rows">
                  {experience.registrationClosesAt ? <div className="c3-row"><dt>Inscripciones cierran</dt><dd>{formatDate(experience.registrationClosesAt)}</dd></div> : null}
                  {experience.capacity != null ? <div className="c3-row"><dt>Cupos</dt><dd>{experience.capacity}</dd></div> : null}
                  <div className="c3-row"><dt>Participación</dt><dd>Individual</dd></div>
                  <div className="c3-row"><dt>Aprobación</dt><dd>Revisión de C3</dd></div>
                </dl>
              </div>

              {experience.registrationOpensAt || experience.registrationClosesAt || session ? (
                <div className="c3-side-card">
                  <span className="c3-eyebrow">Calendario</span>
                  <ol className="c3-timeline">
                    {experience.registrationOpensAt ? <Milestone title="Inscripciones abren" detail={formatDateTime(experience.registrationOpensAt) ?? ""} /> : null}
                    {experience.registrationClosesAt ? <Milestone title="Inscripciones cierran" detail={formatDateTime(experience.registrationClosesAt) ?? ""} /> : null}
                    {session ? <Milestone title="Sesión" detail={session} /> : null}
                  </ol>
                </div>
              ) : null}
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
