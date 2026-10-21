"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MovilShell } from "@/components/MovilShell";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDate, formatSession } from "@/lib/domain/format";
import { enrollmentState, MODALITY_LABEL, type PresentedState } from "@/lib/domain/presentation";
import type { ExperienceModality } from "@/lib/domain/types";
import type { EnrollmentView, MyEnrollmentView } from "@/lib/server/participation";

export interface InscripcionExperiencia {
  id: string;
  title: string;
  label: string;
  state: PresentedState;
  registrationOpen: boolean;
  /** Sin retos publicados: la inscripción es a la experiencia misma. */
  direct: boolean;
  full: boolean;
  spotsLeft: number | null;
  capacity: number | null;
  startsAt: string | null;
  endsAt: string | null;
  modality: ExperienceModality | null;
  location: string | null;
  registrationClosesAt: string | null;
}

type Enrollment = MyEnrollmentView | EnrollmentView;

/** Inscripción a una experiencia sin retos: individual, la revisa C3 y se puede cancelar mientras la experiencia siga publicada. */
export function InscripcionExperienciaPanel({ experience }: { experience: InscripcionExperiencia }) {
  const { session } = useSession();
  const [enrollment, setEnrollment] = useState<Enrollment | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signedIn = session.status === "signed-in";
  const next = `/experiencias/${experience.id}/inscripcion`;

  // Carga la inscripción propia a esta experiencia; el estado llega en la respuesta.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ enrollments: MyEnrollmentView[] }>("/api/mi-c3").then(
      (data) => {
        if (!active) return;
        setEnrollment(data.enrollments.find((item) => item.experienceId === experience.id) ?? null);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu inscripción. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn, experience.id]);

  async function enroll() {
    setFormError(null);
    setNotice(null);
    setBusy(true);
    try {
      const data = await apiRequest<{ enrollment: EnrollmentView }>(`/api/experiencias/${experience.id}/inscripcion`, { method: "POST" });
      setEnrollment(data.enrollment);
      setNotice("Inscripción enviada. C3 la revisa y te confirma tu lugar.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No pudimos registrar tu inscripción. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!enrollment) return;
    setFormError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiRequest(`/api/inscripciones/${enrollment.id}`, { method: "PATCH", body: { status: "cancelled" } });
      setEnrollment({ ...enrollment, status: "cancelled" });
      setNotice("Inscripción cancelada. Tu lugar queda libre.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No pudimos cancelar la inscripción. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const sessionText = formatSession(experience.startsAt, experience.endsAt);
  const active = enrollment && (enrollment.status === "pending" || enrollment.status === "approved");
  const canEnroll = experience.direct && signedIn && enrollment === null;

  return (
    <MovilShell backHref={`/experiencias/${experience.id}`}>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>{experience.label}</span>
        <h1 className="c3-titulo" style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700 }}>{experience.title}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatePill state={experience.state} />
          {enrollment ? <StatePill state={enrollmentState(enrollment.status)} /> : null}
        </div>
      </section>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}

      {!experience.direct ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>Esta experiencia se inscribe desde cada uno de sus retos.</p>
          <Link href={`/experiencias/${experience.id}`} className="c3-btn c3-btn--primario">Ver los retos</Link>
        </section>
      ) : null}

      {experience.direct && session.status === "signed-out" ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>Necesitás una cuenta C3 para inscribirte. La revisa C3 antes de confirmar tu lugar.</p>
          <Link href={`/acceso?next=${encodeURIComponent(next)}`} className="c3-btn c3-btn--primario">Entrar para inscribirme</Link>
        </section>
      ) : null}

      {experience.direct && signedIn && enrollment === undefined && !loadError ? (
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando tu inscripción…</p>
      ) : null}

      {canEnroll ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="titulo-inscripcion">
          <span id="titulo-inscripcion" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción</span>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>Participás de forma individual. C3 revisa la inscripción y te confirma tu lugar.</p>
          {experience.registrationOpen ? (
            <button type="button" className="c3-btn c3-btn--primario" disabled={busy} onClick={() => void enroll()}>
              {busy ? "Inscribiendo…" : "Inscribirme"}
            </button>
          ) : (
            <span className="c3-btn" aria-disabled="true">{experience.full ? "Cupos completos" : "Inscripciones cerradas"}</span>
          )}
        </section>
      ) : null}

      {experience.direct && signedIn && (enrollment?.status === "cancelled" || enrollment?.status === "rejected") ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Tu inscripción</span>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: enrollment.status === "rejected" ? "var(--c3-error)" : "var(--c3-texto-suave)" }}>
            {enrollment.status === "rejected" ? "C3 no aprobó esta inscripción." : "Cancelaste esta inscripción. No acredita participación."}
          </p>
        </section>
      ) : null}

      {experience.direct && signedIn && active ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="titulo-tu-inscripcion">
          <span id="titulo-tu-inscripcion" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Tu inscripción</span>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>
            {enrollment.status === "approved"
              ? "C3 confirmó tu lugar. Te esperamos."
              : "Tu inscripción está en revisión por C3. Te avisamos cuando haya una respuesta; mientras tanto, no tenés nada que hacer."}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/mi-c3" className="c3-btn c3-btn--contorno">Ir a Mi C3</Link>
            <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => void cancel()}>
              {busy ? "Cancelando…" : "Cancelar inscripción"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {sessionText ? <Dato label="Fecha y horario" value={sessionText} /> : null}
        {experience.modality ? <Dato label="Modalidad" value={MODALITY_LABEL[experience.modality]} /> : null}
        {experience.location ? <Dato label="Sede o enlace" value={experience.location} /> : null}
        {experience.registrationClosesAt ? <Dato label="Inscripciones cierran" value={formatDate(experience.registrationClosesAt) ?? ""} /> : null}
        {experience.capacity != null ? (
          <Dato label="Cupos" value={experience.spotsLeft === 0 ? "Completos" : `${experience.spotsLeft} libres de ${experience.capacity}`} />
        ) : null}
        <Dato label="Participación" value="Individual" />
      </section>
    </MovilShell>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
