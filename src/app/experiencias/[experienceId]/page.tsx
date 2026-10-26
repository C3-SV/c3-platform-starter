import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentCta } from "@/components/EnrollmentCta";
import { SiteShell } from "@/components/SiteShell";
import { StatePill } from "@/components/StatePill";
import { formatDate, formatDateTime, formatSession, modalityLabel } from "@/lib/domain/format";
import { experienceLabel, lineTextColorOf, MODALITY_LABEL, primaryLineOf } from "@/lib/domain/presentation";
import { database } from "@/lib/server/context";
import { getPublicExperience } from "@/lib/server/catalog";
import { HttpError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

// La misma lectura sirve al título de la pestaña y a la página (una consulta por petición).
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

/** Detalle público de una experiencia. Si no tiene challenges publicados, la inscripción es a la experiencia misma. */
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
  const accent = lineTextColorOf(primaryLineOf(experience));

  return (
    <SiteShell>

      <div style={{ background: "var(--c3-navy)", padding: "8px clamp(16px, 4vw, 48px) 56px" }}>
        <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-conecta-claro)" }}>{experienceLabel(experience)}</span>
            <StatePill state={state} />
            {experience.isDemo ? <span className="c3-pill c3-pill--advertencia">Demo · no oficial</span> : null}
          </div>
          <h1 className="c3-titulo" style={{ margin: 0, maxWidth: 900, fontSize: 40, lineHeight: 1.1, fontWeight: 700, color: "#ffffff" }}>
            {experience.title}
          </h1>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-end" }}>
            {session ? <Meta label="Fecha y horario" value={session} /> : null}
            {experience.modality ? <Meta label="Modalidad" value={MODALITY_LABEL[experience.modality]} /> : null}
            {experience.location ? <Meta label="Sede o enlace" value={experience.location} /> : null}
            {experience.capacity != null && !concluded ? (
              <Meta label="Cupos" value={registration.spotsLeft === 0 ? "Completos" : `${registration.spotsLeft} disponibles de ${experience.capacity}`} />
            ) : null}
            {registration.direct && !concluded ? (
              <EnrollmentCta enrollHref={enrollHref} registrationOpen={registration.open} variant="hero" label="Inscribirme" closedLabel={closedLabel} />
            ) : null}
          </div>
        </div>
      </div>

      <main id="contenido" className="c3-page c3-ancho" style={{ padding: "clamp(16px, 4vw, 48px)" }}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
            <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Sobre esta experiencia</h2>
              <p style={{ fontSize: 18, lineHeight: 1.6 }}>{experience.summary}</p>
              {experience.demoNote ? <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-advertencia)" }}>{experience.demoNote}</p> : null}
              {experience.sourceUrl ? (
                <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
                  Fuente: <a href={experience.sourceUrl} rel="noopener noreferrer" style={{ color: accent }}>{experience.sourceLabel ?? experience.sourceUrl}</a>
                </p>
              ) : null}
            </section>

            {challenges.length > 0 ? (
              <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }} aria-labelledby="titulo-retos">
                <h2 id="titulo-retos" className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Challenges de esta experiencia</h2>
                {challenges.map((challenge) => (
                  <Link key={challenge.id} href={`/retos/${challenge.id}`} className="c3-tarjeta-enlace" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="c3-titulo" style={{ fontSize: 20, fontWeight: 600 }}>{challenge.title}</span>
                      <StatePill state={challenge.state} />
                    </div>
                    <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{challenge.summary}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {challenge.organizationName} · {modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize)}
                    </span>
                  </Link>
                ))}
              </section>
            ) : null}
          </div>

          <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción</span>
              {concluded ? (
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>Esta experiencia concluyó. Queda en el catálogo como parte de la historia de C3 y no acepta nuevas inscripciones.</p>
              ) : registration.direct ? (
                <>
                  <p style={{ fontSize: 16, lineHeight: 1.6 }}>
                    Necesitás una cuenta C3 para inscribirte. La inscripción la revisa C3 antes de confirmar tu lugar.
                  </p>
                  <EnrollmentCta enrollHref={enrollHref} registrationOpen={registration.open} variant="aside" closedLabel={closedLabel} />
                </>
              ) : (
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>Esta experiencia se inscribe desde cada uno de sus challenges. Elegí uno de la lista para ver sus requisitos.</p>
              )}
              <div style={{ height: 1, background: "var(--c3-borde)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {experience.registrationClosesAt ? <Row label="Inscripciones cierran" value={formatDate(experience.registrationClosesAt) ?? ""} /> : null}
                {experience.capacity != null ? <Row label="Cupos" value={String(experience.capacity)} /> : null}
                <Row label="Participación" value="Individual" />
                <Row label="Aprobación" value="Revisión de C3" />
              </div>
            </div>

            {experience.registrationOpensAt || experience.registrationClosesAt || experience.startsAt ? (
              <div className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Calendario</span>
                {experience.registrationOpensAt ? <CalendarItem title="Inscripciones abren" detail={formatDateTime(experience.registrationOpensAt) ?? ""} /> : null}
                {experience.registrationClosesAt ? <CalendarItem title="Inscripciones cierran" detail={formatDateTime(experience.registrationClosesAt) ?? ""} /> : null}
                {session ? <CalendarItem title="Sesión" detail={session} /> : null}
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--c3-conecta-claro)" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "#ffffff" }}>{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function CalendarItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 10, height: 10, borderRadius: 999, background: "var(--c3-accion)", marginTop: 7, flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{detail}</span>
      </div>
    </div>
  );
}
