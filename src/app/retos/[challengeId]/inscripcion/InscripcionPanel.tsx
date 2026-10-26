"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Migas } from "@/components/Migas";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDate, modalityLabel } from "@/lib/domain/format";
import { enrollmentState, KIND_LABEL, type PresentedState } from "@/lib/domain/presentation";
import type { ExperienceKind, ParticipationMode } from "@/lib/domain/types";
import type { EnrollmentView, MyEnrollmentView } from "@/lib/server/participation";
import { EquipoPanel } from "./EquipoPanel";

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

type Enrollment = MyEnrollmentView | EnrollmentView;

/** V06 · Inscripción. Individual o por equipo según lo que acepte el challenge; el equipo se gestiona aquí mismo. */
export function InscripcionPanel({ challenge }: { challenge: InscripcionChallenge }) {
  return (
    <AppShell
      active="explorar"
      signedOut={{
        title: "Entrá para inscribirte",
        text: "Necesitás una cuenta C3 para inscribirte. La revisa C3 antes de habilitarte. Al entrar volvés a esta inscripción.",
        children: <ChallengeDatos challenge={challenge} />,
      }}
    >
      <InscripcionContenido challenge={challenge} />
    </AppShell>
  );
}

function InscripcionContenido({ challenge }: { challenge: InscripcionChallenge }) {
  const { session } = useSession();
  const [enrollment, setEnrollment] = useState<Enrollment | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ParticipationMode>(challenge.allows.includes("individual") ? "individual" : "team");
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
      const data = await apiRequest<{ enrollment: EnrollmentView }>(`/api/retos/${challenge.id}/inscripcion`, {
        method: "POST",
        body: { mode },
      });
      setEnrollment(data.enrollment);
      setNotice(data.enrollment.mode === "team"
        ? "Inscripción enviada. C3 la revisa; después vas a poder crear tu equipo o unirte con un código."
        : "Inscripción enviada. C3 la revisa antes de habilitarte para entregar.");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No pudimos registrar tu inscripción. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const isTeamEnrollment = enrollment?.mode === "team";
  const showIndividual = individual && !isTeamEnrollment;

  return (
    <div className="c3-tarea">
      <Migas items={[{ label: "Explorar", href: "/explorar" }, { label: challenge.title, href: `/retos/${challenge.id}` }, { label: "Inscripción" }]} />

      <section className="c3-tarea__encabezado">
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>{KIND_LABEL[challenge.kind]}</span>
        <h1 className="c3-titulo">{challenge.title}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatePill state={challenge.statePresented} />
          {enrollment ? <StatePill state={enrollmentState(enrollment.status)} /> : null}
        </div>
      </section>

      <div className="c3-tarea__grilla">
        <div className="c3-tarea__columna">
          {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
          {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}
          {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}

          {signedIn && enrollment === undefined && !loadError ? (
            <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando tu inscripción…</p>
          ) : null}

          {signedIn && enrollment === null ? (
            <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="titulo-inscripcion">
              <span id="titulo-inscripcion" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción</span>
              <p style={{ fontSize: 14, lineHeight: 1.5 }}>
                {individual && team
                  ? "Podés inscribirte solo o en equipo. C3 revisa la inscripción antes de habilitarte para entregar."
                  : team
                    ? "Este challenge se inscribe por equipo. Después de la aprobación, creás tu equipo o te unís con un código."
                    : "Participás solo, en un único challenge de esta experiencia. C3 revisa la inscripción antes de habilitarte para entregar."}
              </p>
              {individual && team ? (
                <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <legend className="c3-etiqueta-campo" style={{ marginBottom: 6 }}>Modalidad</legend>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                    <input type="radio" name="modo" value="individual" checked={mode === "individual"} onChange={() => setMode("individual")} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
                    Individual
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                    <input type="radio" name="modo" value="team" checked={mode === "team"} onChange={() => setMode("team")} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
                    Por equipo
                  </label>
                </fieldset>
              ) : null}
              {registrationOpenButton(challenge.registrationOpen, busy, () => void enroll())}
            </section>
          ) : null}

          {signedIn && enrollment && showIndividual ? (
            <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="titulo-individual">
              <span id="titulo-individual" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción individual</span>
              <EnrollmentStatusNote enrollment={enrollment} challengeId={challenge.id} />
            </section>
          ) : null}

          {signedIn && enrollment && isTeamEnrollment ? (
            <section style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="titulo-equipo">
              <span id="titulo-equipo" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Inscripción por equipo</span>
              <EquipoPanel challengeId={challenge.id} enrollmentStatus={enrollment.status} />
            </section>
          ) : null}
        </div>
        <aside className="c3-tarea__columna c3-tarea__lateral">
          <ChallengeDatos challenge={challenge} />
        </aside>
      </div>
    </div>
  );
}

function registrationOpenButton(open: boolean, busy: boolean, onClick: () => void) {
  if (!open) return <span className="c3-btn" aria-disabled="true">Inscripciones cerradas</span>;
  return (
    <button type="button" className="c3-btn c3-btn--primario" disabled={busy} onClick={onClick}>
      {busy ? "Inscribiendo…" : "Inscribirme"}
    </button>
  );
}

function EnrollmentStatusNote({ enrollment, challengeId }: { enrollment: Enrollment; challengeId: string }) {
  if (enrollment.status === "pending") {
    return <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Tu inscripción está en revisión por C3. Te avisamos cuando haya una respuesta: mientras tanto, no tenés nada que hacer.</p>;
  }
  if (enrollment.status === "approved") {
    return (
      <>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>C3 aprobó tu inscripción. Ya podés entregar tu solución.</p>
        <Link href={`/mi-c3/retos/${challengeId}`} className="c3-btn c3-btn--primario">Ir a mi challenge</Link>
      </>
    );
  }
  if (enrollment.status === "rejected") {
    return <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-error)" }}>C3 no aprobó esta inscripción.</p>;
  }
  return <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Cancelaste esta inscripción. No acredita participación ni resultado.</p>;
}

function ChallengeDatos({ challenge }: { challenge: InscripcionChallenge }) {
  const modality = modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize);
  return (
    <section className="c3-card" aria-label="Datos del challenge" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <Dato label="Modalidad" value={modality} />
      {challenge.registrationClosesAt ? <Dato label="Inscripciones cierran" value={formatDate(challenge.registrationClosesAt) ?? ""} /> : null}
      {challenge.submissionClosesAt ? <Dato label="Cierre de entregas" value={formatDate(challenge.submissionClosesAt) ?? ""} /> : null}
      <Dato label="Organización responsable" value={challenge.organizationName} />
      <Dato label="Experiencia" value={challenge.experienceTitle} />
    </section>
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
