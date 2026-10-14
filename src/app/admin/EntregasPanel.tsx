"use client";

import { useEffect, useMemo, useState } from "react";
import { StatePill } from "@/components/StatePill";
import { ApiError, apiRequest } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";

interface DeliveryRow {
  id: string;
  challengeId: string;
  challengeTitle: string;
  experienceTitle: string;
  status: "draft" | "submitted";
  mode: "individual" | "team";
  teamId: string | null;
  teamName: string | null;
  participantIds: string[];
  participantNames: string[];
  authorized: boolean;
  textPreview: string;
  links: string[];
  updatedAt: string;
  submittedAt: string | null;
}

export function EntregasPanel({ challenges }: { challenges: { id: string; title: string }[] }) {
  const [rows, setRows] = useState<DeliveryRow[] | null>(null);
  const [selected, setSelected] = useState("all");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows((await apiRequest<{ deliveries: DeliveryRow[] }>("/api/admin/entregas")).deliveries);
      setError(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las entregas. Intentá de nuevo.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => selected === "all" ? rows : rows?.filter((row) => row.challengeId === selected), [rows, selected]);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Entregas</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Consulta de entregas y su trazabilidad. Esta vista no modifica el contenido entregado.</p>
      </div>
      {challenges.length > 0 ? (
        <label htmlFor="admin-entregas-reto" className="c3-etiqueta-campo">
          Reto
          <select id="admin-entregas-reto" className="c3-campo" value={selected} onChange={(event) => setSelected(event.target.value)} style={{ display: "block", maxWidth: 520, marginTop: 8 }}>
            <option value="all">Todos los retos</option>
            {challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}
          </select>
        </label>
      ) : null}
      {error ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>No pudimos cargar las entregas</strong><span>{error}</span><button type="button" className="c3-btn c3-btn--contorno" onClick={() => void load()}>Reintentar</button></div> : null}
      {rows === null && !error ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando entregas…</p> : null}
      {filtered?.length === 0 ? <div className="c3-card" style={{ padding: 24 }}><p style={{ color: "var(--c3-texto-suave)" }}>Todavía no hay entregas para consultar.</p></div> : null}
      {filtered && filtered.length > 0 ? (
        <section className="c3-card" style={{ overflow: "hidden" }} aria-label="Listado de entregas">
          {filtered.map((row) => (
            <article key={row.id} style={{ padding: 20, borderTop: "1px solid var(--c3-borde)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <h2 className="c3-titulo" style={{ fontSize: 19, lineHeight: 1.3, fontWeight: 600 }}>{row.challengeTitle}</h2>
                  <p style={{ marginTop: 4, fontSize: 13, color: "var(--c3-texto-suave)" }}>{row.experienceTitle} · {row.mode === "team" ? "Equipo " + (row.teamName ?? "sin nombre") : "Individual"}</p>
                </div>
                <StatePill state={row.status === "submitted" ? { label: "Entregada", tone: "exito" } : { label: "Borrador", tone: "advertencia" }} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55 }}>{row.textPreview || "Sin descripción todavía."}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--c3-texto-suave)" }}>
                <span>Participantes autorizados: {row.participantNames.join(", ") || "Sin datos"}{row.authorized ? "" : " · revisar autorización"}</span>
                <span>Actualizada: {row.updatedAt ? formatDateTime(row.updatedAt) : "Sin fecha"}{row.submittedAt ? " · enviada " + formatDateTime(row.submittedAt) : ""}</span>
                <span>Enlaces: {row.links.length}</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
