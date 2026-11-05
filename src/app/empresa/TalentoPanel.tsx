"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { CONTACT_MESSAGE_MAX, SHORTLIST_REASON_LIMITS } from "@/lib/domain/contact";
import { maxTotal } from "@/lib/domain/evaluation";
import type { TalentBoard, TalentRow } from "@/lib/server/talent";

/** Estados de evaluación visibles para la empresa. Los puntajes solo aparecen cuando C3 publicó con puntajes visibles. */
const EVALUATION_LABEL: Record<string, string> = {
  sin_evaluar: "Sin evaluar",
  en_evaluacion: "En evaluación",
  lista_para_publicar: "Lista para publicar",
  publicada: "Publicada",
  sin_completar: "Sin completar",
};

type Filtro = "todas" | "lista" | "defensa" | "pendientes";
type Orden = "mejor" | "reciente";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "lista", label: "En lista corta" },
  { id: "defensa", label: "Con defensa" },
  { id: "pendientes", label: "Sin evaluar" },
];

function matches(filtro: Filtro, row: TalentRow): boolean {
  if (filtro === "lista") return row.shortlist !== null;
  if (filtro === "defensa") return row.defense !== null;
  if (filtro === "pendientes") return row.evaluation.state === "sin_evaluar" || row.evaluation.state === "en_evaluacion";
  return true;
}

/**
 * Exploración de resultados de un challenge: cifras, filtros, comparación por persona, matriz por criterio y una ficha
 * con la evidencia (entregable, proceso y defensa) y las decisiones de la empresa (retroalimentación, lista corta y contacto).
 * El servidor decide qué puede hacer cada cuenta; esta vista solo muestra las acciones que el tablero permite.
 */
