"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Migas } from "@/components/Migas";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { DELIVERY_MAX_LINKS } from "@/lib/domain/delivery";
import { formatDate, formatDateTime } from "@/lib/domain/format";
import { deliveryPresentation, enrollmentState, type PresentedState } from "@/lib/domain/presentation";
import type { DeliveryView } from "@/lib/server/participation";

type Banner = { tone: "error" | "exito" | "advertencia" | "info"; title: string; text: string };

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/** V07 · Mi challenge y entrega. Borrador y envío con persistencia; la edición se cierra al cierre de entregas. */
export function EntregaPanel({ challengeId }: { challengeId: string }) {
  return (
    <AppShell active="mi-c3" signedOut={{ title: "Entrá para ver tu challenge", text: "Usás tu cuenta de C3. Al entrar volvés a tu entrega." }}>
      <EntregaContenido challengeId={challengeId} />
    </AppShell>
  );
}

function EntregaContenido({ challengeId }: { challengeId: string }) {
  const { session } = useSession();
  const signedIn = session.status === "signed-in";
  const [delivery, setDelivery] = useState<DeliveryView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"guardar" | "enviar" | null>(null);

  const applyDelivery = useCallback((data: DeliveryView) => {
    setDelivery(data);
    setText(data.submission?.text ?? "");
    setLinks(data.submission?.links.length ? data.submission.links : [""]);
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      applyDelivery((await apiRequest<{ delivery: DeliveryView }>(`/api/retos/${challengeId}/entrega`)).delivery);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu challenge. Intentá de nuevo.");
    }
  }, [applyDelivery, challengeId]);

  // Carga inicial: las actualizaciones de estado ocurren en la respuesta, no dentro del efecto.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ delivery: DeliveryView }>(`/api/retos/${challengeId}/entrega`).then(
      (data) => {
        if (!active) return;
        applyDelivery(data.delivery);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu challenge. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn, challengeId, applyDelivery]);

  async function save(submit: boolean) {
    setIssues([]);
    setFormError(null);
    setNotice(null);
    setBusy(submit ? "enviar" : "guardar");
    try {
      const data = await apiRequest<{ delivery: DeliveryView }>(`/api/retos/${challengeId}/entrega`, {
        method: "PUT",
        body: { text, links: links.map((link) => link.trim()).filter(Boolean), submit },
      });
      applyDelivery(data.delivery);
      setNotice(submit ? "Entrega enviada. Podés editarla hasta el cierre." : "Borrador guardado.");
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos guardar tu entrega. Intentá de nuevo.");
      }
    } finally {
      setBusy(null);
    }
  }

  if (loadError) {
    return (
      <div className="c3-tarea">
        <Migas items={[{ label: "Mi C3", href: "/mi-c3" }, { label: "Mi challenge" }]} />
        <div className="c3-alerta c3-alerta--error" role="alert">
          <strong>No pudimos cargar tu challenge</strong>
          <span style={{ fontSize: 14 }}>{loadError}</span>
          <button type="button" className="c3-btn c3-btn--contorno" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => void load()}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="c3-tarea">
        <Migas items={[{ label: "Mi C3", href: "/mi-c3" }, { label: "Mi challenge" }]} />
        <p role="status" style={{ color: "var(--c3-texto-suave)" }}>Cargando tu challenge…</p>
      </div>
    );
  }

  const { challenge, eligible, canEdit, state, enrollmentStatus, submission } = delivery;
  const banner = bannerFor(delivery);
  const steps = [
    { label: "Inscrito", done: enrollmentStatus !== null, current: false },
    { label: "Habilitado", done: eligible, current: false },
    { label: "Entrega", done: state === "entregada", current: eligible && state !== "entregada" && state !== "fuera_de_plazo" },
    { label: "Evaluación", done: false, current: false },
    { label: "Resultado", done: false, current: false },
  ];

  return (
    <div className="c3-tarea">
      <Migas items={[{ label: "Mi C3", href: "/mi-c3" }, { label: challenge.title }]} />

      <section className="c3-tarea__encabezado">
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>{delivery.experience.title}</span>
        <h1 className="c3-titulo">{challenge.title}</h1>
        <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>{challenge.organizationName}</span>
        {delivery.team ? (
          <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
            Equipo {delivery.team.name} · {delivery.team.role === "lider" ? "Líder" : "Integrante"}
          </span>
        ) : null}
      </section>

      <div className="c3-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 8 }} aria-label="Progreso del challenge">
        {steps.map((step, index) => (
          <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              aria-hidden="true"
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background: step.done ? "var(--c3-exito)" : step.current ? "var(--c3-accion)" : "var(--c3-superficie-sutil)",
                color: step.done || step.current ? "#ffffff" : "var(--c3-texto-suave)",
              }}
            >
              {index + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: step.current ? 600 : 500, textAlign: "center", color: step.done || step.current ? "var(--c3-texto)" : "var(--c3-texto-suave)" }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="c3-tarea__grilla">
        <div className="c3-tarea__columna">
          {banner ? (
            <div className={`c3-alerta c3-alerta--${banner.tone === "info" ? "info" : banner.tone}`}>
              <strong>{banner.title}</strong>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{banner.text}</span>
            </div>
          ) : null}

          {enrollmentStatus !== null && !eligible ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Tu inscripción:</span>
              <StatePill state={enrollmentState(enrollmentStatus)} />
            </div>
          ) : null}

          {eligible ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save(false);
              }}
              noValidate
              className="c3-card"
              style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}
              aria-labelledby="titulo-entrega"
            >
              <h2 id="titulo-entrega" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Tu entrega</h2>

              {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
              {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="entrega-texto" className="c3-etiqueta-campo">Descripción de la solución</label>
                <textarea
                  id="entrega-texto"
                  className={`c3-campo${issueFor(issues, "text") ? " c3-campo--error" : ""}`}
                  rows={5}
                  value={text}
                  disabled={!canEdit}
                  onChange={(event) => setText(event.target.value)}
                  aria-invalid={Boolean(issueFor(issues, "text"))}
                />
                {issueFor(issues, "text") ? <span className="c3-error-campo">{issueFor(issues, "text")}</span> : <span className="c3-ayuda">Explicá el enfoque y cómo se ejecuta. Para enviar, al menos 20 caracteres.</span>}
              </div>

              <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <legend className="c3-etiqueta-campo" style={{ marginBottom: 6 }}>Enlaces</legend>
                {links.map((link, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      aria-label={`Enlace ${index + 1}`}
                      type="url"
                      className="c3-campo"
                      placeholder="https://"
                      value={link}
                      disabled={!canEdit}
                      onChange={(event) => setLinks(links.map((item, position) => (position === index ? event.target.value : item)))}
                    />
                    {canEdit && links.length > 1 ? (
                      <button
                        type="button"
                        className="c3-btn c3-btn--contorno"
                        style={{ minHeight: 44, padding: "0 12px", flexShrink: 0 }}
                        onClick={() => setLinks(links.filter((_, position) => position !== index))}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                ))}
                {issueFor(issues, "links") ? <span className="c3-error-campo">{issueFor(issues, "links")}</span> : <span className="c3-ayuda">Repositorio, demo o video. Solo https. Hasta {DELIVERY_MAX_LINKS}.</span>}
                {canEdit && links.length < DELIVERY_MAX_LINKS ? (
                  <button type="button" className="c3-btn c3-btn--contorno" style={{ alignSelf: "flex-start", minHeight: 40, padding: "0 16px", fontSize: 12 }} onClick={() => setLinks([...links, ""])}>
                    Agregar enlace
                  </button>
                ) : null}
              </fieldset>

              {canEdit ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    type="button"
                    className="c3-btn c3-btn--primario"
                    disabled={busy !== null}
                    onClick={() => void save(true)}
                  >
                    {busy === "enviar" ? "Enviando…" : "Enviar entrega"}
                  </button>
                  <button type="submit" className="c3-btn c3-btn--contorno" disabled={busy !== null}>
                    {busy === "guardar" ? "Guardando…" : "Guardar borrador"}
                  </button>
                  <span className="c3-ayuda">
                    Podés editarla hasta el {formatDateTime(challenge.submissionClosesAt) ?? "cierre"}.
                    {submission?.updatedAt ? ` Último guardado: ${formatDateTime(submission.updatedAt)}.` : ""}
                  </span>
                </div>
              ) : (
                <span className="c3-ayuda">
                  {state === "entregada"
                    ? "La entrega quedó registrada y no se puede cambiar."
                    : delivery.team?.role === "integrante"
                      ? "Solo la líder del equipo puede guardar o enviar la entrega."
                      : "La edición ya cerró."}
                  {submission?.submittedAt ? ` Enviada el ${formatDate(submission.submittedAt)}.` : ""}
                </span>
              )}
            </form>
          ) : null}

          {!eligible && enrollmentStatus === null ? (
            <Link href={`/retos/${challenge.id}/inscripcion`} className="c3-btn c3-btn--primario">Inscribirme al challenge</Link>
          ) : null}
          <StateSummary state={deliveryPresentation(state)} />
        </div>
        <aside className="c3-tarea__columna c3-tarea__lateral">
          <section className="c3-card" aria-label="Brief y criterios" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Brief y criterios</span>
            {challenge.problem.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph.slice(0, 40)} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{paragraph.trim()}</p>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Qué tenés que entregar</span>
              {challenge.deliverables.map((item) => (
                <span key={item} style={{ fontSize: 14, lineHeight: 1.5 }}>· {item}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Rúbrica</span>
              {challenge.rubric.map((criterion) => (
                <span key={criterion.id} style={{ fontSize: 14, lineHeight: 1.5 }}>· {criterion.label}: 0 – {criterion.maxScore}</span>
              ))}
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}

function StateSummary({ state }: { state: PresentedState }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--c3-texto-suave)" }}>
      <span>Estado de tu entrega:</span>
      <StatePill state={state} />
    </div>
  );
}

function bannerFor(delivery: DeliveryView): Banner | null {
  const { enrollmentStatus, eligible, state, challenge } = delivery;
  if (enrollmentStatus === null) return { tone: "info", title: "No estás inscrito en este challenge", text: "Inscribite para habilitar tu entrega. C3 revisa la inscripción." };
  if (enrollmentStatus === "pending") return { tone: "advertencia", title: "Inscripción en revisión", text: "Cuando C3 la apruebe, vas a poder entregar. No tenés nada que hacer hasta entonces." };
  if (enrollmentStatus === "rejected") return { tone: "error", title: "C3 no aprobó tu inscripción", text: "Este challenge no quedó habilitado para tu cuenta." };
  if (enrollmentStatus === "cancelled") return { tone: "info", title: "Cancelaste esta inscripción", text: "No acredita participación ni resultado." };
  if (delivery.mode === "team" && !delivery.team) return { tone: "info", title: "Todavía no tenés equipo", text: "Creá tu equipo o unite con un código en la inscripción para habilitar la entrega." };
  if (delivery.mode === "team" && delivery.team?.status === "incompleto") return { tone: "advertencia", title: "Equipo incompleto", text: "Tu equipo todavía no alcanzó el mínimo de integrantes. La entrega se habilita cuando lo alcance." };
  if (!eligible) return null;
  const closes = formatDateTime(challenge.submissionClosesAt);
  if (state === "entregada") return { tone: "exito", title: "Entrega enviada", text: "Podés editarla hasta el cierre de entregas." };
  if (state === "fuera_de_plazo") return { tone: "error", title: "El plazo de entregas cerró", text: "La entrega queda como está para la evaluación." };
  if (state === "borrador") return { tone: "advertencia", title: "Tu entrega está en borrador", text: `Todavía no la enviaste. Cierra el ${closes}.` };
  return { tone: "advertencia", title: "Todavía no enviaste tu solución", text: `Cierra el ${closes}.` };
}
