"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Migas } from "@/components/Migas";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import type { PresentedState } from "@/lib/domain/presentation";
import type { evaluationWorkspace } from "@/lib/server/evaluation";

type Workspace = Awaited<ReturnType<typeof evaluationWorkspace>>;
type Solution = Workspace["solutions"][number];

const SOLUTION_STATE: Record<"none" | "draft" | "finalized", PresentedState> = {
  none: { label: "Pendiente", tone: "neutro" },
  draft: { label: "En curso", tone: "advertencia" },
  finalized: { label: "Finalizada", tone: "exito" },
};

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/**
 * Espacio de evaluación para jurados asignados: rúbrica, borrador y finalización. Antes del cierre, solo lectura.
 * Es la única pantalla de evaluación (jurado externo o representante de la empresa): `/mi-c3/evaluar/[id]`.
 */
export function EvaluadorPanel({ challengeId }: { challengeId: string }) {
  return (
    <AppShell active="mi-c3" signedOut={{ title: "Entrá para evaluar", text: "Usás tu cuenta de C3. Al entrar volvés a esta evaluación." }}>
      <EvaluadorContenido challengeId={challengeId} />
    </AppShell>
  );
}

function EvaluadorContenido({ challengeId }: { challengeId: string }) {
  const { session } = useSession();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const signedIn = session.status === "signed-in";

  // Carga inicial; las actualizaciones ocurren en la respuesta.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ workspace: Workspace }>(`/api/evaluaciones/${challengeId}`).then(
      (data) => {
        if (!active) return;
        setWorkspace(data.workspace);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el challenge. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn, challengeId]);

  async function reload() {
    try {
      const data = await apiRequest<{ workspace: Workspace }>(`/api/evaluaciones/${challengeId}`);
      setWorkspace(data.workspace);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el challenge. Intentá de nuevo.");
    }
  }

  function scoresFor(solution: Solution): Record<string, string> {
    if (drafts[solution.id]) return drafts[solution.id];
    const saved = solution.mine?.scores ?? {};
    return Object.fromEntries((workspace?.challenge.rubric ?? []).map((criterion) => [criterion.id, saved[criterion.id] !== undefined ? String(saved[criterion.id]) : ""]));
  }

  async function save(solution: Solution, finalize: boolean) {
    setIssues([]);
    setFormError(null);
    setNotice(null);
    setBusy(`${solution.id}-${finalize ? "f" : "d"}`);
    const values = scoresFor(solution);
    const scores = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === "" ? NaN : Number(value)]));
    try {
      await apiRequest(`/api/evaluaciones/${challengeId}/soluciones/${solution.id}`, { method: "PUT", body: { scores, finalize } });
      setDrafts((current) => {
        const next = { ...current };
        delete next[solution.id];
        return next;
      });
      setNotice(finalize ? `${solution.label}: evaluación finalizada. Ya no se puede cambiar.` : `${solution.label}: borrador guardado.`);
      await reload();
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos guardar la evaluación. Intentá de nuevo.");
      }
    } finally {
      setBusy(null);
    }
  }

  const crumbs = (title?: string) => [{ label: "Mi C3", href: "/mi-c3" }, ...(title ? [{ label: title, href: undefined }] : []), { label: "Evaluar" }];

  if (loadError) {
    return (
      <div className="c3-tarea">
        <Migas items={crumbs()} />
        <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div>
      </div>
    );
  }
  if (!workspace) {
    return (
      <div className="c3-tarea">
        <Migas items={crumbs()} />
        <p role="status" style={{ color: "var(--c3-texto-suave)" }}>Cargando el challenge…</p>
      </div>
    );
  }

  const pending = !workspace.canEvaluate;
  const finalized = workspace.solutions.filter((solution) => solution.mine?.status === "finalized").length;
  return (
    <div className="c3-tarea">
      <Migas items={crumbs(workspace.challenge.title)} />

      <section className="c3-tarea__encabezado">
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Evaluación · {workspace.kind === "empresa" ? "representante de la empresa" : "jurado externo"}</span>
        <h1 className="c3-titulo">{workspace.challenge.title}</h1>
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
          Cada solución se evalúa con la rúbrica, sin ver quién la entregó. Máximo total: {workspace.maxTotal} puntos.
          {workspace.solutions.length > 0 ? ` Finalizadas: ${finalized} de ${workspace.solutions.length}.` : ""}
        </p>
      </section>

      {pending ? (
        <div className="c3-alerta c3-alerta--advertencia" role="status">
          <strong>Esperá el cierre de entregas</strong>
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>
            Las soluciones se pueden evaluar cuando cierran las entregas{workspace.challenge.submissionClosesAt ? `, el ${formatDateTime(workspace.challenge.submissionClosesAt)}` : ""}. Hasta entonces todavía pueden cambiar.
          </span>
        </div>
      ) : null}
      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      {workspace.solutions.length === 0 ? (
        <div className="c3-card" style={{ padding: 20 }}><p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay soluciones enviadas para este challenge.</p></div>
      ) : null}

      {workspace.solutions.map((solution) => {
        const status = solution.mine ? (solution.mine.status === "finalized" ? "finalized" : "draft") : "none";
        const locked = pending || status === "finalized";
        const values = scoresFor(solution);
        return (
          <form
            key={solution.id}
            onSubmit={(event) => {
              event.preventDefault();
              void save(solution, false);
            }}
            noValidate
            className="c3-card c3-evaluacion__solucion"
            aria-label={solution.label}
          >
            <div className="c3-evaluacion__contenido">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="c3-titulo" style={{ fontSize: 18, fontWeight: 600 }}>{solution.label}</span>
                <StatePill state={SOLUTION_STATE[status]} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{solution.text}</p>
              {solution.links.map((link) => (
                <a key={link} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{link}</a>
              ))}
            </div>

            <fieldset className="c3-evaluacion__rubrica">
              <legend className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Rúbrica</legend>
              {workspace.challenge.rubric.map((criterion) => {
                const field = `scores.${criterion.id}`;
                return (
                  <div key={criterion.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label htmlFor={`${solution.id}-${criterion.id}`} className="c3-etiqueta-campo">{criterion.label} (0 – {criterion.maxScore})</label>
                    <input
                      id={`${solution.id}-${criterion.id}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={criterion.maxScore}
                      step={1}
                      className={`c3-campo${issueFor(issues, field) ? " c3-campo--error" : ""}`}
                      style={{ maxWidth: 140 }}
                      disabled={locked}
                      value={values[criterion.id] ?? ""}
                      onChange={(event) => setDrafts((current) => ({ ...current, [solution.id]: { ...scoresFor(solution), [criterion.id]: event.target.value } }))}
                    />
                    {issueFor(issues, field) ? <span className="c3-error-campo">{issueFor(issues, field)}</span> : null}
                  </div>
                );
              })}

              {locked ? (
                <span className="c3-ayuda">
                  {status === "finalized" ? `Finalizada. Total: ${solution.mine?.total} de ${workspace.maxTotal}.` : "Esperá el cierre de entregas para evaluar."}
                </span>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" className="c3-btn c3-btn--contorno" disabled={busy !== null}>
                    {busy === `${solution.id}-d` ? "Guardando…" : "Guardar borrador"}
                  </button>
                  <button type="button" className="c3-btn c3-btn--primario" disabled={busy !== null} onClick={() => void save(solution, true)}>
                    {busy === `${solution.id}-f` ? "Finalizando…" : "Finalizar evaluación"}
                  </button>
                </div>
              )}
            </fieldset>
          </form>
        );
      })}
    </div>
  );
}
