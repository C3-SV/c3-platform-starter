"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { CHECKPOINT_LIMITS } from "@/lib/domain/process";
import type { CheckpointView } from "@/lib/server/talent";

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/**
 * Bitácora de proceso (J5): avances y decisiones con enlace opcional. La escribe la persona hasta el cierre
 * de entregas; C3 y la empresa la ven en el tablero de talento.
 */
export function BitacoraPanel({ challengeId }: { challengeId: string }) {
  const [checkpoints, setCheckpoints] = useState<CheckpointView[] | null>(null);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<{ checkpoints: CheckpointView[] }>(`/api/retos/${challengeId}/bitacora`).then(
      (data) => {
        if (active) setCheckpoints(data.checkpoints);
      },
      () => {
        if (active) setError("No pudimos cargar tu bitácora. Recargá la página para intentar de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  async function agregar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setIssues([]);
    try {
      const data = await apiRequest<{ checkpoint: CheckpointView }>(`/api/retos/${challengeId}/bitacora`, {
        method: "POST",
        body: { text, link },
      });
      setCheckpoints((actual) => [...(actual ?? []), data.checkpoint]);
      setText("");
      setLink("");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setIssues(caught.issues);
        setError(caught.message);
      } else {
        setError("No pudimos guardar el avance. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="bitacora-titulo" className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Bitácora</span>
        <h2 id="bitacora-titulo" className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>Avances y decisiones</h2>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
          Anotá lo que probaste y por qué decidiste lo que decidiste. Podés agregar un enlace https (repositorio, demo o notas). La bitácora se cierra con el plazo de entregas.
        </p>
      </div>

      {error ? <div className="c3-alerta c3-alerta--error" role="alert">{error}</div> : null}

      {checkpoints === null && !error ? <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando tu bitácora…</p> : null}
      {checkpoints !== null && checkpoints.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay avances registrados.</p>
      ) : null}
      {checkpoints?.map((checkpoint) => (
        <article key={checkpoint.id} style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{formatDateTime(checkpoint.createdAt) ?? ""}</span>
          <p style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>{checkpoint.text}</p>
          {checkpoint.link ? <a href={checkpoint.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{checkpoint.link}</a> : null}
        </article>
      ))}

      <form onSubmit={agregar} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--c3-borde)", paddingTop: 16 }}>
        <label htmlFor="bitacora-texto" className="c3-etiqueta-campo">Nuevo avance</label>
        <textarea
          id="bitacora-texto"
          className={`c3-campo${issueFor(issues, "text") ? " c3-campo--error" : ""}`}
          rows={3}
          maxLength={CHECKPOINT_LIMITS.text.max}
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-invalid={issueFor(issues, "text") ? true : undefined}
          aria-describedby={issueFor(issues, "text") ? "bitacora-texto-error" : undefined}
        />
        {issueFor(issues, "text") ? <span id="bitacora-texto-error" style={{ fontSize: 13, color: "var(--c3-error)" }}>{issueFor(issues, "text")}</span> : null}
        <label htmlFor="bitacora-enlace" className="c3-etiqueta-campo">Enlace (opcional)</label>
        <input
          id="bitacora-enlace"
          type="url"
          className={`c3-campo${issueFor(issues, "link") ? " c3-campo--error" : ""}`}
          maxLength={CHECKPOINT_LIMITS.link}
          value={link}
          onChange={(event) => setLink(event.target.value)}
          aria-invalid={issueFor(issues, "link") ? true : undefined}
        />
        {issueFor(issues, "link") ? <span style={{ fontSize: 13, color: "var(--c3-error)" }}>{issueFor(issues, "link")}</span> : null}
        <div>
          <button type="submit" className="c3-btn c3-btn--primario" disabled={busy}>{busy ? "Guardando…" : "Agregar a la bitácora"}</button>
        </div>
      </form>
    </section>
  );
}
