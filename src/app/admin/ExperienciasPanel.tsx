"use client";

import { useMemo, useState } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import { experienceLinesOf } from "@/lib/domain/catalog";
import { formatDate, formatDateTime, formatSession } from "@/lib/domain/format";
import {
  emptyEnrollmentCounts,
  lifecycleOf,
  nextActionsOf,
  registrationPhase,
  spotsLeft,
  type ExperienceStats,
  type LifecycleStage,
} from "@/lib/domain/lifecycle";
import { experienceLabel, LINE_NAME, MODALITY_LABEL, presentState, type PresentedState } from "@/lib/domain/presentation";
import type { Challenge, Experience, ExperienceLine, ExperienceStatus } from "@/lib/domain/types";
import type { AdminCatalog } from "@/lib/server/catalog";
import { ChallengeForm, ExperienceForm } from "./forms";
import type { EnrollmentTarget } from "./InscripcionesPanel";

type StatusFilter = "todos" | ExperienceStatus;
type LineFilter = "todas" | ExperienceLine;

const STAGE_TONE: Record<LifecycleStage, PresentedState["tone"]> = {
  borrador: "neutro",
  publicada: "neutro",
  inscripciones_abiertas: "info",
  inscripciones_cerradas: "advertencia",
  en_desarrollo: "info",
  concluida: "exito",
  cancelada: "error",
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicadas" },
  { value: "closed", label: "Concluidas" },
  { value: "cancelled", label: "Canceladas" },
];

/** Minúsculas y sin tildes: la búsqueda por nombre no distingue «Programación» de «programacion». */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface Confirmation {
  id: string;
  status: ExperienceStatus;
  confirmLabel: string;
  message: string;
  success: string;
}

const noStats: ExperienceStats = { challenges: 0, enrollments: emptyEnrollmentCounts() };

