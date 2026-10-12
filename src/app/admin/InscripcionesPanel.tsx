"use client";

import { useEffect, useState } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import { enrollmentState } from "@/lib/domain/presentation";
import type { EnrollmentStatus } from "@/lib/domain/types";

interface Row {
  id: string;
  status: EnrollmentStatus;
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
}

/** Revisión de inscripciones de un reto. Aprobar habilita la entrega; rechazar cierra la inscripción. */
export function InscripcionesPanel({ challenges }: { challenges: { id: string; title: string }[] }) {
  const [selected, setSelected] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const challengeId = challenges.some((item) => item.id === selected) ? selected : (challenges[0]?.id ?? "");

  // Carga las inscripciones del reto elegido; el estado llega en la respuesta.
  useEffect(() => {
    if (!challengeId) return;
    let active = true;
    apiRequest<{ enrollments: Row[] }>(`/api/admin/inscripciones?challengeId=${encodeURIComponent(challengeId)}`).then(
      (data) => {
        if (!active) return;
        setRows(data.enrollments);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar las inscripciones. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  async function reload() {
    try {
      const data = await apiRequest<{ enrollments: Row[] }>(`/api/admin/inscripciones?challengeId=${encodeURIComponent(challengeId)}`);
      setRows(data.enrollments);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar las inscripciones. Intentá de nuevo.");
    }
  }

  async function review(id: string, status: "approved" | "rejected") {
    setActionError(null);
    setNotice(null);
    setBusyId(id);
    try {
      await apiRequest(`/api/admin/inscripciones/${id}`, { method: "PATCH", body: { status } });
      setNotice(status === "approved" ? "Inscripción aprobada. La persona ya puede entregar." : "Inscripción rechazada.");
      await reload();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No pudimos registrar la revisión. Intentá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  if (challenges.length === 0) {
    return (
      <div className="c3-card" style={{ padding: 24 }}>
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay retos para revisar. Creá un reto en «Experiencias y retos».</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Inscripciones y equipos</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Revisá las inscripciones pendientes de cada reto. Por ahora la modalidad es individual.</p>
      </div>

      <label htmlFor="ins-reto" className="c3-etiqueta-campo">Reto</label>
      <select id="ins-reto" className="c3-campo" value={challengeId} onChange={(event) => setSelected(event.target.value)} style={{ maxWidth: 520 }}>
        {challenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}
      {loadError ? (
        <div className="c3-alerta c3-alerta--error" role="alert">
          <strong>No pudimos cargar las inscripciones</strong>
          <span style={{ fontSize: 14 }}>{loadError}</span>
        </div>
      ) : null}

      {rows === null && !loadError ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando inscripciones…</p> : null}

      {rows && rows.length === 0 ? (
        <div className="c3-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía nadie se inscribió a este reto.</p>
        </div>
      ) : null}

      {rows && rows.length > 0 ? (
        <section className="c3-card" style={{ overflow: "hidden" }} aria-label="Inscripciones del reto">
          {rows.map((row) => (
            <div key={row.id} role="group" aria-label={row.email ?? row.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "16px 20px", borderTop: "1px solid var(--c3-borde)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{row.displayName ?? "Sin nombre"}</span>
                <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{row.email ?? row.userId}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <StatePill state={enrollmentState(row.status)} />
                {row.status === "pending" ? (
                  <>
                    <button type="button" className="c3-btn c3-btn--primario" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} disabled={busyId === row.id} onClick={() => void review(row.id, "approved")}>
                      Aprobar
                    </button>
                    <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} disabled={busyId === row.id} onClick={() => void review(row.id, "rejected")}>
                      Rechazar
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
