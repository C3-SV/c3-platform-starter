"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import type { AuditView } from "@/lib/server/audit";

/** E6 · Auditoría. Últimas operaciones sensibles registradas: quién, qué y sobre qué. Solo identificadores, sin datos personales. */
export function AuditoriaPanel() {
  const [entries, setEntries] = useState<AuditView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ entries: AuditView[] }>("/api/admin/auditoria").then(
      (data) => {
        if (active) setEntries(data.entries);
      },
      (caught: unknown) => {
        if (active) setError(caught instanceof ApiError ? caught.message : "No pudimos cargar la auditoría.");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) return <div className="c3-alerta c3-alerta--error" role="alert"><strong>{error}</strong></div>;
  if (!entries) return <p style={{ color: "var(--c3-texto-suave)" }}>Cargando la auditoría…</p>;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-labelledby="auditoria-titulo">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h2 id="auditoria-titulo" className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Auditoría</h2>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
          Las últimas {entries.length} operaciones sensibles. Cada registro guarda identificadores, no nombres ni correos.
        </p>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay operaciones registradas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="c3-card" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }} aria-label="Operaciones registradas">
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th scope="col" style={{ padding: "10px 12px" }}>Fecha</th>
                <th scope="col" style={{ padding: "10px 12px" }}>Acción</th>
                <th scope="col" style={{ padding: "10px 12px" }}>Objetivo</th>
                <th scope="col" style={{ padding: "10px 12px" }}>Actor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderTop: "1px solid var(--c3-borde)" }}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDateTime(entry.at) ?? entry.at}</td>
                  <td style={{ padding: "10px 12px" }}>{entry.action}</td>
                  <td style={{ padding: "10px 12px", wordBreak: "break-all" }}>{entry.targetType} · {entry.targetId}</td>
                  <td style={{ padding: "10px 12px", wordBreak: "break-all" }}>{entry.actorUid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
