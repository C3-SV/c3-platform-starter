"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MovilShell } from "@/components/MovilShell";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDate, modalityLabel } from "@/lib/domain/format";
import { enrollmentState, KIND_LABEL, type PresentedState } from "@/lib/domain/presentation";
import type { ExperienceKind, ParticipationMode } from "@/lib/domain/types";
import type { EnrollmentView, MyEnrollmentView } from "@/lib/server/participation";

export interface InscripcionChallenge {
  id: string;
  title: string;
  organizationName: string;
  allows: ParticipationMode[];
  teamMinSize: number | null;
  teamMaxSize: number | null;
  kind: ExperienceKind;
  experienceTitle: string;
  statePresented: PresentedState;
  registrationOpen: boolean;
  registrationClosesAt: string | null;
  submissionClosesAt: string | null;
}

/** V06 · Inscripción. Esta versión implementa la inscripción individual; la de equipos se marca como pendiente. */
export function InscripcionPanel({ challenge }: { challenge: InscripcionChallenge }) {
  const { session } = useSession();
  const [enrollment, setEnrollment] = useState<MyEnrollmentView | EnrollmentView | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signedIn = session.status === "signed-in";
  const individual = challenge.allows.includes("individual");
  const team = challenge.allows.includes("team");

  // Carga la inscripción propia; las actualizaciones ocurren en las respuestas.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ enrollments: MyEnrollmentView[] }>("/api/mi-c3").then(
      (data) => {
        if (!active) return;
        setEnrollment(data.enrollments.find((item) => item.challengeId === challenge.id) ?? null);
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
  }, [signedIn, challenge.id]);

  async function enroll() {
    setFormError(null);
    setNotice(null);
    setBusy(true);
    try {
      const data = await apiRequest<{ enrollment: EnrollmentView }>(`/api/retos/${challenge.id}/inscripcion`, { method: "POST" });
      setEnrollment(data.enrollment);
      setNotice("Inscripción enviada. C3 la revisa antes de habilitarte para entregar.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No pudimos registrar tu inscripción. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const modality = modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize);

  return (
    <MovilShell backHref="/mi-c3">
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>{KIND_LABEL[challenge.kind]}</span>
        <h1 className="c3-titulo" style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700 }}>{challenge.title}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatePill state={challenge.statePresented} />
          {enrollment ? <StatePill state={enrollmentState(enrollment.status)} /> : null}
        </div>
      </section>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}

      {individual ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="titulo-individual">
          <span id="titulo-individual" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción individual</span>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>
            Participás solo, en un único reto de esta experiencia. C3 revisa la inscripción antes de habilitarte para entregar.
          </p>

          {session.status === "loading" ? <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando…</p> : null}

          {session.status === "signed-out" ? (
            <Link href={`/acceso?next=/retos/${challenge.id}/inscripcion`} className="c3-btn c3-btn--primario">Entrar para inscribirme</Link>
          ) : null}

          {signedIn && enrollment === undefined && !loadError ? (
            <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando tu inscripción…</p>
          ) : null}

          {signedIn && enrollment ? <EnrollmentStatusNote enrollment={enrollment} challengeId={challenge.id} /> : null}

          {signedIn && enrollment === null ? (
            challenge.registrationOpen ? (
              <button type="button" className="c3-btn c3-btn--primario" disabled={busy} onClick={() => void enroll()}>
                {busy ? "Inscribiendo…" : "Inscribirme"}
              </button>
            ) : (
              <span className="c3-btn" aria-disabled="true">Inscripciones cerradas</span>
            )
          ) : null}
        </section>
      ) : null}

      {team ? (
        <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }} aria-labelledby="titulo-equipo">
          <span id="titulo-equipo" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Equipo</span>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
            La inscripción por equipos (crear un equipo, sumar integrantes con código) llega en el siguiente corte. Por ahora se inscribe de forma individual.
          </p>
          <span className="c3-pill c3-pill--neutro" style={{ alignSelf: "flex-start" }}>Próximo corte</span>
        </section>
      ) : null}

      <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <Dato label="Modalidad" value={modality} />
        {challenge.registrationClosesAt ? <Dato label="Inscripciones cierran" value={formatDate(challenge.registrationClosesAt) ?? ""} /> : null}
        {challenge.submissionClosesAt ? <Dato label="Cierre de entregas" value={formatDate(challenge.submissionClosesAt) ?? ""} /> : null}
        <Dato label="Organización responsable" value={challenge.organizationName} />
        <Dato label="Experiencia" value={challenge.experienceTitle} />
      </section>
    </MovilShell>
  );
}

function EnrollmentStatusNote({ enrollment, challengeId }: { enrollment: MyEnrollmentView | EnrollmentView; challengeId: string }) {
  if (enrollment.status === "pending") {
    return <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Tu inscripción está en revisión por C3. Te avisamos cuando haya una respuesta: mientras tanto, no tenés nada que hacer.</p>;
  }
  if (enrollment.status === "approved") {
    return (
      <>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>C3 aprobó tu inscripción. Ya podés entregar tu solución.</p>
        <Link href={`/mi-c3/retos/${challengeId}`} className="c3-btn c3-btn--primario">Ir a mi reto</Link>
      </>
    );
  }
  if (enrollment.status === "rejected") {
    return <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-error)" }}>C3 no aprobó esta inscripción.</p>;
  }
  return <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Cancelaste esta inscripción. No acredita participación ni resultado.</p>;
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
