"use client";

import { useEffect, useState } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import type { EnrollmentCounts } from "@/lib/domain/lifecycle";
import { enrollmentState } from "@/lib/domain/presentation";
import type { EnrollmentStatus } from "@/lib/domain/types";

interface Row {
  id: string;
  status: EnrollmentStatus;
  mode: "individual" | "team";
  challengeId: string | null;
  userId: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
}

interface Summary {
  capacity: number | null;
  spotsLeft: number | null;
  counts: EnrollmentCounts;
}

/** Qué se revisa: las inscripciones de un reto, o todas las de una experiencia (sin reto). */
export interface EnrollmentTarget {
  kind: "experience" | "challenge";
  id: string;
}

const valueOf = (target: EnrollmentTarget) => `${target.kind}:${target.id}`;

function parseValue(value: string): EnrollmentTarget | null {
  const [kind, ...rest] = value.split(":");
  const id = rest.join(":");
  return (kind === "experience" || kind === "challenge") && id ? { kind, id } : null;
}

/**
 * Revisión de inscripciones. Aprobar habilita (y, en un reto, abre la entrega); rechazar cierra la inscripción y libera
 * el cupo. Las experiencias sin reto se revisan por experiencia, con su ocupación de cupos.
 */
export function InscripcionesPanel({
  challenges,
  experiences,
  initialTarget,
  onChanged,
}: {
  challenges: { id: string; title: string }[];
  /** Experiencias sin retos: se inscriben directamente a la experiencia. */
  experiences: { id: string; title: string }[];
  initialTarget?: EnrollmentTarget | null;
  onChanged?: () => void;
}) {
  const [selected, setSelected] = useState(initialTarget ? valueOf(initialTarget) : "");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const options = [
    ...challenges.map((item) => ({ value: valueOf({ kind: "challenge", id: item.id }), label: item.title, group: "Retos" })),
    ...experiences.map((item) => ({ value: valueOf({ kind: "experience", id: item.id }), label: item.title, group: "Experiencias sin reto" })),
  ];
  const current = options.some((option) => option.value === selected) ? selected : (options[0]?.value ?? "");
  const target = parseValue(current);
  const url = target
    ? target.kind === "experience"
      ? `/api/admin/inscripciones?experienceId=${encodeURIComponent(target.id)}`
      : `/api/admin/inscripciones?challengeId=${encodeURIComponent(target.id)}`
    : null;

  // Carga las inscripciones de lo elegido; el estado llega en la respuesta.
  useEffect(() => {
    if (!url) return;
    let active = true;
    apiRequest<{ enrollments: Row[]; summary?: Summary }>(url).then(
      (data) => {
        if (!active) return;
        setRows(data.enrollments);
        setSummary(data.summary ?? null);
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
  }, [url]);

  async function reload() {
    if (!url) return;
    try {
      const data = await apiRequest<{ enrollments: Row[]; summary?: Summary }>(url);
      setRows(data.enrollments);
      setSummary(data.summary ?? null);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar las inscripciones. Intentá de nuevo.");
    }
  }

  async function review(row: Row, status: "approved" | "rejected") {
    setActionError(null);
    setNotice(null);
    setBusyId(row.id);
    try {
      await apiRequest(`/api/admin/inscripciones/${row.id}`, { method: "PATCH", body: { status } });
      setNotice(status === "approved"
        ? (row.challengeId ? "Inscripción aprobada. La persona ya puede entregar." : "Inscripción aprobada.")
        : "Inscripción rechazada. El cupo queda libre.");
      await reload();
      onChanged?.();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No pudimos registrar la revisión. Intentá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  if (options.length === 0) {
    return (
      <div className="c3-card" style={{ padding: 24 }}>
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay retos ni experiencias para revisar. Creá uno en «Experiencias y retos».</p>
      </div>
    );
  }

  const groups = [...new Set(options.map((option) => option.group))];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Inscripciones y equipos</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>
          Revisá las inscripciones pendientes de cada reto, o de cada experiencia que no tiene retos. Aprobar confirma el lugar; rechazar lo libera.
        </p>
      </div>

      <label htmlFor="ins-reto" className="c3-etiqueta-campo">Reto o experiencia</label>
      <select
        id="ins-reto"
        className="c3-campo"
        value={current}
        onChange={(event) => {
          // Elegir lo que ya estaba elegido no recarga: no hay cambio de dirección y la lista quedaría «cargando».
          if (event.target.value === current) return;
          setSelected(event.target.value);
          setRows(null);
          setSummary(null);
          setNotice(null);
          setActionError(null);
          setLoadError(null);
        }}
        style={{ maxWidth: 520 }}
      >
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {options.filter((option) => option.group === group).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </optgroup>
        ))}
      </select>

      {summary ? (
        <section className="c3-card" aria-label="Cupos e inscripciones" style={{ padding: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Figure label="Pendientes" value={summary.counts.pending} />
          <Figure label="Aprobadas" value={summary.counts.approved} />
          <Figure label="Rechazadas o canceladas" value={summary.counts.rejected + summary.counts.cancelled} />
          <Figure label="Cupos" value={summary.capacity === null ? "Sin límite" : `${summary.counts.active} de ${summary.capacity} · ${summary.spotsLeft} libres`} />
        </section>
      ) : null}

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
          <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
            {target?.kind === "experience" ? "Todavía nadie se inscribió a esta experiencia." : "Todavía nadie se inscribió a este reto."}
          </p>
        </div>
      ) : null}

      {rows && rows.length > 0 ? (
        <section className="c3-card" style={{ overflow: "hidden" }} aria-label="Inscripciones">
          {rows.map((row) => (
            <div key={row.id} role="group" aria-label={row.email ?? row.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "16px 20px", borderTop: "1px solid var(--c3-borde)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{row.displayName ?? "Sin nombre"}</span>
                <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{row.email ?? row.userId} · {row.mode === "team" ? "Por equipo" : "Individual"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <StatePill state={enrollmentState(row.status)} />
                {row.status === "pending" ? (
                  <>
                    <button type="button" className="c3-btn c3-btn--primario" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} disabled={busyId === row.id} onClick={() => void review(row, "approved")}>
                      Aprobar
                    </button>
                    <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} disabled={busyId === row.id} onClick={() => void review(row, "rejected")}>
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

function Figure({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{label}</span>
      <strong style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
    </div>
  );
}
