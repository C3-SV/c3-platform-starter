"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { DEFENSE_LIMITS } from "@/lib/domain/defense";
import type { DefenseView } from "@/lib/server/talent";

interface Campos {
  videoUrl: string;
  summary: string;
  decisions: string;
  testing: string;
  tradeoffs: string;
  aiUse: string;
}

const VACIO: Campos = { videoUrl: "", summary: "", decisions: "", testing: "", tradeoffs: "", aiUse: "" };

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/**
 * Defensa de mi entrega: un recurso separado y visible. Se registra sobre la entrega enviada;
 * el uso de herramientas de IA se explica sin juzgarlo. En equipo, el servidor reserva el registro a la líder.
 */
export function DefensaPanel({ challengeId, submitted }: { challengeId: string; submitted: boolean }) {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [saved, setSaved] = useState<DefenseView | null>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<{ defense: DefenseView | null }>(`/api/retos/${challengeId}/defensa`).then(
      (data) => {
        if (!active || !data.defense) return;
        setSaved(data.defense);
        setCampos({
          videoUrl: data.defense.videoUrl ?? "",
          summary: data.defense.summary,
          decisions: data.defense.decisions,
          testing: data.defense.testing ?? "",
          tradeoffs: data.defense.tradeoffs ?? "",
          aiUse: data.defense.aiUse ?? "",
        });
      },
      () => {
        if (active) setError("No pudimos cargar tu defensa. Recargá la página para intentar de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  function cambiar(campo: keyof Campos, valor: string) {
    setCampos((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !submitted) return;
    setBusy(true);
    setError(null);
    setIssues([]);
    setNotice(null);
    try {
      const data = await apiRequest<{ defense: DefenseView }>(`/api/retos/${challengeId}/defensa`, { method: "PUT", body: campos });
      setSaved(data.defense);
      setNotice("Defensa guardada. Podés actualizarla cuando quieras.");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setIssues(caught.issues);
        setError(caught.message);
      } else {
        setError("No pudimos guardar la defensa. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  const campo = (name: keyof Campos, label: string, ayuda: string, limite: number, obligatorio: boolean, filas = 3) => {
    const mensaje = issueFor(issues, name);
    const id = `defensa-${name}`;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor={id} className="c3-etiqueta-campo">{label}{obligatorio ? "" : " (opcional)"}</label>
        <span style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>{ayuda}</span>
        <textarea
          id={id}
          className={`c3-campo${mensaje ? " c3-campo--error" : ""}`}
          rows={filas}
          maxLength={limite}
          value={campos[name]}
          disabled={!submitted || busy}
          onChange={(event) => cambiar(name, event.target.value)}
          aria-invalid={mensaje ? true : undefined}
          aria-describedby={mensaje ? `${id}-error` : undefined}
        />
        {mensaje ? <span id={`${id}-error`} style={{ fontSize: 13, color: "var(--c3-error)" }}>{mensaje}</span> : null}
      </div>
    );
  };

  return (
    <section aria-labelledby="defensa-titulo" className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Defensa</span>
        <h2 id="defensa-titulo" className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>Explicá qué construiste y por qué</h2>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
          Contá qué decisiones tomaste, cómo comprobaste que funciona y qué limitaciones tiene. Si usaste herramientas de IA, decí cómo las usaste: no se penaliza, lo que evaluamos es que puedas explicarlo.
        </p>
        {!submitted ? (
          <div className="c3-alerta c3-alerta--info" role="note"><span>La defensa se registra sobre tu entrega enviada. Enviala primero para habilitar este formulario.</span></div>
        ) : null}
      </div>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status">{notice}</div> : null}
      {error && issues.length === 0 ? <div className="c3-alerta c3-alerta--error" role="alert">{error}</div> : null}

      <form onSubmit={guardar} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="defensa-videoUrl" className="c3-etiqueta-campo">Enlace de la defensa (opcional)</label>
          <span style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>Video o presentación en https, de hasta {DEFENSE_LIMITS.videoUrl} caracteres.</span>
          <input
            id="defensa-videoUrl"
            type="url"
            className={`c3-campo${issueFor(issues, "videoUrl") ? " c3-campo--error" : ""}`}
            maxLength={DEFENSE_LIMITS.videoUrl}
            value={campos.videoUrl}
            disabled={!submitted || busy}
            onChange={(event) => cambiar("videoUrl", event.target.value)}
            aria-invalid={issueFor(issues, "videoUrl") ? true : undefined}
          />
          {issueFor(issues, "videoUrl") ? <span style={{ fontSize: 13, color: "var(--c3-error)" }}>{issueFor(issues, "videoUrl")}</span> : null}
        </div>
        {campo("summary", "Resumen de la solución", "Qué hace tu solución y para quién.", DEFENSE_LIMITS.summary.max, true, 4)}
        {campo("decisions", "Decisiones principales", "Dos o tres decisiones que cambiaron el resultado, con su porqué.", DEFENSE_LIMITS.decisions.max, true, 4)}
        {campo("testing", "Pruebas realizadas", "Cómo comprobaste que funciona.", DEFENSE_LIMITS.optional, false)}
        {campo("tradeoffs", "Trade-offs y limitaciones", "Qué sacrificaste y qué no resuelve todavía.", DEFENSE_LIMITS.optional, false)}
        {campo("aiUse", "Uso de herramientas de IA", "Para qué las usaste y qué revisaste vos.", DEFENSE_LIMITS.optional, false)}

        <div>
          <button type="submit" className="c3-btn c3-btn--primario" disabled={!submitted || busy}>
            {busy ? "Guardando…" : saved ? "Actualizar defensa" : "Guardar defensa"}
          </button>
        </div>
      </form>
    </section>
  );
}
