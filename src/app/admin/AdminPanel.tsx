"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import type { AdminCatalog } from "@/lib/server/catalog";
import { ExperienciasPanel } from "./ExperienciasPanel";
import { InscripcionesPanel, type EnrollmentTarget } from "./InscripcionesPanel";
import { PropuestasPanel } from "./PropuestasPanel";
import { JuradosPanel } from "./JuradosPanel";
import { ResultadosPanel } from "./ResultadosPanel";
import { ResumenPanel } from "./ResumenPanel";
import { EntregasPanel } from "./EntregasPanel";

type Section = "resumen" | "experiencias" | "propuestas" | "inscripciones" | "entregas" | "jurados" | "resultados";

const NAV: { id: Section; label: string; pending?: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "propuestas", label: "Propuestas" },
  { id: "experiencias", label: "Experiencias y retos" },
  { id: "inscripciones", label: "Inscripciones y equipos" },
  { id: "entregas", label: "Entregas" },
  { id: "jurados", label: "Jurados y rúbricas" },
  { id: "resultados", label: "Resultados oficiales" },
];

/** V12 · C3 Admin. Esta versión implementa «Experiencias y retos»; las demás secciones quedan marcadas como pendientes. */
export function AdminPanel() {
  const { session, signOut } = useSession();
  const [section, setSection] = useState<Section>("experiencias");
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrollmentTarget, setEnrollmentTarget] = useState<EnrollmentTarget | null>(null);

  const load = useCallback(async () => {
    try {
      setCatalog(await apiRequest<AdminCatalog>("/api/admin/catalogo"));
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
    apiRequest<AdminCatalog>("/api/admin/catalogo").then(
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
          {section === "resumen" ? <ResumenPanel /> : null}

          {section === "propuestas" ? (
            <PropuestasPanel organizations={catalog?.organizations ?? []} onChanged={() => void load()} />
          ) : null}

          {section === "inscripciones" ? (
            catalog ? (
              <InscripcionesPanel
                key={enrollmentTarget ? `${enrollmentTarget.kind}:${enrollmentTarget.id}` : "sin-seleccion"}
                challenges={catalog.challenges.map((item) => ({ id: item.id, title: item.title }))}
                experiences={catalog.experiences
                  .filter((item) => !catalog.challenges.some((challenge) => challenge.experienceId === item.id))
                  .map((item) => ({ id: item.id, title: item.title }))}
                initialTarget={enrollmentTarget}
                onChanged={() => void load()}
              />
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

          {section === "entregas" ? (
            catalog ? <EntregasPanel challenges={catalog.challenges.map((item) => ({ id: item.id, title: item.title }))} /> : <p style={{ color: "var(--c3-texto-suave)" }}>Cargando retos…</p>
          ) : null}

          {section !== "resumen" && section !== "experiencias" && section !== "inscripciones" && section !== "propuestas" && section !== "entregas" && section !== "jurados" && section !== "resultados" ? <PendingSection label={NAV.find((item) => item.id === section)?.label ?? ""} /> : null}

          {section === "experiencias" ? (
            <>
              {loadError ? (
                <div className="c3-alerta c3-alerta--error" role="alert">
                  <strong>No pudimos cargar el catálogo</strong>
                  <span style={{ fontSize: 14 }}>{loadError}</span>
                  <button type="button" className="c3-btn c3-btn--contorno" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => void load()}>Reintentar</button>
                </div>
              ) : null}
              {!catalog && !loadError ? (
                <>
                  <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias y retos</h1>
                  <p style={{ color: "var(--c3-texto-suave)" }}>Cargando catálogo…</p>
                </>
              ) : null}
              {catalog ? (
                <ExperienciasPanel
                  catalog={catalog}
                  onChanged={() => void load()}
                  onOpenEnrollments={(target) => {
                    setEnrollmentTarget(target);
                    setSection("inscripciones");
                  }}
                />
              ) : null}
            </>
          ) : null}
        </main>
      </div>
    </div>
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
