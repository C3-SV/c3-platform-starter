"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { CONTACT_MESSAGE_MAX, SHORTLIST_REASON_LIMITS } from "@/lib/domain/contact";
import type { TalentBoard, TalentRow } from "@/lib/server/talent";

/**
 * E3–E8 · Talento de un challenge: entregas enviadas con su evidencia separada (entregable, proceso y defensa),
 * lista corta con motivo y solicitud de contacto que queda esperando el consentimiento de la persona.
 * El servidor decide qué puede hacer cada cuenta; esta vista solo muestra las acciones que el tablero permite.
 */
export function TalentoPanel({ challengeId }: { challengeId: string }) {
  const [board, setBoard] = useState<TalentBoard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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

  return (
    <section aria-label={`Talento del challenge ${board.challenge.title}`} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {board.challenge.isDemo ? (
        <span className="c3-etiqueta" style={{ color: "var(--c3-advertencia)" }}>Datos demostrativos · evaluación de demostración</span>
      ) : null}
      {notice ? <div className="c3-alerta c3-alerta--exito" role="status">{notice}</div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert">{loadError}</div> : null}

      {board.rows.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table aria-label="Comparación de entregas" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <caption style={{ textAlign: "left", fontSize: 14, color: "var(--c3-texto-suave)", paddingBottom: 8 }}>
              Comparación de evidencia: entregable, defensa, lista corta y contacto. Cada participante enlaza a su ficha.
            </caption>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--c3-borde-fuerte)" }}>
                <th scope="col" style={{ padding: "8px 12px" }}>Participante</th>
                <th scope="col" style={{ padding: "8px 12px" }}>Entrega</th>
                <th scope="col" style={{ padding: "8px 12px" }}>Defensa</th>
                <th scope="col" style={{ padding: "8px 12px" }}>Lista corta</th>
                <th scope="col" style={{ padding: "8px 12px" }}>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {board.rows.map((row) => (
                <tr key={row.submissionId} style={{ borderBottom: "1px solid var(--c3-borde)" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <a href={`#entrega-${row.submissionId}`}>{row.name ?? "Sin nombre"}</a> · {row.mode === "team" ? "Equipo" : "Individual"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {formatDateTime(row.submittedAt) ?? "Sin fecha"}
                    {row.links.length > 0 ? ` · ${row.links.length} ${row.links.length === 1 ? "enlace" : "enlaces"}` : ""}
                  </td>
                  <td style={{ padding: "8px 12px" }}>{row.defense ? "Registrada" : "Pendiente"}</td>
                  <td style={{ padding: "8px 12px" }}>{row.shortlist ? "Sí" : "No"}</td>
                  <td style={{ padding: "8px 12px" }}>{row.contact ? row.contact.state.label : row.canRequestContact ? "Disponible" : row.mode === "team" ? "No disponible para equipos" : "No disponible"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {board.rows.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay entregas enviadas. Aparecen aquí cuando la persona las envía.</p>
      ) : (
        board.rows.map((row) => (
          <TalentoFila
            key={row.submissionId}
            row={row}
            busy={busy}
            onShortlist={(reason) => run(`lista:${row.submissionId}`, () => apiRequest(`/api/empresa/retos/${challengeId}/lista-corta`, { method: "POST", body: { submissionId: row.submissionId, reason } }), "Agregada a la lista corta.")}
            onUnshortlist={() => run(`lista:${row.submissionId}`, () => apiRequest(`/api/empresa/retos/${challengeId}/lista-corta/${row.submissionId}`, { method: "DELETE" }), "Quitada de la lista corta.")}
            onRequestContact={(message) => run(`contacto:${row.submissionId}`, () => apiRequest(`/api/empresa/retos/${challengeId}/contacto`, { method: "POST", body: { submissionId: row.submissionId, message } }), "Solicitud enviada. Queda esperando el consentimiento de la persona.")}
            challengeId={challengeId}
            onFeedbackSaved={() => void reload().then(() => setNotice("Retroalimentación guardada."))}
            onAdvance={(requestId, to) => run(`avance:${requestId}`, () => apiRequest(`/api/empresa/contactos/${requestId}`, { method: "PATCH", body: { to } }), "Seguimiento registrado.")}
          />
        ))
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
    <article id={`entrega-${row.submissionId}`} className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="c3-titulo" style={{ fontSize: 20, fontWeight: 600 }}>{row.name ?? "Sin nombre"} · {isTeam ? "Equipo" : "Individual"}</span>
          <span style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>Enviada {formatDateTime(row.submittedAt) ?? ""}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {row.shortlist ? <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>En lista corta</span> : null}
          {row.contact ? <StatePill state={row.contact.state} /> : null}
        </div>
      </header>

      <div className="c3-dos-columnas" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <Evidencia titulo="Entregable" pregunta="¿Qué construyó?">
          <p style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>{row.text}</p>
          {row.links.map((link) => (
            <a key={link} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{link}</a>
          ))}
        </Evidencia>
        <Evidencia titulo="Proceso" pregunta="¿Cómo llegó al resultado?">
          {row.defense?.decisions ? <p style={{ fontSize: 14, lineHeight: 1.5 }}><strong>Decisiones:</strong> {row.defense.decisions}</p> : <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay decisiones registradas.</p>}
          {row.defense?.testing ? <p style={{ fontSize: 14, lineHeight: 1.5 }}><strong>Pruebas:</strong> {row.defense.testing}</p> : null}
          {row.defense?.tradeoffs ? <p style={{ fontSize: 14, lineHeight: 1.5 }}><strong>Trade-offs:</strong> {row.defense.tradeoffs}</p> : null}
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
              <p style={{ fontSize: 14, lineHeight: 1.5 }}>{row.defense.summary}</p>
              {row.defense.videoUrl ? <a href={row.defense.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>Ver la defensa</a> : null}
              {row.defense.aiUse ? <p style={{ fontSize: 13, color: "var(--c3-texto-suave)", lineHeight: 1.5 }}><strong>Herramientas de IA:</strong> {row.defense.aiUse}</p> : null}
            </>
          ) : (
            <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>La persona todavía no registró su defensa.</p>
          )}
        </Evidencia>
      </div>

      <RetroalimentacionForm challengeId={challengeId} row={row} onSaved={onFeedbackSaved} />

      <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {row.shortlist ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 14 }}><strong>Motivo en lista corta:</strong> {row.shortlist.reason}</span>
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

        {isTeam ? (
          <p style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>El contacto con personas de un equipo todavía no está disponible: se define por persona en una etapa posterior.</p>
        ) : row.contact ? (
          <ContactoAcciones row={row} busy={busy} onAdvance={onAdvance} />
        ) : row.canRequestContact ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onRequestContact(message.trim());
            }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
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
    </article>
  );
}

function ContactoAcciones({ row, busy, onAdvance }: { row: TalentRow; busy: string | null; onAdvance: FilaProps["onAdvance"] }) {
  const contact = row.contact;
  if (!contact) return null;
  const advanceBusy = busy === `avance:${contact.id}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 14 }}>
        <strong>Solicitud de contacto:</strong> {contact.state.label}.{" "}
        {contact.status === "esperando_consentimiento" ? "La persona decide si acepta. Mientras tanto no se comparte ningún dato de contacto." : null}
      </span>
      {contact.status === "aceptado" ? (
        <div>
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
    <form onSubmit={guardar} noValidate style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--c3-borde)", paddingTop: 16 }}>
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
    <section style={{ background: "var(--c3-superficie-sutil)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600 }}>{titulo}</h3>
      <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{pregunta}</span>
      {children}
    </section>
  );
}
