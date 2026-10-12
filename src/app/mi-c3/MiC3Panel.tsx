"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MovilShell } from "@/components/MovilShell";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDate, formatDateTime } from "@/lib/domain/format";
import { deliveryPresentation, enrollmentState } from "@/lib/domain/presentation";
import type { MyEnrollmentView } from "@/lib/server/participation";

/** V05 · Mi C3 (inicio). Ordena lo que toca ahora; cada tarjeta lleva a una acción real o muestra su estado. */
export function MiC3Panel() {
  const { session } = useSession();
  const [enrollments, setEnrollments] = useState<MyEnrollmentView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const signedIn = session.status === "signed-in";

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiRequest<{ enrollments: MyEnrollmentView[] }>("/api/mi-c3");
      setEnrollments(data.enrollments);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu espacio. Intentá de nuevo.");
    }
  }, []);

  // Carga inicial cuando hay sesión: el estado llega en la respuesta, no dentro del efecto.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ enrollments: MyEnrollmentView[] }>("/api/mi-c3").then(
      (data) => {
        if (!active) return;
        setEnrollments(data.enrollments);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu espacio. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn]);

  async function cancel(id: string) {
    setActionError(null);
    setNotice(null);
    setBusyId(id);
    try {
      await apiRequest(`/api/inscripciones/${id}`, { method: "PATCH", body: { status: "cancelled" } });
      setNotice("Inscripción cancelada.");
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "No pudimos cancelar la inscripción. Intentá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  if (session.status === "loading") return <MovilShell><p>Cargando…</p></MovilShell>;
  if (session.status === "unavailable") return <MovilShell><p role="alert">{session.message}</p></MovilShell>;
  if (session.status === "signed-out") {
    return (
      <MovilShell nav={null}>
        <div className="c3-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="c3-titulo" style={{ fontSize: 22, fontWeight: 700 }}>Entrá para ver tu espacio</h1>
          <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Acá vas a ver tus inscripciones, tus entregas y lo que toca ahora.</p>
          <Link href="/acceso?next=/mi-c3" className="c3-btn c3-btn--primario">Entrar</Link>
        </div>
      </MovilShell>
    );
  }

  const user = session.user;
  const firstName = user.displayName?.split(" ")[0] ?? "";
  const pending = enrollments?.filter((item) => item.status === "pending") ?? [];
  const actionable = enrollments?.filter((item) => item.status === "approved" && (item.delivery?.state === "sin_entrega" || item.delivery?.state === "borrador")) ?? [];
  const delivered = enrollments?.filter((item) => item.status === "approved" && (item.delivery?.state === "entregada" || item.delivery?.state === "fuera_de_plazo")) ?? [];
  const closed = enrollments?.filter((item) => item.status === "rejected" || item.status === "cancelled") ?? [];

  return (
    <MovilShell>
      <section style={{ background: "var(--c3-navy)", margin: "-20px -20px 0", padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 className="c3-titulo" style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 700, color: "#ffffff" }}>
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </h1>
        <span style={{ fontSize: 14, color: "var(--c3-texto-cabecera)" }}>
          {enrollments === null
            ? "Cargando tu espacio…"
            : actionable.length > 0
              ? `Tenés ${actionable.length} ${actionable.length === 1 ? "cosa" : "cosas"} que hacer ahora.`
              : "No tenés nada pendiente ahora."}
        </span>
      </section>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}

      {loadError ? (
        <div className="c3-alerta c3-alerta--error" role="alert">
          <strong>No pudimos cargar tu espacio</strong>
          <span style={{ fontSize: 14 }}>{loadError}</span>
          <button type="button" className="c3-btn c3-btn--contorno" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => void load()}>Reintentar</button>
        </div>
      ) : null}

      {enrollments === null && !loadError ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando tus inscripciones…</p> : null}

      {enrollments && enrollments.length === 0 ? (
        <div className="c3-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Todavía no tenés inscripciones</span>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>Explorá los retos abiertos y sumate a uno.</p>
          <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar retos</Link>
        </div>
      ) : null}

      {actionable.length > 0 ? (
        <Seccion titulo="Te toca ahora" color="var(--c3-advertencia)">
          {actionable.map((item) => (
            <div key={item.id} className="c3-card" style={{ borderColor: "var(--c3-advertencia)", overflow: "hidden" }}>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <span className="c3-titulo" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{item.challengeTitle}</span>
                  {item.delivery ? <StatePill state={deliveryPresentation(item.delivery.state)} /> : null}
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
                  {item.delivery?.state === "borrador" ? "Entrega sin enviar." : "Todavía no enviaste tu solución."}
                  {item.submissionClosesAt ? ` Cierra el ${formatDateTime(item.submissionClosesAt)}.` : ""}
                </span>
                <Link href={`/mi-c3/retos/${item.challengeId}`} className="c3-btn c3-btn--primario" style={{ width: "100%" }}>Abrir mi reto</Link>
              </div>
            </div>
          ))}
        </Seccion>
      ) : null}

      {pending.length > 0 ? (
        <Seccion titulo="En espera" color="var(--c3-texto-suave)">
          {pending.map((item) => (
            <div key={item.id} className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <span className="c3-titulo" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{item.challengeTitle}</span>
                <StatePill state={enrollmentState(item.status)} />
              </div>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
                Inscripción en revisión por C3. No tenés nada que hacer hasta que se apruebe.
              </span>
              <button
                type="button"
                className="c3-btn c3-btn--contorno"
                disabled={busyId === item.id}
                onClick={() => void cancel(item.id)}
                style={{ alignSelf: "flex-start", minHeight: 40, padding: "0 16px", fontSize: 12 }}
              >
                {busyId === item.id ? "Cancelando…" : "Cancelar inscripción"}
              </button>
            </div>
          ))}
        </Seccion>
      ) : null}

      {delivered.length > 0 ? (
        <Seccion titulo="Entregado" color="var(--c3-texto-suave)">
          {delivered.map((item) => (
            <div key={item.id} className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <span className="c3-titulo" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{item.challengeTitle}</span>
                {item.delivery ? <StatePill state={deliveryPresentation(item.delivery.state)} /> : null}
              </div>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
                {item.delivery?.state === "entregada"
                  ? `Tu entrega quedó registrada${item.delivery.submittedAt ? ` el ${formatDate(item.delivery.submittedAt)}` : ""}. Se evalúa cuando cierra el plazo.`
                  : "El plazo cerró sin entrega enviada."}
              </span>
              <Link href={`/mi-c3/retos/${item.challengeId}`} style={{ fontSize: 14, fontWeight: 500 }}>Ver mi entrega</Link>
            </div>
          ))}
        </Seccion>
      ) : null}

      {closed.length > 0 ? (
        <Seccion titulo="Cerradas" color="var(--c3-texto-suave)">
          {closed.map((item) => (
            <div key={item.id} className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, opacity: 0.85 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <span className="c3-titulo" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{item.challengeTitle}</span>
                <StatePill state={enrollmentState(item.status)} />
              </div>
              <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
                {item.status === "rejected"
                  ? "C3 no aprobó esta inscripción."
                  : "Inscripción cancelada. No acredita participación ni resultado."}
              </span>
            </div>
          ))}
        </Seccion>
      ) : null}
    </MovilShell>
  );
}

function Seccion({ titulo, color, children }: { titulo: string; color: string; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="c3-etiqueta" style={{ color }}>{titulo}</span>
      {children}
    </section>
  );
}
