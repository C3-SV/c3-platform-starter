"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { apiRequest, ApiError } from "@/lib/client/api";
import type { ExperienceKind } from "@/lib/domain/types";

export interface CreatedMessage {
  text: string;
}

/** Convierte un valor de datetime-local (hora local de la persona administradora) a ISO. */
function toIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function issueFor(issues: { field: string; message: string }[] | undefined, field: string): string | null {
  return issues?.find((issue) => issue.field === field)?.message ?? null;
}

function FieldError({ message }: { message: string | null }) {
  return message ? <span className="c3-error-campo">{message}</span> : null;
}

const KIND_OPTIONS: { value: ExperienceKind; label: string }[] = [
  { value: "competencia", label: "Compite · Competencia" },
  { value: "hackathon", label: "Crea · Hackathon" },
  { value: "challenge_empresarial", label: "Conecta · Challenge empresarial" },
];

/** Formulario de experiencia. Se guarda en borrador; no aparece en el sitio hasta publicarla. */
export function ExperienceForm({ onCreated }: { onCreated: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ExperienceKind>("competencia");
  const [summary, setSummary] = useState("");
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState("");
  const [issues, setIssues] = useState<{ field: string; message: string }[] | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues(undefined);
    setFormError(null);
    setBusy(true);
    try {
      await apiRequest("/api/admin/experiencias", {
        method: "POST",
        body: {
          title,
          kind,
          summary,
          registrationOpensAt: toIso(opens),
          registrationClosesAt: toIso(closes),
        },
      });
      setTitle("");
      setSummary("");
      setOpens("");
      setCloses("");
      onCreated("Experiencia guardada como borrador. Publicala cuando esté lista.");
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos guardar la experiencia. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Nueva experiencia</span>
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <Field id="exp-titulo" label="Nombre" error={issueFor(issues, "title")}>
        <input id="exp-titulo" className="c3-campo" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="exp-tipo" label="Tipo" error={issueFor(issues, "kind")}>
        <select id="exp-tipo" className="c3-campo" value={kind} onChange={(e) => setKind(e.target.value as ExperienceKind)}>
          {KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </Field>
      <Field id="exp-resumen" label="Descripción" help="Un párrafo breve para el catálogo." error={issueFor(issues, "summary")}>
        <textarea id="exp-resumen" className="c3-campo" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      </Field>
      <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
        <Field id="exp-abre" label="Inscripciones abren" error={issueFor(issues, "registrationOpensAt")}>
          <input id="exp-abre" className="c3-campo" type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} />
        </Field>
        <Field id="exp-cierra" label="Inscripciones cierran" error={issueFor(issues, "registrationClosesAt")}>
          <input id="exp-cierra" className="c3-campo" type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} />
        </Field>
      </div>
      <button type="submit" className="c3-btn c3-btn--primario" disabled={busy}>
        {busy ? "Guardando…" : "Guardar borrador"}
      </button>
    </form>
  );
}

export interface ExperienceOption {
  id: string;
  title: string;
}