/** «Experiencias y retos»: listado con búsqueda y filtros, edición, ciclo de vida, retos e inscripciones de cada experiencia. */
export function ExperienciasPanel({
  catalog,
  onChanged,
  onOpenEnrollments,
}: {
  catalog: AdminCatalog;
  onChanged: () => void;
  onOpenEnrollments: (target: EnrollmentTarget) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [lineFilter, setLineFilter] = useState<LineFilter>("todas");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Confirmation | null>(null);
  const [reopening, setReopening] = useState<{ id: string; closesAt: string } | null>(null);

  const statsOf = (id: string): ExperienceStats => catalog.stats[id] ?? noStats;
  const editing = catalog.experiences.find((item) => item.id === editingId) ?? null;
  const filtersActive = query.trim() !== "" || statusFilter !== "todos" || lineFilter !== "todas";

  const visible = useMemo(() => {
    const text = normalize(query.trim());
    return catalog.experiences.filter((experience) => (
      (!text || normalize(experience.title).includes(text))
      && (statusFilter === "todos" || experience.status === statusFilter)
      && (lineFilter === "todas" || experienceLinesOf(experience).includes(lineFilter))
    ));
  }, [catalog.experiences, query, statusFilter, lineFilter]);

  // Los retos solo se agregan a experiencias que no concluyeron ni se cancelaron.
  const experienceOptions = catalog.experiences
    .filter((item) => item.status !== "closed" && item.status !== "cancelled")
    .map((item) => ({ id: item.id, title: item.title }));

  async function run(id: string, request: () => Promise<unknown>, success: string, failure: string) {
    setActionError(null);
    setNotice(null);
    setBusyId(id);
    try {
      await request();
      setNotice(success);
      setConfirming(null);
      setReopening(null);
      onChanged();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : failure);
    } finally {
      setBusyId(null);
    }
  }

  function changeStatus(experience: Experience, status: ExperienceStatus, success: string) {
    return run(
      experience.id,
      () => apiRequest(`/api/admin/experiencias/${experience.id}`, { method: "PATCH", body: { status } }),
      success,
      "No pudimos cambiar el estado. Intentá de nuevo.",
    );
  }

  function changeRegistration(experience: Experience, action: "open" | "close", closesAt?: string) {
    const closesIso = closesAt ? new Date(closesAt).toISOString() : undefined;
    return run(
      experience.id,
      () => apiRequest(`/api/admin/experiencias/${experience.id}/inscripcion`, { method: "POST", body: { action, registrationClosesAt: closesIso } }),
      action === "open" ? "Inscripciones abiertas." : "Inscripciones cerradas. Las personas ya inscritas conservan su lugar.",
      "No pudimos cambiar las inscripciones. Intentá de nuevo.",
    );
  }

  function changeChallengeStatus(challenge: Challenge, status: ExperienceStatus) {
    return run(
      challenge.id,
      () => apiRequest(`/api/admin/retos/${challenge.id}`, { method: "PATCH", body: { status } }),
      status === "published" ? "Publicado. Ya aparece en el catálogo público." : "Estado actualizado.",
      "No pudimos cambiar el estado. Intentá de nuevo.",
    );
  }

  function askToChange(experience: Experience, status: "closed" | "cancelled" | "draft") {
    const stats = statsOf(experience.id);
    const pending = stats.enrollments.pending;
    const active = stats.enrollments.active;
    if (status === "closed") {
      setConfirming({
        id: experience.id,
        status,
        confirmLabel: "Sí, marcar concluida",
        success: "Experiencia marcada como concluida. Queda como historia y no vuelve a abrirse.",
        message: `Al marcarla concluida pasa a ser histórica: no acepta inscripciones, no se reabre y no se revisan más inscripciones${pending > 0 ? ` (hay ${pending} pendientes)` : ""}.`,
      });
    } else if (status === "cancelled") {
      setConfirming({
        id: experience.id,
        status,
        confirmLabel: "Sí, cancelar experiencia",
        success: "Experiencia cancelada. Sale del catálogo público y se conservan sus inscripciones.",
        message: `Sale del catálogo público.${active > 0 ? ` Las ${active} inscripciones activas se conservan, pero ya no se podrán revisar: avisá a esas personas.` : ""}`,
      });
    } else {
      setConfirming({
        id: experience.id,
        status,
        confirmLabel: "Sí, pasar a borrador",
        success: "Experiencia en borrador. Ya no aparece en el catálogo público.",
        message: "Deja de verse en el catálogo público hasta que la publiques de nuevo.",
      });
    }
    setReopening(null);
  }

  function startEditing(id: string) {
    setNotice(null);
    setActionError(null);
    setEditingId(id);
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias y retos</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>
          Todo se guarda como borrador. Solo aparece en el sitio público cuando lo publicás.
        </p>
      </div>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}

      <div role="search" aria-label="Buscar y filtrar experiencias" className="c3-card" style={{ padding: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "2 1 240px", minWidth: 0 }}>
          <label htmlFor="exp-buscar" className="c3-etiqueta-campo">Buscar por nombre</label>
          <input id="exp-buscar" type="search" className="c3-campo" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 160px" }}>
          <label htmlFor="exp-filtro-estado" className="c3-etiqueta-campo">Estado</label>
          <select id="exp-filtro-estado" className="c3-campo" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            {STATUS_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 160px" }}>
          <label htmlFor="exp-filtro-linea" className="c3-etiqueta-campo">Línea</label>
          <select id="exp-filtro-linea" className="c3-campo" value={lineFilter} onChange={(event) => setLineFilter(event.target.value as LineFilter)}>
            <option value="todas">Todas</option>
            {(Object.keys(LINE_NAME) as ExperienceLine[]).map((line) => <option key={line} value={line}>{LINE_NAME[line]}</option>)}
          </select>
        </div>
        {filtersActive ? (
          <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 48 }} onClick={() => { setQuery(""); setStatusFilter("todos"); setLineFilter("todas"); }}>
            Limpiar filtros
          </button>
        ) : null}
      </div>
      <p aria-live="polite" style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
        {visible.length} de {catalog.experiences.length} {catalog.experiences.length === 1 ? "experiencia" : "experiencias"}
      </p>

      {catalog.experiences.length === 0 ? (
        <div className="c3-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay experiencias. Creá la primera abajo.</p>
        </div>
      ) : null}
      {catalog.experiences.length > 0 && visible.length === 0 ? (
        <div className="c3-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Ninguna experiencia coincide con la búsqueda y los filtros.</p>
        </div>
      ) : null}

      {visible.map((experience) => {
        const stats = statsOf(experience.id);
        const challenges = catalog.challenges.filter((challenge) => challenge.experienceId === experience.id);
        const window = { opensAt: experience.registrationOpensAt, closesAt: experience.registrationClosesAt };
        const stage = lifecycleOf(experience, now);
        const phase = registrationPhase(experience, now);
        const left = spotsLeft(experience, stats.enrollments);
        const actions = nextActionsOf(experience, stats, now);
        const session = formatSession(experience.startsAt, experience.endsAt);
        const busy = busyId === experience.id;
        const confirmation = confirming?.id === experience.id ? confirming : null;
        return (
          <section key={experience.id} className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }} aria-label={experience.title}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{experienceLabel(experience)}</span>
                <h2 className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{experience.title}</h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {experience.isDemo ? <span className="c3-pill c3-pill--advertencia">Demo · no oficial</span> : null}
                <StatePill state={{ label: stage.label, tone: STAGE_TONE[stage.stage] }} />
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{experience.summary}</p>

            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {session ? <Detail label="Sesión" value={`${session}${experience.modality ? ` · ${MODALITY_LABEL[experience.modality]}` : ""}`} /> : null}
              {experience.location ? <Detail label="Sede o enlace" value={experience.location} /> : null}
              {experience.registrationOpensAt || experience.registrationClosesAt ? (
                <Detail
                  label="Inscripciones"
                  value={[
                    experience.registrationOpensAt ? `abren ${formatDateTime(experience.registrationOpensAt)}` : null,
                    experience.registrationClosesAt ? `cierran ${formatDateTime(experience.registrationClosesAt)}` : null,
                  ].filter(Boolean).join(" · ")}
                />
              ) : null}
              <Detail
                label="Participación"
                value={`${stats.enrollments.total} ${stats.enrollments.total === 1 ? "inscripción" : "inscripciones"} · ${stats.enrollments.pending} pendientes · ${stats.enrollments.approved} aprobadas`}
              />
              {experience.capacity != null ? (
                <Detail label="Cupos" value={`${stats.enrollments.active} de ${experience.capacity} ocupados · ${left} ${left === 1 ? "libre" : "libres"}`} />
              ) : null}
              <Detail label="Retos" value={String(challenges.length)} />
            </dl>

            {actions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Próximas acciones</span>
                <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                  {actions.map((action) => (
                    <li key={action.text} style={{ fontSize: 14, fontWeight: action.tone === "advertencia" ? 600 : 400, color: action.tone === "advertencia" ? "var(--c3-advertencia)" : "var(--c3-texto)" }}>
                      {action.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {experience.status === "draft" ? (
                <>
                  <button type="button" className="c3-btn c3-btn--primario" disabled={busy} onClick={() => void changeStatus(experience, "published", "Publicado. Ya aparece en el catálogo público.")}>
                    {busy ? "Guardando…" : "Publicar"}
                  </button>
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => askToChange(experience, "closed")}>Registrar como concluida</button>
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => askToChange(experience, "cancelled")}>Cancelar experiencia</button>
                </>
              ) : null}
              {experience.status === "published" ? (
                <>
                  {phase === "open" ? (
                    <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => void changeRegistration(experience, "close")}>Cerrar inscripciones</button>
                  ) : phase === "upcoming" ? (
                    <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => void changeRegistration(experience, "open")}>Abrir inscripciones</button>
                  ) : (
                    <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => { setConfirming(null); setReopening({ id: experience.id, closesAt: "" }); }}>Abrir inscripciones</button>
                  )}
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => askToChange(experience, "draft")}>Pasar a borrador</button>
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => askToChange(experience, "closed")}>Marcar concluida</button>
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => askToChange(experience, "cancelled")}>Cancelar experiencia</button>
                </>
              ) : null}
              {experience.status === "cancelled" ? (
                <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => void changeStatus(experience, "draft", "Experiencia restaurada como borrador.")}>Restaurar como borrador</button>
              ) : null}
              <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => startEditing(experience.id)}>Editar</button>
              {challenges.length === 0 ? (
                <button type="button" className="c3-btn c3-btn--contorno" onClick={() => onOpenEnrollments({ kind: "experience", id: experience.id })}>Ver inscripciones</button>
              ) : null}
            </div>
            {experience.status === "closed" ? (
              <p style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>Experiencia histórica: su calendario y sus cupos quedan como registro y no se reabre.</p>
            ) : null}

            {confirmation ? (
              <div className="c3-alerta c3-alerta--advertencia" role="group" aria-label={`Confirmar: ${confirmation.confirmLabel}`}>
                <strong>{confirmation.message}</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <button type="button" className="c3-btn c3-btn--primario" disabled={busy} onClick={() => void changeStatus(experience, confirmation.status, confirmation.success)}>
                    {busy ? "Guardando…" : confirmation.confirmLabel}
                  </button>
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => setConfirming(null)}>Volver</button>
                </div>
              </div>
            ) : null}

            {reopening?.id === experience.id ? (
              <div className="c3-alerta c3-alerta--info" role="group" aria-label="Reabrir inscripciones" style={{ gap: 8 }}>
                <label htmlFor={`reabrir-${experience.id}`} className="c3-etiqueta-campo">Nuevo cierre de inscripciones</label>
                <input
                  id={`reabrir-${experience.id}`}
                  className="c3-campo"
                  type="datetime-local"
                  value={reopening.closesAt}
                  onChange={(event) => setReopening({ id: experience.id, closesAt: event.target.value })}
                  style={{ maxWidth: 320 }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="c3-btn c3-btn--primario" disabled={busy || !reopening.closesAt} onClick={() => void changeRegistration(experience, "open", reopening.closesAt)}>
                    {busy ? "Guardando…" : "Confirmar apertura"}
                  </button>
                  <button type="button" className="c3-btn c3-btn--contorno" disabled={busy} onClick={() => setReopening(null)}>Volver</button>
                </div>
              </div>
            ) : null}

            <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Retos</span>
              {challenges.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
                  Esta experiencia no tiene retos. Mientras no tenga retos publicados, las personas se inscriben a la experiencia misma.
                </p>
              ) : null}
              {challenges.map((challenge) => (
                <div key={challenge.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 0", borderTop: "1px solid var(--c3-borde)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{challenge.title}</span>
                    <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>
                      {challenge.organizationName}
                      {challenge.submissionClosesAt ? ` · Entregas hasta el ${formatDate(challenge.submissionClosesAt)}` : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <StatePill state={presentState(challenge.status, window, now)} />
                    <ChallengeStatusButtons busy={busyId === challenge.id} status={challenge.status} onChange={(status) => void changeChallengeStatus(challenge, status)} />
                    <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} onClick={() => onOpenEnrollments({ kind: "challenge", id: challenge.id })}>
                      Ver inscripciones
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <ExperienceForm
        key={editing ? editing.id : `nueva-${formVersion}`}
        experience={editing}
        stats={editing ? statsOf(editing.id) : undefined}
        onCancel={() => setEditingId(null)}
        onSaved={(message) => {
          setNotice(message);
          setActionError(null);
          if (editing) setEditingId(null);
          else setFormVersion((version) => version + 1);
          onChanged();
        }}
      />
      <ChallengeForm
        experiences={experienceOptions}
        organizations={catalog.organizations}
        onCreated={(message) => {
          setNotice(message);
          onChanged();
        }}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <dt className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, overflowWrap: "anywhere" }}>{value}</dd>
    </div>
  );
}

function ChallengeStatusButtons({ status, busy, onChange }: { status: ExperienceStatus; busy: boolean; onChange: (status: ExperienceStatus) => void }) {
  const style = { minHeight: 40, padding: "0 14px", fontSize: 12 };
  if (status === "draft") {
    return (
      <button type="button" className="c3-btn c3-btn--primario" style={style} disabled={busy} onClick={() => onChange("published")}>
        {busy ? "Guardando…" : "Publicar"}
      </button>
    );
  }
  if (status === "published") {
    return (
      <>
        <button type="button" className="c3-btn c3-btn--contorno" style={style} disabled={busy} onClick={() => onChange("draft")}>Pasar a borrador</button>
        <button type="button" className="c3-btn c3-btn--contorno" style={style} disabled={busy} onClick={() => onChange("closed")}>Marcar concluida</button>
      </>
    );
  }
  return null;
}