export function TalentoPanel({ challengeId }: { challengeId: string }) {
  const [board, setBoard] = useState<TalentBoard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [orden, setOrden] = useState<Orden>("mejor");
  // undefined: la ficha de la primera persona; null: ninguna abierta.
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    apiRequest<{ board: TalentBoard }>(`/api/empresa/retos/${challengeId}/talento`).then(
      (data) => {
        if (active) setBoard(data.board);
      },
      (error: unknown) => {
        if (active) setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar el talento de este challenge.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  async function reload() {
    const data = await apiRequest<{ board: TalentBoard }>(`/api/empresa/retos/${challengeId}/talento`);
    setBoard(data.board);
  }

  async function run(key: string, action: () => Promise<unknown>, done: string) {
    setBusy(key);
    setNotice(null);
    setLoadError(null);
    try {
      await action();
      await reload();
      setNotice(done);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos guardar el cambio. Intentá de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  if (loadError && !board) {
    return <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div>;
  }
  if (!board) return <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando entregas…</p>;

  const max = maxTotal(board.challenge.rubric);
  const visibles = board.rows
    .filter((row) => matches(filtro, row))
    .sort((a, b) =>
      orden === "mejor"
        ? (b.evaluation.average ?? -1) - (a.evaluation.average ?? -1) || (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "")
        : (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""),
    );
  const abiertaId = openId === undefined ? (visibles[0]?.submissionId ?? null) : openId;
  const abierta = visibles.find((row) => row.submissionId === abiertaId) ?? null;
  const evaluadas = board.rows.filter((row) => row.evaluation.state === "publicada" || row.evaluation.state === "lista_para_publicar").length;

  function abrir(row: TalentRow) {
    const cerrar = abiertaId === row.submissionId;
    setOpenId(cerrar ? null : row.submissionId);
    if (!cerrar) {
      requestAnimationFrame(() => {
        const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById(`entrega-${row.submissionId}`)?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
      });
    }
  }

  return (
    <section aria-label={`Talento del challenge ${board.challenge.title}`} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {board.challenge.isDemo ? (
        <span className="c3-etiqueta" style={{ color: "var(--c3-advertencia)" }}>Datos demostrativos · evaluación de demostración</span>
      ) : null}
      {notice ? <div className="c3-alerta c3-alerta--exito" role="status">{notice}</div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert">{loadError}</div> : null}

      {board.rows.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay entregas enviadas. Aparecen aquí cuando la persona las envía.</p>
      ) : (
        <>
          <dl className="c3-res-kpis" aria-label="Cifras de las entregas">
            {[
              ["Entregas enviadas", board.rows.length],
              ["Evaluadas", evaluadas],
              ["En lista corta", board.rows.filter((row) => row.shortlist).length],
              ["Con solicitud de contacto", board.rows.filter((row) => row.contact).length],
            ].map(([label, value]) => (
              <div key={label} className="c3-res-kpi">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="c3-res-herramientas">
            <div className="c3-res-filtros" role="group" aria-label="Filtrar entregas">
              {FILTROS.map((item) => (
                <button key={item.id} type="button" className="c3-res-filtro" aria-pressed={filtro === item.id} onClick={() => setFiltro(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="res-orden" style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Ordenar por</label>
              <select id="res-orden" className="c3-campo" style={{ width: "auto", minHeight: 40 }} value={orden} onChange={(event) => setOrden(event.target.value as Orden)}>
                <option value="mejor">Mejor evaluadas</option>
                <option value="reciente">Más recientes</option>
              </select>
            </div>
          </div>

          <div className="c3-res-envoltura">
            <table className="c3-res-tabla" aria-label="Comparación de entregas">
              <caption>
                Comparación de evidencia: entregable, defensa, lista corta y contacto. Elegí una persona para abrir su ficha.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Participante</th>
                  <th scope="col" className="c3-res-oculta-movil">Entrega</th>
                  <th scope="col" className="c3-res-oculta-movil">Defensa</th>
                  <th scope="col" className="c3-res-oculta-movil">Lista corta</th>
                  <th scope="col">Evaluación</th>
                  <th scope="col">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--c3-texto-suave)" }}>Ninguna entrega cumple este filtro.</td>
                  </tr>
                ) : null}
                {visibles.map((row) => (
                  <tr key={row.submissionId} data-abierta={abiertaId === row.submissionId}>
                    <td>
                      <button
                        type="button"
                        className="c3-res-nombre"
                        aria-expanded={abiertaId === row.submissionId}
                        aria-controls={abiertaId === row.submissionId ? `entrega-${row.submissionId}` : undefined}
                        onClick={() => abrir(row)}
                      >
                        {row.name ?? "Sin nombre"}
                      </button>
                      <span style={{ display: "block", fontSize: 12, color: "var(--c3-texto-suave)" }}>{row.mode === "team" ? "Equipo" : "Individual"}</span>
                      {/* En teléfono las columnas de defensa y lista corta se ocultan: su estado va aquí para no perderlo. */}
                      <span className="c3-res-solo-movil">
                        Defensa {row.defense ? "registrada" : "pendiente"} · Lista corta {row.shortlist ? "sí" : "no"}
                      </span>
                    </td>
                    <td className="c3-res-oculta-movil">
                      {formatDateTime(row.submittedAt) ?? "Sin fecha"}
                      {row.links.length > 0 ? ` · ${row.links.length} ${row.links.length === 1 ? "enlace" : "enlaces"}` : ""}
                    </td>
                    <td className="c3-res-oculta-movil">{row.defense ? "Registrada" : "Pendiente"}</td>
                    <td className="c3-res-oculta-movil">{row.shortlist ? "Sí" : "No"}</td>
                    <td>
                      <span>
                        {EVALUATION_LABEL[row.evaluation.state] ?? row.evaluation.state}
                        {row.evaluation.average !== null ? ` · promedio ${row.evaluation.average.toFixed(1)}` : ""}
                      </span>
                      {row.evaluation.average !== null ? (
                        <span className="c3-res-barra" aria-hidden="true">
                          <span style={{ width: `${Math.min(100, Math.max(0, (row.evaluation.average / max) * 100))}%` }} />
                        </span>
                      ) : null}
                    </td>
                    <td>{row.contact ? <StatePill state={row.contact.state} /> : row.canRequestContact ? "Disponible" : "No disponible"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {board.rows.some((row) => row.evaluation.criteria !== null) ? (
            <div className="c3-res-envoltura">
              <table className="c3-res-tabla" aria-label="Matriz por criterio">
                <caption>
                  Matriz por criterio: promedio de los jurados finalizados. Visible porque C3 publicó los resultados con puntajes.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Participante</th>
                    {board.challenge.rubric.map((criterion) => (
                      <th key={criterion.id} scope="col">
                        {criterion.label} (máx. {criterion.maxScore}){typeof criterion.weight === "number" ? ` · ${criterion.weight} %` : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibles.filter((row) => row.evaluation.criteria !== null).map((row) => (
                    <tr key={row.submissionId}>
                      <td style={{ fontWeight: 600 }}>{row.name ?? "Sin nombre"}</td>
                      {board.challenge.rubric.map((criterion) => {
                        const value = row.evaluation.criteria?.[criterion.id];
                        const ratio = typeof value === "number" ? value / criterion.maxScore : 0;
                        return (
                          <td key={criterion.id}>
                            <span className="c3-res-calor" style={{ display: "inline-block", background: `color-mix(in srgb, var(--c3-conecta) ${Math.round(ratio * 45) + 5}%, var(--c3-superficie))` }}>
                              {typeof value === "number" ? value.toFixed(1) : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {abierta ? (
            <TalentoFila
              key={abierta.submissionId}
              row={abierta}
              busy={busy}
              onShortlist={(reason) => run(`lista:${abierta.submissionId}`, () => apiRequest(`/api/empresa/retos/${challengeId}/lista-corta`, { method: "POST", body: { submissionId: abierta.submissionId, reason } }), "Agregada a la lista corta.")}
              onUnshortlist={() => run(`lista:${abierta.submissionId}`, () => apiRequest(`/api/empresa/retos/${challengeId}/lista-corta/${abierta.submissionId}`, { method: "DELETE" }), "Quitada de la lista corta.")}
              onRequestContact={(message) => run(`contacto:${abierta.submissionId}`, () => apiRequest(`/api/empresa/retos/${challengeId}/contacto`, { method: "POST", body: { submissionId: abierta.submissionId, message } }), "Solicitud enviada. Queda esperando el consentimiento de la persona.")}
              challengeId={challengeId}
              onFeedbackSaved={() => {
                setNotice(null);
                setLoadError(null);
                reload().then(
                  () => setNotice("Retroalimentación guardada."),
                  () => setLoadError("La retroalimentación se guardó, pero no pudimos actualizar el tablero. Recargá la página."),
                );
              }}
              onAdvance={(requestId, to) => run(`avance:${requestId}`, () => apiRequest(`/api/empresa/contactos/${requestId}`, { method: "PATCH", body: { to } }), "Seguimiento registrado.")}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

interface FilaProps {
  row: TalentRow;
  challengeId: string;
  onFeedbackSaved: () => void;
  busy: string | null;
  onShortlist: (reason: string) => void;
  onUnshortlist: () => void;
  onRequestContact: (message: string) => void;
  onAdvance: (requestId: string, to: "contactado" | "seguimiento") => void;
}

function TalentoFila({ row, challengeId, onFeedbackSaved, busy, onShortlist, onUnshortlist, onRequestContact, onAdvance }: FilaProps) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const isTeam = row.mode === "team";
  const shortlistBusy = busy === `lista:${row.submissionId}`;
  const contactBusy = busy === `contacto:${row.submissionId}`;

  function submitShortlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = reason.trim();
    if (value.length < SHORTLIST_REASON_LIMITS.min) {
      setReasonError(`Explicá por qué destaca (al menos ${SHORTLIST_REASON_LIMITS.min} caracteres).`);
      return;
    }
    setReasonError(null);
    onShortlist(value);
  }

  return (
    <article id={`entrega-${row.submissionId}`} className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, scrollMarginTop: 16 }} aria-label={`Ficha de ${row.name ?? "la persona"}`}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Ficha de la persona</span>
          <h3 className="c3-titulo c3-talento__nombre">{row.name ?? "Sin nombre"}</h3>
          <span style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>{isTeam ? "Equipo" : "Individual"} · Enviada {formatDateTime(row.submittedAt) ?? ""}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {row.shortlist ? <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>En lista corta</span> : null}
          {row.contact ? <StatePill state={row.contact.state} /> : null}
        </div>
      </header>

      <div className="c3-res-ficha">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Evidencia titulo="Entregable" pregunta="¿Qué construyó?">
            <p style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-line" }}>{row.text}</p>
            {row.links.map((link) => (
              <a key={link} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{link}</a>
            ))}
          </Evidencia>
          <Evidencia titulo="Proceso" pregunta="¿Cómo llegó al resultado?">
            {row.defense?.decisions ? <p style={{ fontSize: 14, lineHeight: 1.55 }}><strong>Decisiones:</strong> {row.defense.decisions}</p> : <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay decisiones registradas.</p>}
            {row.defense?.testing ? <p style={{ fontSize: 14, lineHeight: 1.55 }}><strong>Pruebas:</strong> {row.defense.testing}</p> : null}
            {row.defense?.tradeoffs ? <p style={{ fontSize: 14, lineHeight: 1.55 }}><strong>Trade-offs:</strong> {row.defense.tradeoffs}</p> : null}
            {row.checkpoints.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--c3-borde)", paddingTop: 8 }}>
                <strong style={{ fontSize: 14 }}>Bitácora ({row.checkpoints.length})</strong>
                {row.checkpoints.map((checkpoint) => (
                  <p key={checkpoint.id} style={{ fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ color: "var(--c3-texto-suave)" }}>{formatDateTime(checkpoint.createdAt) ?? ""}:</span> {checkpoint.text}
                    {checkpoint.link ? <> · <a href={checkpoint.link} target="_blank" rel="noopener noreferrer">enlace</a></> : null}
                  </p>
                ))}
              </div>
            ) : null}
          </Evidencia>
          <Evidencia titulo="Defensa" pregunta="¿Lo comprende y puede defenderlo?">
            {row.defense ? (
              <>
                <p style={{ fontSize: 14, lineHeight: 1.55 }}>{row.defense.summary}</p>
                {row.defense.videoUrl ? <a href={row.defense.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>Ver la defensa</a> : null}
                {row.defense.aiUse ? <p style={{ fontSize: 13, color: "var(--c3-texto-suave)", lineHeight: 1.5 }}><strong>Herramientas de IA:</strong> {row.defense.aiUse}</p> : null}
              </>
            ) : (
              <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>La persona todavía no registró su defensa.</p>
            )}
          </Evidencia>
        </div>

        <div className="c3-res-decision">
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Tu decisión</h3>

          <RetroalimentacionForm challengeId={challengeId} row={row} onSaved={onFeedbackSaved} />

          <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600 }}>Lista corta</h4>
            {row.shortlist ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}><strong>Motivo en lista corta:</strong> {row.shortlist.reason}</span>
                <div>
                  <button type="button" className="c3-btn c3-btn--contorno" onClick={onUnshortlist} disabled={shortlistBusy}>
                    {shortlistBusy ? "Quitando…" : "Quitar de la lista corta"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitShortlist} noValidate style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor={`motivo-${row.submissionId}`} className="c3-etiqueta-campo">Motivo para la lista corta</label>
                <textarea
                  id={`motivo-${row.submissionId}`}
                  className={`c3-campo${reasonError ? " c3-campo--error" : ""}`}
                  rows={2}
                  maxLength={SHORTLIST_REASON_LIMITS.max}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  aria-invalid={reasonError ? true : undefined}
                  aria-describedby={reasonError ? `motivo-error-${row.submissionId}` : undefined}
                />
                {reasonError ? <span id={`motivo-error-${row.submissionId}`} style={{ fontSize: 13, color: "var(--c3-error)" }}>{reasonError}</span> : null}
                <div>
                  <button type="submit" className="c3-btn c3-btn--primario" disabled={shortlistBusy}>{shortlistBusy ? "Agregando…" : "Agregar a lista corta"}</button>
                </div>
              </form>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600 }}>Contacto</h4>
            {row.contact ? (
              <ContactoAcciones row={row} busy={busy} onAdvance={onAdvance} />
            ) : row.canRequestContact ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onRequestContact(message.trim());
                }}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {isTeam ? <p style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>La solicitud va a la líder del equipo, que decide si acepta.</p> : null}
                <label htmlFor={`mensaje-${row.submissionId}`} className="c3-etiqueta-campo">Mensaje (opcional, hasta {CONTACT_MESSAGE_MAX} caracteres)</label>
                <textarea id={`mensaje-${row.submissionId}`} className="c3-campo" rows={2} maxLength={CONTACT_MESSAGE_MAX} value={message} onChange={(event) => setMessage(event.target.value)} />
                <div>
                  <button type="submit" className="c3-btn c3-btn--primario" disabled={contactBusy}>{contactBusy ? "Enviando…" : "Solicitar contacto"}</button>
                </div>
              </form>
            ) : (
              <p style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>Para solicitar contacto, agregá a la persona a la lista corta y revisá que tenga inscripción aprobada.</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ContactoAcciones({ row, busy, onAdvance }: { row: TalentRow; busy: string | null; onAdvance: FilaProps["onAdvance"] }) {
  const contact = row.contact;
  if (!contact) return null;
  const advanceBusy = busy === `avance:${contact.id}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>
        <strong>Solicitud de contacto:</strong> {contact.state.label}.{" "}
        {contact.status === "esperando_consentimiento" ? "La persona decide si acepta. Mientras tanto no se comparte ningún dato de contacto." : null}
      </span>
      {contact.status === "aceptado" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
            Canal simulado de la demo: C3 facilita el contacto por mensaje interno. No se comparten correo ni teléfono.
          </p>
          <button type="button" className="c3-btn c3-btn--contorno" disabled={advanceBusy} onClick={() => onAdvance(contact.id, "contactado")}>
            {advanceBusy ? "Guardando…" : "Registrar que ya la contactamos"}
          </button>
        </div>
      ) : null}
      {contact.status === "contactado" ? (
        <div>
          <button type="button" className="c3-btn c3-btn--contorno" disabled={advanceBusy} onClick={() => onAdvance(contact.id, "seguimiento")}>
            {advanceBusy ? "Guardando…" : "Registrar seguimiento"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Retroalimentación de la empresa sobre una entrega. Sin publicar, solo la ve la empresa; publicada, la ve la persona. */
function RetroalimentacionForm({ challengeId, row, onSaved }: { challengeId: string; row: TalentRow; onSaved: () => void }) {
  const current = row.feedback;
  const [text, setText] = useState(current?.text ?? "");
  const [publish, setPublish] = useState(Boolean(current?.publishedAt));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/empresa/retos/${challengeId}/retroalimentacion`, {
        method: "PUT",
        body: { submissionId: row.submissionId, text: text.trim(), publish },
      });
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No pudimos guardar la retroalimentación. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600 }}>Retroalimentación</h4>
      <label htmlFor={`retro-${row.submissionId}`} className="c3-etiqueta-campo">Retroalimentación (entre 20 y 1500 caracteres)</label>
      <textarea id={`retro-${row.submissionId}`} className="c3-campo" rows={3} maxLength={1500} value={text} onChange={(event) => setText(event.target.value)} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14 }}>
        <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} />
        Publicar para la persona. Sin publicar, solo la ve la empresa.
      </label>
      {error ? <span role="alert" style={{ fontSize: 13, color: "var(--c3-error)" }}>{error}</span> : null}
      <div>
        <button type="submit" className="c3-btn c3-btn--contorno" disabled={saving}>
          {saving ? "Guardando…" : current ? "Actualizar retroalimentación" : "Guardar retroalimentación"}
        </button>
      </div>
    </form>
  );
}

function Evidencia({ titulo, pregunta, children }: { titulo: string; pregunta: string; children: ReactNode }) {
  return (
    <details className="c3-res-bloque" open>
      <summary>
        {titulo}
        <small>{pregunta}</small>
      </summary>
      {children}
    </details>
  );
}
