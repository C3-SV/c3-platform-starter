"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import type { ChallengeConfigView } from "@/lib/server/challengeConfig";

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/** Valor de un datetime-local (hora local de la persona) a partir de un instante ISO. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Si la persona no tocó el campo se conserva el instante original: el datetime-local solo llega al minuto. */
function isoFor(local: string, original: string | null): string | null {
  if (original && toLocalInput(original) === local) return original;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function rubricText(config: ChallengeConfigView): string {
  return config.rubric.map((item) => `${item.label} | ${item.maxScore}${typeof item.weight === "number" ? ` | ${item.weight}` : ""}`).join("\n");
}

/**
 * E3 · Configuración del challenge. Quien lo administra edita el resumen, el problema, los entregables, el cierre de
 * entregas y, mientras no haya entregas, la rúbrica. El servidor valida con las mismas reglas que la creación.
 */
export function ConfiguracionChallenge({ challengeId }: { challengeId: string }) {
  const [config, setConfig] = useState<ChallengeConfigView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [problem, setProblem] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [rubric, setRubric] = useState("");
  const [closes, setCloses] = useState("");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function fill(next: ChallengeConfigView) {
    setConfig(next);
    setSummary(next.summary);
    setProblem(next.problem);
    setDeliverables(next.deliverables.join("\n"));
    setRubric(rubricText(next));
    setCloses(toLocalInput(next.submissionClosesAt));
  }

  useEffect(() => {
    let active = true;
    apiRequest<{ config: ChallengeConfigView }>(`/api/empresa/retos/${challengeId}/configuracion`).then(
      (data) => {
        if (active) fill(data.config);
      },
      (error: unknown) => {
        if (active) setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar la configuración.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setIssues([]);
    setFormError(null);
    setNotice(null);
    const rubricRows = rubric
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, score, weight] = line.split("|").map((part) => part.trim());
        return { label, maxScore: score ? Number(score) : 10, weight: weight ? Number(weight) : undefined };
      });
    try {
      const data = await apiRequest<{ config: ChallengeConfigView }>(`/api/empresa/retos/${challengeId}/configuracion`, {
        method: "PATCH",
        body: {
          summary,
          problem,
          deliverables: deliverables.split("\n").map((line) => line.trim()).filter(Boolean),
          rubric: rubricRows,
          submissionClosesAt: isoFor(closes, config.submissionClosesAt),
        },
      });
      fill(data.config);
      setNotice("Configuración guardada. Las personas inscritas ya ven los cambios.");
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos guardar la configuración. Intentá de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div>;
  if (!config) return <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando la configuración…</p>;

  return (
    <form onSubmit={guardar} noValidate className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }} aria-label={`Configuración de ${config.title}`}>
      {notice ? <div className="c3-alerta c3-alerta--exito" role="status">{notice}</div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert">{formError}</div> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="cfg-resumen" className="c3-etiqueta-campo">Resumen</label>
        <textarea id="cfg-resumen" className={`c3-campo${issueFor(issues, "summary") ? " c3-campo--error" : ""}`} rows={2} maxLength={280} value={summary} onChange={(event) => setSummary(event.target.value)} />
        {issueFor(issues, "summary") ? <span className="c3-error-campo">{issueFor(issues, "summary")}</span> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="cfg-problema" className="c3-etiqueta-campo">Qué necesita la empresa</label>
        <textarea id="cfg-problema" className={`c3-campo${issueFor(issues, "problem") ? " c3-campo--error" : ""}`} rows={5} maxLength={4000} value={problem} onChange={(event) => setProblem(event.target.value)} />
        {issueFor(issues, "problem") ? <span className="c3-error-campo">{issueFor(issues, "problem")}</span> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="cfg-entregables" className="c3-etiqueta-campo">Entregables (uno por línea)</label>
        <textarea id="cfg-entregables" className={`c3-campo${issueFor(issues, "deliverables") ? " c3-campo--error" : ""}`} rows={4} value={deliverables} onChange={(event) => setDeliverables(event.target.value)} />
        {issueFor(issues, "deliverables") ? <span className="c3-error-campo">{issueFor(issues, "deliverables")}</span> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="cfg-rubrica" className="c3-etiqueta-campo">Rúbrica</label>
        <textarea id="cfg-rubrica" className={`c3-campo${issueFor(issues, "rubric") ? " c3-campo--error" : ""}`} rows={4} disabled={config.rubricLocked} value={rubric} onChange={(event) => setRubric(event.target.value)} />
        <span className="c3-ayuda">
          {config.rubricLocked
            ? "La rúbrica ya no se puede cambiar: hay entregas. Si necesitás un cambio, escribile a C3."
            : "Un criterio por línea: Criterio | puntaje máximo | peso (opcional). Con pesos, ponelos en todos y que sumen 100."}
        </span>
        {issueFor(issues, "rubric") ? <span className="c3-error-campo">{issueFor(issues, "rubric")}</span> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor="cfg-cierre" className="c3-etiqueta-campo">Cierre de entregas</label>
        <input id="cfg-cierre" type="datetime-local" className={`c3-campo${issueFor(issues, "submissionClosesAt") ? " c3-campo--error" : ""}`} style={{ maxWidth: 260 }} value={closes} onChange={(event) => setCloses(event.target.value)} />
        {issueFor(issues, "submissionClosesAt") ? <span className="c3-error-campo">{issueFor(issues, "submissionClosesAt")}</span> : null}
      </div>
      <div>
        <button type="submit" className="c3-btn c3-btn--primario" disabled={saving}>{saving ? "Guardando…" : "Guardar configuración"}</button>
      </div>
    </form>
  );
}
