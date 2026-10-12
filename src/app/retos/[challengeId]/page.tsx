import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { StatePill } from "@/components/StatePill";
import { EnrollmentCta } from "@/components/EnrollmentCta";
import { KIND_LABEL } from "@/lib/domain/presentation";
import { formatDate, formatDateTime, modalityLabel } from "@/lib/domain/format";
import { database } from "@/lib/server/context";
import { getPublicChallenge } from "@/lib/server/catalog";
import { HttpError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

/** V03 · Detalle de reto. Solo muestra retos publicados (la experiencia también debe estar publicada). */
export default async function RetoPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  let detail;
  try {
    detail = await getPublicChallenge(database(), challengeId, new Date());
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const { challenge, experience, state } = detail;
  const registrationOpen = state.label === "Abierto";
  const modality = modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize);

  return (
    <div>
      <SiteHeader />

      <div style={{ background: "var(--c3-navy)", padding: "8px clamp(16px, 4vw, 48px) 56px" }}>
        <div className="c3-container" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-conecta-claro)" }}>{KIND_LABEL[experience.kind]}</span>
            <StatePill state={state} />
          </div>
          <h1 className="c3-titulo" style={{ margin: 0, maxWidth: 900, fontSize: 40, lineHeight: 1.1, fontWeight: 700, color: "#ffffff" }}>
            {challenge.title}
          </h1>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Meta label="Organización responsable" value={challenge.organizationName} />
            <Meta label="Modalidad" value={modality} />
            {challenge.submissionClosesAt ? (
              <Meta label="Cierre de entregas" value={formatDateTime(challenge.submissionClosesAt) ?? ""} />
            ) : null}
            <EnrollmentCta challengeId={challenge.id} registrationOpen={registrationOpen} variant="hero" />
          </div>
        </div>
      </div>

      <main className="c3-page" style={{ maxWidth: 1276, margin: "0 auto", padding: "clamp(16px, 4vw, 48px)" }}>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
            <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>El problema</h2>
              <Paragraphs text={challenge.problem} />
            </section>

            <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
              <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Qué tenés que entregar</h2>
              <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }} className="c3-dos-columnas">
                {challenge.deliverables.map((item, index) => (
                  <li key={item} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Entregable {index + 1}</span>
                    <span style={{ fontSize: 16, lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
              <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Cómo se evalúa</h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c3-texto-suave)" }}>
                La rúbrica es pública antes de inscribirte. Los jurados evalúan de forma independiente y C3 publica el resultado consolidado.
              </p>
              <div style={{ border: "1px solid var(--c3-borde)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", background: "var(--c3-superficie-sutil)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Criterio</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Puntos</span>
                </div>
                {challenge.rubric.map((criterion) => (
                  <div key={criterion.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 20px", borderTop: "1px solid var(--c3-borde)" }}>
                    <span style={{ fontSize: 16 }}>{criterion.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap" }}>0 – {criterion.maxScore}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción</span>
              <p style={{ fontSize: 16, lineHeight: 1.6 }}>
                Necesitás una cuenta C3 para inscribirte. La inscripción la revisa C3 antes de habilitarte.
              </p>
              <EnrollmentCta challengeId={challenge.id} registrationOpen={registrationOpen} variant="aside" />
              <div style={{ height: 1, background: "var(--c3-borde)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {experience.registrationClosesAt ? (
                  <Row label="Inscripciones cierran" value={formatDate(experience.registrationClosesAt) ?? ""} />
                ) : null}
                <Row label="Equipo" value={modality} />
                <Row label="Aprobación" value="Revisión de C3" />
              </div>
            </div>

            <div style={{ background: "var(--c3-conecta)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="c3-etiqueta" style={{ color: "#ffffff" }}>¿Tenés un problema así?</span>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#ffffff" }}>
                Contanos la necesidad técnica de tu equipo y C3 la convierte en un reto como este.
              </p>
              <span className="c3-btn c3-btn--blanco" aria-disabled="true" style={{ padding: "16px 20px", opacity: 0.85 }}>Próximamente</span>
            </div>

            <div className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Calendario</span>
              {experience.registrationOpensAt ? (
                <CalendarItem title="Inscripciones abren" detail={formatDateTime(experience.registrationOpensAt) ?? ""} />
              ) : null}
              {experience.registrationClosesAt ? (
                <CalendarItem title="Inscripciones cierran" detail={formatDateTime(experience.registrationClosesAt) ?? ""} />
              ) : null}
              {challenge.submissionClosesAt ? (
                <CalendarItem title="Cierre de entregas" detail={formatDateTime(challenge.submissionClosesAt) ?? ""} />
              ) : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
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

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph.slice(0, 40)} style={{ fontSize: 18, lineHeight: 1.6 }}>{paragraph.trim()}</p>
      ))}
    </>
  );
}
