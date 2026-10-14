"use client";

import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/client/api";

interface Dashboard {
  experiences: number;
  proposals: number;
  pendingEnrollments: number;
  submissions: number;
  evaluations: number;
}

export function ResumenPanel() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setData(await apiRequest<Dashboard>("/api/admin/resumen"));
      setError(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el resumen. Intentá de nuevo.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Resumen</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Una vista operativa del estado actual de C3.</p>
      </div>
      {error ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>No pudimos cargar el resumen</strong><span>{error}</span><button type="button" className="c3-btn c3-btn--contorno" onClick={() => void load()}>Reintentar</button></div> : null}
      {!data && !error ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando resumen…</p> : null}
      {data ? (
        <div className="c3-grilla-tres">
          {[
            ["Experiencias", data.experiences],
            ["Propuestas", data.proposals],
            ["Inscripciones pendientes", data.pendingEnrollments],
            ["Entregas", data.submissions],
            ["Evaluaciones", data.evaluations],
          ].map(([label, value]) => (
            <div key={label} className="c3-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{label}</span>
              <strong style={{ fontFamily: "var(--c3-font-titulo)", fontSize: 32, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
