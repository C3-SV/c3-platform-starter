"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { KIND_LABEL, presentState } from "@/lib/domain/presentation";
import type { Challenge, Experience, ExperienceStatus } from "@/lib/domain/types";
import { ChallengeForm, ExperienceForm } from "./forms";
import { InscripcionesPanel } from "./InscripcionesPanel";
import { PropuestasPanel } from "./PropuestasPanel";
import { JuradosPanel } from "./JuradosPanel";
import { ResultadosPanel } from "./ResultadosPanel";

interface Catalog {
  experiences: Experience[];
  challenges: Challenge[];
  organizations: { id: string; name: string }[];
}

type Section = "experiencias" | "propuestas" | "inscripciones" | "entregas" | "jurados" | "resultados";

const NAV: { id: Section; label: string; pending?: string }[] = [
  { id: "propuestas", label: "Propuestas" },
  { id: "experiencias", label: "Experiencias y retos" },
  { id: "inscripciones", label: "Inscripciones y equipos" },
  { id: "entregas", label: "Entregas", pending: "Corte 6" },
  { id: "jurados", label: "Jurados y rúbricas" },
  { id: "resultados", label: "Resultados oficiales" },
];

/** V12 · C3 Admin. Esta versión implementa «Experiencias y retos»; las demás secciones quedan marcadas como pendientes. */
export function AdminPanel() {
  const { session, signOut } = useSession();
  const [section, setSection] = useState<Section>("experiencias");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const load = useCallback(async () => {
    try {
      setCatalog(await apiRequest<Catalog>("/api/admin/catalogo"));
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el catálogo. Intentá de nuevo.");
    }
  }, []);

  const isAdmin = session.status === "signed-in" && session.user.isAdmin;

  // Carga inicial: las actualizaciones de estado ocurren en las respuestas, no dentro del efecto.
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    apiRequest<Catalog>("/api/admin/catalogo").then(
      (data) => {
        if (!active) return;
        setCatalog(data);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el catálogo. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [isAdmin]);

  if (session.status === "loading") return <Centered>Cargando…</Centered>;
  if (session.status === "unavailable") return <Centered>{session.message}</Centered>;
  if (session.status === "signed-out") {
    return (
      <Centered>
        <p>Entrá con una cuenta de administrador de C3 para continuar.</p>
        <Link href="/acceso?next=/admin" className="c3-btn c3-btn--primario" style={{ marginTop: 16 }}>Entrar</Link>
      </Centered>
    );
  }
  if (!session.user.isAdmin) {
    return (
      <Centered>
        <p>Esta sección es solo para el equipo administrador de C3.</p>
        <Link href="/" style={{ marginTop: 16, display: "inline-block" }}>Volver al inicio</Link>
      </Centered>
    );
  }

  async function changeStatus(kind: "experiencia" | "reto", id: string, status: ExperienceStatus) {
    setActionError(null);
    setNotice(null);
    setBusyId(id);
    try {
      if (kind === "experiencia") {
        await apiRequest(`/api/admin/experiencias/${id}`, { method: "PATCH", body: { status } });
      } else {
        await apiRequest(`/api/admin/retos/${id}`, { method: "PATCH", body: { status } });
      }
      setNotice(status === "published" ? "Publicado. Ya aparece en el catálogo público." : "Estado actualizado.");
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No pudimos cambiar el estado. Intentá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  const experienceOptions = catalog?.experiences.map((item) => ({ id: item.id, title: item.title })) ?? [];

  return (
    <div>
      <header style={{ background: "var(--c3-navy)", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", minHeight: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Link href="/" className="c3-logo" style={{ fontSize: 24 }} aria-label="C3, ir al sitio público">C3</Link>
            <span className="c3-etiqueta" style={{ color: "var(--c3-texto-cabecera)", borderLeft: "1px solid var(--c3-navy-claro)", paddingLeft: 20 }}>Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "var(--c3-texto-cabecera)" }}>{session.user.email}</span>
            <button
              type="button"
              className="c3-etiqueta"
              onClick={() => void signOut()}
              style={{ background: "none", border: 0, color: "#ffffff", cursor: "pointer", padding: "12px 8px" }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: 32, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        <nav aria-label="Secciones de administración" className="c3-card" style={{ flex: "1 1 240px", maxWidth: 280, minWidth: 220, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => {
            const active = item.id === section;
            if (item.pending) {
              return (
                <span key={item.id} aria-disabled="true" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "12px 14px", fontSize: 14, color: "var(--c3-texto-suave)" }}>
                  <span>{item.label}</span>
                  <span className="c3-pill c3-pill--neutro">{item.pending}</span>
                </span>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setSection(item.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  borderRadius: 6,
                  border: 0,
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#ffffff" : "var(--c3-texto)",
                  background: active ? "var(--c3-accion)" : "transparent",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <main style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          {section === "propuestas" ? (
            <PropuestasPanel organizations={catalog?.organizations ?? []} onChanged={() => void load()} />
          ) : null}

          {section === "inscripciones" ? (
            catalog ? (
              <InscripcionesPanel challenges={catalog.challenges.map((item) => ({ id: item.id, title: item.title }))} />
            ) : (
              <p style={{ color: "var(--c3-texto-suave)" }}>Cargando retos…</p>
            )
          ) : null}

          {section === "jurados" ? (
            catalog ? (
              <JuradosPanel challenges={catalog.challenges.map((item) => ({ id: item.id, title: item.title, rubric: item.rubric }))} />
            ) : (
              <p style={{ color: "var(--c3-texto-suave)" }}>Cargando retos…</p>
            )
          ) : null}

          {section === "resultados" ? (
            catalog ? (
              <ResultadosPanel challenges={catalog.challenges.map((item) => ({ id: item.id, title: item.title }))} />
            ) : (
              <p style={{ color: "var(--c3-texto-suave)" }}>Cargando retos…</p>
            )
          ) : null}

          {section !== "experiencias" && section !== "inscripciones" && section !== "propuestas" && section !== "jurados" && section !== "resultados" ? <PendingSection label={NAV.find((item) => item.id === section)?.label ?? ""} /> : null}

          {section === "experiencias" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias y retos</h1>
                <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>
                  Todo se guarda como borrador. Solo aparece en el sitio público cuando lo publicás.
                </p>
              </div>

              {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
              {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}

              {loadError ? (
                <div className="c3-alerta c3-alerta--error" role="alert">
                  <strong>No pudimos cargar el catálogo</strong>
                  <span style={{ fontSize: 14 }}>{loadError}</span>
                  <button type="button" className="c3-btn c3-btn--contorno" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => void load()}>Reintentar</button>
                </div>
              ) : null}

              {!catalog && !loadError ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando catálogo…</p> : null}

              {catalog ? (
                <>
                  {catalog.experiences.length === 0 ? (
                    <div className="c3-card" style={{ padding: 24 }}>
                      <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay experiencias. Creá la primera abajo.</p>
                    </div>
                  ) : null}

                  {catalog.experiences.map((experience) => {
                    const challenges = catalog.challenges.filter((challenge) => challenge.experienceId === experience.id);
                    const window = { opensAt: experience.registrationOpensAt, closesAt: experience.registrationClosesAt };
                    return (
                      <section key={experience.id} className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }} aria-label={experience.title}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{KIND_LABEL[experience.kind]}</span>
                            <h2 className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{experience.title}</h2>
                          </div>
                          <StatePill state={presentState(experience.status, window, now)} />
                        </div>
                        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{experience.summary}</p>
                        {experience.registrationClosesAt ? (
                          <p style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>Inscripciones hasta el {formatDateTime(experience.registrationClosesAt)}</p>
                        ) : null}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <StatusButtons
                            busy={busyId === experience.id}
                            status={experience.status}
                            onChange={(status) => void changeStatus("experiencia", experience.id, status)}
                          />
                        </div>

                        <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                          <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Retos</span>
                          {challenges.length === 0 ? (
                            <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Esta experiencia todavía no tiene retos.</p>
                          ) : null}
                          {challenges.map((challenge) => (
                            <div key={challenge.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 0", borderTop: "1px solid var(--c3-borde)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                                <span style={{ fontSize: 16, fontWeight: 600 }}>{challenge.title}</span>
                                <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>
                                  {challenge.organizationName}
                                  {challenge.submissionClosesAt ? ` · Entregas hasta el ${formatDateTime(challenge.submissionClosesAt)}` : ""}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <StatePill state={presentState(challenge.status, window, now)} />
                                <StatusButtons
                                  busy={busyId === challenge.id}
                                  status={challenge.status}
                                  onChange={(status) => void changeStatus("reto", challenge.id, status)}
                                  compact
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}

                  <ExperienceForm
                    onCreated={(message) => {
                      setNotice(message);
                      void load();
                    }}
                  />
                  <ChallengeForm
                    experiences={experienceOptions}
                    organizations={catalog.organizations}
                    onCreated={(message) => {
                      setNotice(message);
                      void load();
                    }}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function StatusButtons({
  status,
  busy,
  onChange,
  compact = false,
}: {
  status: ExperienceStatus;
  busy: boolean;
  onChange: (status: ExperienceStatus) => void;
  compact?: boolean;
}) {
  const style = compact ? { minHeight: 40, padding: "0 14px", fontSize: 12 } : undefined;
  if (status === "cancelled") return null;
  return (
    <>
      {status === "draft" ? (
        <button type="button" className="c3-btn c3-btn--primario" style={style} disabled={busy} onClick={() => onChange("published")}>
          {busy ? "Guardando…" : "Publicar"}
        </button>
      ) : null}
      {status === "published" ? (
        <>
          <button type="button" className="c3-btn c3-btn--contorno" style={style} disabled={busy} onClick={() => onChange("draft")}>
            Pasar a borrador
          </button>
          <button type="button" className="c3-btn c3-btn--contorno" style={style} disabled={busy} onClick={() => onChange("closed")}>
            Marcar concluida
          </button>
        </>
      ) : null}
    </>
  );
}

function PendingSection({ label }: { label: string }) {
  return (
    <div className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
      <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>{label}</h1>
      <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
        Esta sección todavía no está implementada. Se habilita en el corte indicado en el menú.
      </p>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      {children}
    </div>
  );
}
