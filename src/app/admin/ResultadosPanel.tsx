"use client";

import { useEffect, useState } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import type { PresentedState } from "@/lib/domain/presentation";

interface ChallengeOption {
  id: string;
  title: string;
}

interface BoardRow {
  submissionId: string;
  label: string;
  name: string | null;
  finalizedJudges: number;
  average: number | null;
  recognition: "ganador" | "finalista" | "mencion" | null;
  evaluations: { judgeUid: string; kind: string; total: number; status: string }[];
}

interface Board {
  challengeId: string;
  title: string;
  maxTotal: number;
  status: "draft" | "published";
  showWinners: boolean;
  showScores: boolean;
  canPublish: boolean;
  blockedReason: string | null;
  rows: BoardRow[];
}

const PUBLISHED: PresentedState = { label: "Publicado", tone: "exito" };
const NOT_PUBLISHED: PresentedState = { label: "Resultado no publicado", tone: "neutro" };
const RECOGNITION_OPTIONS = [
  { value: "", label: "Ninguno" },
  { value: "ganador", label: "Ganador" },
  { value: "finalista", label: "Finalista" },
  { value: "mencion", label: "Mención" },
];

/** Resultados oficiales: evaluaciones finalizadas, promedio, reconocimientos y publicación por C3. */
export function ResultadosPanel({ challenges }: { challenges: ChallengeOption[] }) {
  const [selected, setSelected] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showWinners, setShowWinners] = useState(true);
  const [showScores, setShowScores] = useState(false);
  const challengeId = challenges.some((item) => item.id === selected) ? selected : (challenges[0]?.id ?? "");

  async function reload(id: string) {
    const data = await apiRequest<{ board: Board }>(`/api/admin/retos/${id}/resultados`);
    setBoard(data.board);
    setLoadError(null);
  }

  // Carga el tablero del challenge elegido; la respuesta actualiza el estado.
  useEffect(() => {
    if (!challengeId) return;
    let active = true;
    apiRequest<{ board: Board }>(`/api/admin/retos/${challengeId}/resultados`).then(
      (data) => {
        if (!active) return;
        setBoard(data.board);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el tablero de resultados.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  async function recognize(submissionId: string, recognition: string) {
    setActionError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiRequest(`/api/admin/retos/${challengeId}/resultados/reconocimiento`, {
        method: "PUT",
        body: { submissionId, recognition: recognition || null },
      });
      setNotice("Reconocimiento guardado.");
      await reload(challengeId);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No pudimos guardar el reconocimiento.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setActionError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiRequest(`/api/admin/retos/${challengeId}/publicar`, { method: "POST", body: { showWinners, showScores } });
      setNotice("Resultado publicado. Ya lo ven los participantes y la empresa según lo autorizado.");
      await reload(challengeId);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No pudimos publicar el resultado.");
    } finally {
      setBusy(false);
    }
  }

  if (challenges.length === 0) {
    return <div className="c3-card" style={{ padding: 24 }}><p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay challenges con resultados.</p></div>;
  }

  const published = board?.status === "published";

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Resultados oficiales</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Cada solución necesita dos evaluaciones finalizadas de jurados distintos antes de publicar.</p>
      </div>

      <label htmlFor="res-reto" className="c3-etiqueta-campo">Challenge</label>
      <select id="res-reto" className="c3-campo" value={challengeId} onChange={(event) => setSelected(event.target.value)} style={{ maxWidth: 520 }}>
        {challenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}
      {board ? <StatePill state={published ? PUBLISHED : NOT_PUBLISHED} /> : null}

      {board && !published && board.blockedReason ? (
        <div className="c3-alerta c3-alerta--advertencia" role="status"><strong>No se puede publicar todavía</strong><span style={{ fontSize: 14, lineHeight: 1.5 }}>{board.blockedReason}</span></div>
      ) : null}

      {board ? (
        <section className="c3-card" style={{ overflow: "hidden" }} aria-label="Soluciones y evaluaciones">
          <div style={{ display: "flex", padding: "12px 20px", background: "var(--c3-superficie-sutil)", gap: 12, fontSize: 13, fontWeight: 600, flexWrap: "wrap" }}>
            <span style={{ flex: "2 1 200px" }}>Solución</span>
            <span style={{ flex: "1 1 140px" }}>Evaluaciones</span>
            <span style={{ flex: "1 1 100px" }}>Promedio</span>
            <span style={{ flex: "1 1 180px" }}>Reconocimiento</span>
          </div>
          {board.rows.length === 0 ? <p style={{ padding: 20, fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay soluciones enviadas.</p> : null}
          {board.rows.map((row) => (
            <div key={row.submissionId} role="group" aria-label={row.label} style={{ display: "flex", padding: "14px 20px", gap: 12, alignItems: "center", borderTop: "1px solid var(--c3-borde)", fontSize: 14, flexWrap: "wrap" }}>
              <span style={{ flex: "2 1 200px", fontWeight: 600 }}>{row.label}{row.name ? ` · ${row.name}` : ""}</span>
              <span style={{ flex: "1 1 140px" }}>
                {row.finalizedJudges} de 2 jurados
                <span style={{ display: "block", fontSize: 12, color: "var(--c3-texto-suave)" }}>
                  {row.evaluations.map((item) => `${item.total}/${board.maxTotal}${item.status === "finalized" ? "" : " (en curso)"}`).join(" · ") || "Sin evaluaciones"}
                </span>
              </span>
              <span style={{ flex: "1 1 100px", fontFamily: "var(--c3-font-titulo)", fontWeight: 700, fontSize: 16 }}>{row.average !== null ? row.average.toFixed(1) : "—"}</span>
              <span style={{ flex: "1 1 180px" }}>
                <label htmlFor={`rec-${row.submissionId}`} className="c3-visualmente-oculto">Reconocimiento de {row.label}</label>
                <select
                  id={`rec-${row.submissionId}`}
                  className="c3-campo"
                  style={{ minHeight: 40 }}
                  disabled={published || busy}
                  value={row.recognition ?? ""}
                  onChange={(event) => void recognize(row.submissionId, event.target.value)}
                >
                  {RECOGNITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </span>
            </div>
          ))}
        </section>
      ) : null}

      {board && !published ? (
        <section className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }} aria-label="Qué verá cada destinatario">
          <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Qué verá cada destinatario al publicar</span>
          <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, minHeight: 28 }}>
            <input type="checkbox" checked={showWinners} onChange={(event) => setShowWinners(event.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
            Ganadores y reconocimientos, en la página pública del challenge
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, minHeight: 28 }}>
            <input type="checkbox" checked={showScores} onChange={(event) => setShowScores(event.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)" }} />
            Puntaje promedio, a cada participante y a la empresa
          </label>
          <span className="c3-ayuda">Los comentarios de jurados no se publican en el MVP.</span>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--c3-borde)" }}>
            <button type="button" className="c3-btn c3-btn--primario" disabled={busy || !board.canPublish} onClick={() => void publish()}>
              Publicar resultado
            </button>
            <span className="c3-ayuda" style={{ maxWidth: 360 }}>Se habilita cuando todas las soluciones tengan las dos evaluaciones finalizadas.</span>
          </div>
        </section>
      ) : null}
    </>
  );
}
