"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { apiRequest, ApiError } from "@/lib/client/api";
import { lockedFields, type ExperienceStats, type GuardedField } from "@/lib/domain/lifecycle";
import { KIND_LINE, LINE_NAME, MODALITY_LABEL, primaryLineOf } from "@/lib/domain/presentation";
import type { Experience, ExperienceKind, ExperienceLine, ExperienceModality } from "@/lib/domain/types";

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
  { value: "competencia", label: "Competencia" },
  { value: "hackathon", label: "Hackathon" },
  { value: "challenge_empresarial", label: "Challenge empresarial" },
  { value: "taller", label: "Taller" },
  { value: "charla", label: "Charla" },
  { value: "encuentro", label: "Encuentro" },
];

const LINES: ExperienceLine[] = ["compite", "crea", "conecta"];
const MODALITIES: ExperienceModality[] = ["presencial", "virtual", "hibrida"];

/** Valor de un datetime-local (hora local de la persona administradora) a partir de un instante ISO. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * ISO que se envía al guardar. Si la persona no tocó el campo, se conserva el instante original: el
 * datetime-local solo llega al minuto y recortarlo contaría como un cambio de calendario.
 */
function isoFor(local: string, original: string | null | undefined): string | null {
  if (original && toLocalInput(original) === local) return original;
  return toIso(local);
}

/**
 * Formulario de experiencia: crea (en borrador) o edita una existente. Una experiencia nueva no aparece en el sitio
 * hasta publicarla; al editar, lo que no se puede cambiar por el estado o la participación queda bloqueado con su motivo.
 */
