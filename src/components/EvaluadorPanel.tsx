"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Migas } from "@/components/Migas";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { isWeighted, scoreOf } from "@/lib/domain/evaluation";
import type { PresentedState } from "@/lib/domain/presentation";
import type { evaluationWorkspace } from "@/lib/server/evaluation";

type Workspace = Awaited<ReturnType<typeof evaluationWorkspace>>;
type Solution = Workspace["solutions"][number];
type Criterion = Workspace["challenge"]["rubric"][number];
type SolutionStatus = "none" | "draft" | "finalized";

const SOLUTION_STATE: Record<SolutionStatus, PresentedState> = {
  none: { label: "Pendiente", tone: "neutro" },
  draft: { label: "En curso", tone: "advertencia" },
  finalized: { label: "Finalizada", tone: "exito" },
};

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

function statusOf(solution: Solution): SolutionStatus {
  if (!solution.mine) return "none";
  return solution.mine.status === "finalized" ? "finalized" : "draft";
}

/**
 * Total parcial mientras se escribe: solo cuenta los puntajes válidos (enteros dentro de su máximo).
 * El servidor vuelve a calcularlo al guardar; esto es solo una ayuda visual.
 */
function totalWhileEditing(values: Record<string, string>, rubric: Criterion[]): { value: number; complete: boolean } {
  const scores: Record<string, number> = {};
  let complete = true;
  for (const criterion of rubric) {
    const raw = values[criterion.id] ?? "";
    const value = raw === "" ? Number.NaN : Number(raw);
    if (Number.isInteger(value) && value >= 0 && value <= criterion.maxScore) scores[criterion.id] = value;
    else complete = false;
  }
  return { value: scoreOf(scores, rubric), complete };
}

function formatNumber(value: number): string {
  return value.toLocaleString("es", { maximumFractionDigits: 1 });
}

