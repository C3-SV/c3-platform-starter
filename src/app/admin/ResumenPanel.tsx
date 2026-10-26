"use client";

import Link from "next/link";
import { adminHref, type AdminSectionId } from "@/lib/domain/admin-nav";
import { useAdminData } from "./AdminData";

interface Metric {
  label: string;
  value: number;
  section: AdminSectionId;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Resumen operativo: primero lo que C3 debe atender (con enlace directo a esa sección) y después los totales, que
 * también llevan a su sección. Los datos son los compartidos de la consola; no se piden aparte.
 */
export function ResumenPanel() {
  const { summary, summaryError, reloadSummary } = useAdminData();

  const attention: { text: string; section: AdminSectionId }[] = [];
  if (summary && summary.pendingProposals > 0) attention.push({ text: `${plural(summary.pendingProposals, "propuesta", "propuestas")} por revisar`, section: "propuestas" });
  if (summary && summary.pendingEnrollments > 0) attention.push({ text: `${plural(summary.pendingEnrollments, "inscripción", "inscripciones")} por revisar`, section: "inscripciones" });

  const metrics: Metric[] = summary
    ? [
        { label: "Experiencias", value: summary.experiences, section: "experiencias" },
        { label: "Propuestas", value: summary.proposals, section: "propuestas" },
        { label: "Inscripciones pendientes", value: summary.pendingEnrollments, section: "inscripciones" },
        { label: "Entregas", value: summary.submissions, section: "entregas" },
        { label: "Evaluaciones", value: summary.evaluations, section: "resultados" },
      ]
    : [];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Resumen</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Una vista operativa del estado actual de C3.</p>
      </div>

      {summaryError ? (
        <div className="c3-alerta c3-alerta--error" role="alert">
          <strong>No pudimos cargar el resumen</strong>
          <span>{summaryError}</span>
          <button type="button" className="c3-btn c3-btn--contorno" onClick={() => void reloadSummary()}>Reintentar</button>
        </div>
      ) : null}
      {!summary && !summaryError ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando resumen…</p> : null}

      {summary ? (
        <>
          <section className="c3-card c3-admin__atencion" aria-labelledby="admin-atencion">
            <h2 id="admin-atencion" className="c3-titulo">Requiere atención</h2>
            {attention.length === 0 ? (
              <p className="c3-admin__atencion-vacio">No hay pendientes: todas las propuestas e inscripciones están revisadas.</p>
            ) : (
              <ul>
                {attention.map((item) => (
                  <li key={item.section}>
                    <Link href={adminHref(item.section)} className="c3-admin__atencion-enlace">
                      <span>{item.text}</span>
                      <span aria-hidden="true">Revisar →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="c3-grilla-tres">
            {metrics.map((metric) => (
              <Link key={metric.label} href={adminHref(metric.section)} className="c3-card c3-admin__metrica">
                <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{metric.label}</span>
                <strong>{metric.value}</strong>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