/** Formulario de reto. Se crea dentro de una experiencia existente, en borrador. */
export function ChallengeForm({
  experiences,
  onCreated,
}: {
  experiences: ExperienceOption[];
  onCreated: (message: string) => void;
}) {
  const [selectedExperienceId, setExperienceId] = useState("");
  // La experiencia activa es la elegida o, mientras no se elija, la primera disponible (las experiencias llegan después del primer render).
  const experienceId = experiences.some((item) => item.id === selectedExperienceId)
    ? selectedExperienceId
    : (experiences[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [problem, setProblem] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [rubric, setRubric] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [individual, setIndividual] = useState(true);
  const [team, setTeam] = useState(false);
  const [teamMin, setTeamMin] = useState(2);
  const [teamMax, setTeamMax] = useState(4);
  const [closes, setCloses] = useState("");
  const [issues, setIssues] = useState<{ field: string; message: string }[] | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues(undefined);
    setFormError(null);
    setBusy(true);
    const allows = [individual ? "individual" : null, team ? "team" : null].filter(Boolean);
    const rubricRows = rubric
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, score] = line.split("|").map((part) => part.trim());
        return { label, maxScore: score ? Number(score) : 10 };
      });
    try {
      await apiRequest("/api/admin/retos", {
        method: "POST",
        body: {
          experienceId,
          title,
          summary,
          problem,
          deliverables: deliverables.split("\n").map((line) => line.trim()).filter(Boolean),
          rubric: rubricRows,
          organizationName,
          allows,
          teamMinSize: team ? teamMin : null,
          teamMaxSize: team ? teamMax : null,
          submissionClosesAt: toIso(closes),
        },
      });
      setTitle("");
      setSummary("");
      setProblem("");
      setDeliverables("");
      setRubric("");
      setCloses("");
      onCreated("Reto guardado como borrador. Publicalo para que aparezca en el catálogo.");
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos guardar el reto. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (experiences.length === 0) {
    return (
      <div className="c3-card" style={{ padding: 24 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Nuevo reto</span>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--c3-texto-suave)" }}>Primero creá una experiencia. Los retos se crean dentro de una experiencia.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Nuevo reto</span>
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <Field id="ret-exp" label="Experiencia" error={issueFor(issues, "experienceId")}>
        <select id="ret-exp" className="c3-campo" value={experienceId} onChange={(e) => setExperienceId(e.target.value)}>
          {experiences.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </Field>
      <Field id="ret-titulo" label="Nombre del reto" error={issueFor(issues, "title")}>
        <input id="ret-titulo" className="c3-campo" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="ret-org" label="Organización responsable" error={issueFor(issues, "organizationName")}>
        <input id="ret-org" className="c3-campo" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
      </Field>
      <Field id="ret-resumen" label="Resumen" help="Una frase para el catálogo." error={issueFor(issues, "summary")}>
        <textarea id="ret-resumen" className="c3-campo" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field id="ret-problema" label="El problema" error={issueFor(issues, "problem")}>
        <textarea id="ret-problema" className="c3-campo" rows={6} value={problem} onChange={(e) => setProblem(e.target.value)} />
      </Field>
      <Field id="ret-entregables" label="Qué tienen que entregar" help="Un entregable por línea." error={issueFor(issues, "deliverables")}>
        <textarea id="ret-entregables" className="c3-campo" rows={4} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} />
      </Field>
      <Field id="ret-rubrica" label="Rúbrica" help="Un criterio por línea con su puntaje máximo, por ejemplo: Calidad del resultado | 10. Si omitís el puntaje, es 10." error={issueFor(issues, "rubric")}>
        <textarea id="ret-rubrica" className="c3-campo" rows={4} value={rubric} onChange={(e) => setRubric(e.target.value)} />
      </Field>

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <legend className="c3-etiqueta-campo" style={{ marginBottom: 8 }}>Modalidad</legend>
        <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
          <input type="checkbox" checked={individual} onChange={(e) => setIndividual(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
          Individual
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
          <input type="checkbox" checked={team} onChange={(e) => setTeam(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
          Equipo
        </label>
        <FieldError message={issueFor(issues, "allows")} />
        {team ? (
          <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <Field id="ret-min" label="Mínimo por equipo" error={issueFor(issues, "teamMinSize")}>
              <input id="ret-min" className="c3-campo" type="number" min={2} max={10} value={teamMin} onChange={(e) => setTeamMin(Number(e.target.value))} />
            </Field>
            <Field id="ret-max" label="Máximo por equipo" error={issueFor(issues, "teamMaxSize")}>
              <input id="ret-max" className="c3-campo" type="number" min={2} max={10} value={teamMax} onChange={(e) => setTeamMax(Number(e.target.value))} />
            </Field>
          </div>
        ) : null}
      </fieldset>

      <Field id="ret-cierre" label="Cierre de entregas" error={issueFor(issues, "submissionClosesAt")}>
        <input id="ret-cierre" className="c3-campo" type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} />
      </Field>

      <button type="submit" className="c3-btn c3-btn--primario" disabled={busy}>
        {busy ? "Guardando…" : "Guardar borrador"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className="c3-etiqueta-campo">{label}</label>
      {children}
      {help && !error ? <span className="c3-ayuda">{help}</span> : null}
      <FieldError message={error} />
    </div>
  );
}