export function ExperienceForm({
  experience = null,
  stats,
  onSaved,
  onCancel,
}: {
  experience?: Experience | null;
  stats?: ExperienceStats;
  onSaved: (message: string) => void;
  onCancel?: () => void;
}) {
  const editing = experience !== null;
  const rootRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(experience?.title ?? "");
  const [kind, setKind] = useState<ExperienceKind>(experience?.kind ?? "competencia");
  const [line, setLine] = useState<ExperienceLine>(experience ? primaryLineOf(experience) : KIND_LINE["competencia"]);
  // Mientras la persona no elija la línea, acompaña al tipo (un taller suele ser de Crea, una charla de Conecta).
  const [lineChosen, setLineChosen] = useState(editing);
  const [secondary, setSecondary] = useState<ExperienceLine[]>(
    (experience?.secondaryLines ?? []).filter((item) => item !== (experience ? primaryLineOf(experience) : null)),
  );
  const [summary, setSummary] = useState(experience?.summary ?? "");
  const [modality, setModality] = useState<ExperienceModality | "">(experience?.modality ?? "");
  const [starts, setStarts] = useState(toLocalInput(experience?.startsAt));
  const [ends, setEnds] = useState(toLocalInput(experience?.endsAt));
  const [location, setLocation] = useState(experience?.location ?? "");
  const [capacity, setCapacity] = useState(experience?.capacity != null ? String(experience.capacity) : "");
  const [opens, setOpens] = useState(toLocalInput(experience?.registrationOpensAt));
  const [closes, setCloses] = useState(toLocalInput(experience?.registrationClosesAt));
  const [isDemo, setIsDemo] = useState(experience?.isDemo === true);
  const [demoNote, setDemoNote] = useState(experience?.demoNote ?? "");
  const [sourceUrl, setSourceUrl] = useState(experience?.sourceUrl ?? "");
  const [sourceLabel, setSourceLabel] = useState(experience?.sourceLabel ?? "");
  const [issues, setIssues] = useState<{ field: string; message: string }[] | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locks = experience && stats ? lockedFields(experience, stats) : {};
  const experienceId = experience?.id;

  // Al abrir una experiencia para editarla, el formulario entra en pantalla y el foco va al nombre.
  useEffect(() => {
    if (!experienceId) return;
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    titleRef.current?.focus({ preventScroll: true });
  }, [experienceId]);

  function chooseKind(next: ExperienceKind) {
    setKind(next);
    if (!lineChosen) {
      setLine(KIND_LINE[next]);
      setSecondary((current) => current.filter((item) => item !== KIND_LINE[next]));
    }
  }

  function chooseLine(next: ExperienceLine) {
    setLine(next);
    setLineChosen(true);
    setSecondary((current) => current.filter((item) => item !== next));
  }

  function toggleSecondary(item: ExperienceLine, checked: boolean) {
    setSecondary((current) => (checked ? [...new Set([...current, item])] : current.filter((value) => value !== item)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues(undefined);
    setFormError(null);
    setBusy(true);
    try {
      const body = {
        title,
        kind,
        summary,
        primaryLine: line,
        secondaryLines: secondary,
        modality: modality || null,
        startsAt: isoFor(starts, experience?.startsAt),
        endsAt: isoFor(ends, experience?.endsAt),
        location,
        capacity,
        registrationOpensAt: isoFor(opens, experience?.registrationOpensAt),
        registrationClosesAt: isoFor(closes, experience?.registrationClosesAt),
        isDemo: editing ? undefined : isDemo || undefined,
        demoNote,
        sourceUrl,
        sourceLabel,
      };
      if (experience) {
        await apiRequest(`/api/admin/experiencias/${experience.id}`, { method: "PUT", body });
        onSaved("Cambios guardados. Quedan registrados en la bitácora de C3.");
      } else {
        await apiRequest("/api/admin/experiencias", { method: "POST", body });
        setTitle("");
        setSummary("");
        setModality("");
        setStarts("");
        setEnds("");
        setLocation("");
        setCapacity("");
        setOpens("");
        setCloses("");
        setIsDemo(false);
        setDemoNote("");
        setSourceUrl("");
        setSourceLabel("");
        setSecondary([]);
        onSaved("Experiencia guardada como borrador. Publicala cuando esté lista.");
      }
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

  const lockHelp = (field: GuardedField) => locks[field];

  return (
    <form ref={rootRef} onSubmit={submit} noValidate className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 16 }} aria-label={editing ? `Editar ${experience.title}` : "Nueva experiencia"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>{editing ? "Editar experiencia" : "Nueva experiencia"}</span>
        {editing && onCancel ? (
          <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} onClick={onCancel}>
            Cancelar edición
          </button>
        ) : null}
      </div>
      {editing && experience.isDemo ? (
        <div className="c3-alerta c3-alerta--advertencia" role="note"><strong>Evento de demostración · no oficial</strong><span style={{ fontSize: 14 }}>Editarlo no lo convierte en una experiencia oficial.</span></div>
      ) : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <Field id="exp-titulo" label="Nombre" error={issueFor(issues, "title")}>
        <input id="exp-titulo" ref={titleRef} className="c3-campo" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
        <Field id="exp-tipo" label="Tipo" help={lockHelp("kind")} error={issueFor(issues, "kind")}>
          <select id="exp-tipo" className="c3-campo" value={kind} disabled={Boolean(lockHelp("kind"))} onChange={(e) => chooseKind(e.target.value as ExperienceKind)}>
            {KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field id="exp-linea" label="Línea principal" help="Compite, Crea o Conecta: define dónde aparece primero." error={issueFor(issues, "primaryLine")}>
          <select id="exp-linea" className="c3-campo" value={line} onChange={(e) => chooseLine(e.target.value as ExperienceLine)}>
            {LINES.map((item) => <option key={item} value={item}>{LINE_NAME[item]}</option>)}
          </select>
        </Field>
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <legend className="c3-etiqueta-campo" style={{ marginBottom: 8 }}>También aparece en</legend>
        {LINES.filter((item) => item !== line).map((item) => (
          <label key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <input type="checkbox" checked={secondary.includes(item)} onChange={(e) => toggleSecondary(item, e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
            {LINE_NAME[item]}
          </label>
        ))}
      </fieldset>
      <Field id="exp-resumen" label="Descripción" help="Un párrafo breve para el catálogo." error={issueFor(issues, "summary")}>
        <textarea id="exp-resumen" className="c3-campo" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      </Field>

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <legend className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)", marginBottom: 12 }}>Sesión</legend>
        <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
          <Field id="exp-inicio" label="Inicio" error={issueFor(issues, "startsAt")} help={lockHelp("startsAt")}>
            <input id="exp-inicio" className="c3-campo" type="datetime-local" value={starts} disabled={Boolean(lockHelp("startsAt"))} onChange={(e) => setStarts(e.target.value)} />
          </Field>
          <Field id="exp-fin" label="Fin" error={issueFor(issues, "endsAt")} help={lockHelp("endsAt")}>
            <input id="exp-fin" className="c3-campo" type="datetime-local" value={ends} disabled={Boolean(lockHelp("endsAt"))} onChange={(e) => setEnds(e.target.value)} />
          </Field>
          <Field id="exp-modalidad" label="Modalidad" error={issueFor(issues, "modality")} help={lockHelp("modality")}>
            <select id="exp-modalidad" className="c3-campo" value={modality} disabled={Boolean(lockHelp("modality"))} onChange={(e) => setModality(e.target.value as ExperienceModality | "")}>
              <option value="">Sin definir</option>
              {MODALITIES.map((item) => <option key={item} value={item}>{MODALITY_LABEL[item]}</option>)}
            </select>
          </Field>
          <Field id="exp-lugar" label="Sede o enlace" help="Es información pública. Si es virtual, el enlace completo con https://." error={issueFor(issues, "location")}>
            <input id="exp-lugar" className="c3-campo" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <p style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>
          Los talleres, charlas y encuentros necesitan inicio, modalidad y sede o enlace para poder publicarse.
        </p>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <legend className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)", marginBottom: 12 }}>Inscripción</legend>
        <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
          <Field id="exp-abre" label="Inscripciones abren" error={issueFor(issues, "registrationOpensAt")} help={lockHelp("registrationOpensAt")}>
            <input id="exp-abre" className="c3-campo" type="datetime-local" value={opens} disabled={Boolean(lockHelp("registrationOpensAt"))} onChange={(e) => setOpens(e.target.value)} />
          </Field>
          <Field id="exp-cierra" label="Inscripciones cierran" error={issueFor(issues, "registrationClosesAt")} help={lockHelp("registrationClosesAt")}>
            <input id="exp-cierra" className="c3-campo" type="datetime-local" value={closes} disabled={Boolean(lockHelp("registrationClosesAt"))} onChange={(e) => setCloses(e.target.value)} />
          </Field>
          <Field
            id="exp-cupos"
            label="Cupos"
            help={lockHelp("capacity") ?? (stats && stats.enrollments.active > 0 ? `Hay ${stats.enrollments.active} inscripciones activas; el límite no puede ser menor.` : "Vacío significa sin límite.")}
            error={issueFor(issues, "capacity")}
          >
            <input id="exp-cupos" className="c3-campo" type="number" min={1} inputMode="numeric" value={capacity} disabled={Boolean(lockHelp("capacity"))} onChange={(e) => setCapacity(e.target.value)} />
          </Field>
        </div>
        <p style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>
          La inscripción a la experiencia es individual y la revisa C3. Los equipos se definen en cada challenge.
        </p>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <legend className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)", marginBottom: 12 }}>Información pública adicional</legend>
        {!editing ? (
          <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
            <input type="checkbox" checked={isDemo} onChange={(e) => setIsDemo(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
            Evento de demostración (se muestra como «Demo · no oficial»)
          </label>
        ) : null}
        {isDemo ? (
          <Field id="exp-demo-nota" label="Nota de demostración" error={issueFor(issues, "demoNote")}>
            <input id="exp-demo-nota" className="c3-campo" value={demoNote} onChange={(e) => setDemoNote(e.target.value)} />
          </Field>
        ) : null}
        <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
          <Field id="exp-fuente-url" label="Enlace de la fuente" help="Opcional. Debe empezar con https://." error={issueFor(issues, "sourceUrl")}>
            <input id="exp-fuente-url" className="c3-campo" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          </Field>
          <Field id="exp-fuente-nombre" label="Nombre de la fuente" error={issueFor(issues, "sourceLabel")}>
            <input id="exp-fuente-nombre" className="c3-campo" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <button type="submit" className="c3-btn c3-btn--primario" disabled={busy}>
        {busy ? "Guardando…" : editing ? "Guardar cambios" : "Guardar borrador"}
      </button>
    </form>
  );
}

export interface ExperienceOption {
  id: string;
  title: string;
}

/** Formulario de challenge. Se crea dentro de una experiencia existente, en borrador. */
export function ChallengeForm({
  experiences,
  organizations,
  onCreated,
}: {
  experiences: ExperienceOption[];
  organizations: { id: string; name: string }[];
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
  const [organizationId, setOrganizationId] = useState("");
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
          organizationId: organizationId || null,
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
      onCreated("Challenge guardado como borrador. Publicalo para que aparezca en el catálogo.");
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos guardar el challenge. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (experiences.length === 0) {
    return (
      <div className="c3-card" style={{ padding: 24 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Nuevo challenge</span>
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--c3-texto-suave)" }}>Primero creá una experiencia. Los challenges se crean dentro de una experiencia.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Nuevo challenge</span>
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <Field id="ret-exp" label="Experiencia" error={issueFor(issues, "experienceId")}>
        <select id="ret-exp" className="c3-campo" value={experienceId} onChange={(e) => setExperienceId(e.target.value)}>
          {experiences.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </Field>
      <Field id="ret-titulo" label="Nombre del challenge" error={issueFor(issues, "title")}>
        <input id="ret-titulo" className="c3-campo" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="ret-org" label="Organización responsable" error={issueFor(issues, "organizationName")}>
        <input id="ret-org" className="c3-campo" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
      </Field>
      <Field id="ret-org-vinculada" label="Organización vinculada" help="Quien la represente verá este challenge en su espacio de empresa." error={null}>
        <select id="ret-org-vinculada" className="c3-campo" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
          <option value="">Sin vincular</option>
          {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
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