/**
 * Espacio de evaluación para jurados asignados: rúbrica, borrador y finalización. Antes del cierre, solo lectura.
 * Es la única pantalla de evaluación (jurado externo o representante de la empresa): `/mi-c3/evaluar/[id]`.
 * Las soluciones se muestran anónimas («Solución 1»…); no se muestra quién las entregó.
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
  const [comments, setComments] = useState<Record<string, string>>({});
  // Finalizar no tiene vuelta atrás: primero se pide confirmación en la misma solución.
  const [confirming, setConfirming] = useState<string | null>(null);
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

  function commentFor(solution: Solution): string {
    return comments[solution.id] ?? solution.mine?.comment ?? "";
  }

  async function save(solution: Solution, finalize: boolean) {
    setIssues([]);
    setFormError(null);
    setNotice(null);
    setBusy(`${solution.id}-${finalize ? "f" : "d"}`);
    const values = scoresFor(solution);
    const scores = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === "" ? NaN : Number(value)]));
    try {
      await apiRequest(`/api/evaluaciones/${challengeId}/soluciones/${solution.id}`, { method: "PUT", body: { scores, finalize, comment: commentFor(solution) } });
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
        <p role="status" className="c3-app__cargando">Cargando el challenge…</p>
      </div>
    );
  }

  const pending = !workspace.canEvaluate;
  const rubric = workspace.challenge.rubric;
  const weighted = isWeighted(rubric);
  const finalized = workspace.solutions.filter((solution) => statusOf(solution) === "finalized").length;
  const closes = workspace.challenge.submissionClosesAt ? formatDateTime(workspace.challenge.submissionClosesAt) : null;
  const kindLabel = workspace.kind === "empresa" ? "representante de la empresa" : "jurado externo";

  return (
    <div className="c3-tarea">
      <Migas items={crumbs(workspace.challenge.title)} />

      <section className="c3-tarea__encabezado c3-evaluacion__encabezado">
        <span className="c3-eyebrow">Evaluación · {kindLabel}</span>
        <h1 className="c3-titulo">{workspace.challenge.title}</h1>
        <p className="c3-evaluacion__resumen">
          Cada solución se evalúa con la rúbrica, sin ver quién la entregó. Los comentarios son internos: solo los ve C3.
        </p>
        <dl className="c3-evaluacion__cifras" aria-label="Resumen de la evaluación">
          <div className="c3-evaluacion__cifra">
            <dt>Máximo total</dt>
            <dd>{workspace.maxTotal} pts</dd>
          </div>
          <div className="c3-evaluacion__cifra">
            <dt>Soluciones</dt>
            <dd>{workspace.solutions.length}</dd>
          </div>
          <div className="c3-evaluacion__cifra">
            <dt>Finalizadas</dt>
            <dd>{finalized} de {workspace.solutions.length}</dd>
          </div>
          <div className="c3-evaluacion__cifra c3-evaluacion__cifra--fecha">
            <dt>Cierre de entregas</dt>
            <dd>{closes ?? "Sin fecha"}</dd>
          </div>
        </dl>
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
        <div className="c3-card c3-evaluacion__vacio">
          <p>Todavía no hay soluciones enviadas para este challenge.</p>
        </div>
      ) : (
        <div className="c3-evaluacion__grilla">
          <aside className="c3-evaluacion__lateral" aria-label="Rúbrica e índice de soluciones">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h2 className="c3-evaluacion__titulo">Rúbrica</h2>
              <p className="c3-ayuda">{weighted ? "Con pesos: cada criterio aporta su peso según el puntaje relativo a su máximo." : "Cada punto cuenta igual."}</p>
            </div>
            <dl className="c3-evaluacion__criterios">
              {rubric.map((criterion) => (
                <div key={criterion.id}>
                  <dt>{criterion.label}</dt>
                  <dd>
                    0 a {criterion.maxScore}
                    {weighted && typeof criterion.weight === "number" ? ` · ${criterion.weight} %` : ""}
                  </dd>
                </div>
              ))}
            </dl>
            <nav aria-label="Soluciones a evaluar" className="c3-evaluacion__indice">
              <h2 className="c3-evaluacion__titulo">Soluciones</h2>
              <ol>
                {workspace.solutions.map((solution) => (
                  <li key={solution.id}>
                    <a href={`#solucion-${solution.id}`}>{solution.label}</a>
                    <StatePill state={SOLUTION_STATE[statusOf(solution)]} />
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="c3-evaluacion__soluciones">
            {workspace.solutions.map((solution) => {
              const status = statusOf(solution);
              const locked = pending || status === "finalized";
              const values = scoresFor(solution);
              const total = status === "finalized" && solution.mine ? { value: solution.mine.total, complete: true } : totalWhileEditing(values, rubric);
              const titleId = `solucion-${solution.id}-titulo`;
              return (
                <form
                  key={solution.id}
                  id={`solucion-${solution.id}`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save(solution, false);
                  }}
                  noValidate
                  className="c3-card c3-evaluacion__solucion"
                  aria-labelledby={titleId}
                >
                  <div className="c3-evaluacion__contenido">
                    <div className="c3-evaluacion__cabecera">
                      <h2 id={titleId} className="c3-evaluacion__titulo">{solution.label}</h2>
                      <StatePill state={SOLUTION_STATE[status]} />
                    </div>
                    {pending ? (
                      <p className="c3-ayuda">El contenido aparece cuando cierran las entregas.</p>
                    ) : (
                      <p className="c3-evaluacion__texto">{solution.text}</p>
                    )}
                    {!pending && solution.links.length > 0 ? (
                      <ul className="c3-evaluacion__enlaces" aria-label={`Enlaces de ${solution.label}`}>
                        {solution.links.map((link) => (
                          <li key={link}>
                            <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <fieldset className="c3-evaluacion__rubrica">
                    <legend className="c3-evaluacion__leyenda">Puntajes por criterio</legend>
                    {rubric.map((criterion) => {
                      const field = `scores.${criterion.id}`;
                      const message = issueFor(issues, field);
                      const inputId = `${solution.id}-${criterion.id}`;
                      const helpId = `${inputId}-ayuda`;
                      const errorId = `${inputId}-error`;
                      return (
                        <div key={criterion.id} className="c3-evaluacion__criterio">
                          <label htmlFor={inputId} className="c3-etiqueta-campo">{criterion.label}</label>
                          <span id={helpId} className="c3-ayuda">
                            De 0 a {criterion.maxScore}
                            {weighted && typeof criterion.weight === "number" ? ` · peso ${criterion.weight} %` : ""}
                          </span>
                          <input
                            id={inputId}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={criterion.maxScore}
                            step={1}
                            className={`c3-campo c3-evaluacion__puntaje${message ? " c3-campo--error" : ""}`}
                            aria-describedby={message ? `${helpId} ${errorId}` : helpId}
                            aria-invalid={message ? true : undefined}
                            disabled={locked}
                            value={values[criterion.id] ?? ""}
                            onChange={(event) => setDrafts((current) => ({ ...current, [solution.id]: { ...scoresFor(solution), [criterion.id]: event.target.value } }))}
                          />
                          {message ? <span id={errorId} className="c3-error-campo">{message}</span> : null}
                        </div>
                      );
                    })}

                    <div className="c3-evaluacion__total">
                      <span>{total.complete ? "Total" : "Total parcial"}</span>
                      <strong>{formatNumber(total.value)} de {workspace.maxTotal}</strong>
                    </div>

                    <div className="c3-evaluacion__comentario">
                      <label htmlFor={`${solution.id}-comentario`} className="c3-etiqueta-campo">Comentario interno (opcional, solo lo ve C3)</label>
                      <textarea
                        id={`${solution.id}-comentario`}
                        className={`c3-campo${issueFor(issues, "comment") ? " c3-campo--error" : ""}`}
                        rows={3}
                        maxLength={1000}
                        disabled={locked}
                        aria-invalid={issueFor(issues, "comment") ? true : undefined}
                        value={commentFor(solution)}
                        onChange={(event) => setComments((current) => ({ ...current, [solution.id]: event.target.value }))}
                      />
                      {issueFor(issues, "comment") ? <span className="c3-error-campo">{issueFor(issues, "comment")}</span> : null}
                    </div>

                    {locked ? (
                      <span className="c3-ayuda">
                        {status === "finalized" ? `Finalizada. Total: ${solution.mine?.total} de ${workspace.maxTotal}.` : "Esperá el cierre de entregas para evaluar."}
                      </span>
                    ) : confirming === solution.id ? (
                      <div className="c3-evaluacion__confirmar" role="group" aria-label={`Confirmar la finalización de ${solution.label}`}>
                        <p>
                          <strong>¿Finalizás esta evaluación?</strong> Después no podés cambiar los puntajes ni el comentario.
                        </p>
                        <div className="c3-evaluacion__acciones">
                          <button
                            type="button"
                            className="c3-btn c3-btn--primario"
                            disabled={busy !== null}
                            onClick={() => {
                              setConfirming(null);
                              void save(solution, true);
                            }}
                          >
                            {busy === `${solution.id}-f` ? "Finalizando…" : "Sí, finalizar"}
                          </button>
                          <button type="button" className="c3-btn c3-btn--contorno" disabled={busy !== null} onClick={() => setConfirming(null)}>
                            Seguir editando
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="c3-evaluacion__acciones">
                        <button type="submit" className="c3-btn c3-btn--contorno" disabled={busy !== null}>
                          {busy === `${solution.id}-d` ? "Guardando…" : "Guardar borrador"}
                        </button>
                        <button type="button" className="c3-btn c3-btn--primario" disabled={busy !== null} onClick={() => setConfirming(solution.id)}>
                          Finalizar evaluación
                        </button>
                      </div>
                    )}
                  </fieldset>
                </form>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
