"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { StatePill } from "@/components/StatePill";
import { formatDate, formatDateTime } from "@/lib/domain/format";
import type { PresentedState } from "@/lib/domain/presentation";
import {
  assignmentReasonState,
  enrollmentReasonState,
  type AssignmentReason,
  type EnrollmentReason,
  type ParticipationGroup,
} from "@/lib/domain/mi-c3";
import type { MyEnrollmentView } from "@/lib/server/participation";
import type { myAssignments } from "@/lib/server/evaluation";

export type Assignment = Awaited<ReturnType<typeof myAssignments>>[number];

interface CardAction {
  href: string;
  label: string;
}

interface CardContent {
  kicker: string;
  title: string;
  meta: string | null;
  headline: string | null;
  text: string;
  date: string | null;
  primary: CardAction | null;
  secondary: CardAction | null;
}

/** Qué le pasa a la persona con esta inscripción y qué puede hacer: una sola fuente para texto y acciones. */
function enrollmentContent(item: MyEnrollmentView, reason: EnrollmentReason): CardContent {
  const retoHref = `/retos/${item.challengeId}`;
  const miRetoHref = `/mi-c3/retos/${item.challengeId}`;
  const team = item.team;
  const closes = item.submissionClosesAt ? `Cierra el ${formatDateTime(item.submissionClosesAt)}` : null;
  const base = {
    kicker: item.experienceTitle,
    title: item.challengeTitle,
    meta: [item.organizationName, item.mode === "team" ? (team ? `Equipo ${team.name}` : "Por equipo") : "Individual"].join(" · "),
    headline: null,
    date: null as string | null,
    primary: null as CardAction | null,
    secondary: { href: retoHref, label: "Ver reto" } as CardAction | null,
  };

  switch (reason) {
    case "sin_equipo":
      return { ...base, headline: "Armá tu equipo para participar.", text: "Tu inscripción fue aprobada, pero todavía no tenés equipo. Creá uno o unite con un código.", date: closes, primary: { href: `${retoHref}/inscripcion`, label: "Armar equipo" } };
    case "equipo_incompleto":
      return { ...base, headline: "Tu equipo está incompleto.", text: team ? `Equipo ${team.name}: todavía no alcanza el mínimo de integrantes.` : "Tu equipo todavía no alcanza el mínimo de integrantes.", date: closes, primary: { href: `${retoHref}/inscripcion`, label: "Gestionar equipo" } };
    case "entrega_pendiente":
      return { ...base, headline: "Todavía no enviaste tu entrega.", text: "Describí tu solución y agregá al menos un enlace antes del cierre.", date: closes, primary: { href: miRetoHref, label: "Abrir mi reto" } };
    case "entrega_borrador":
      return { ...base, headline: "Tenés un borrador sin enviar.", text: "Tu entrega está guardada, pero todavía no la enviaste.", date: closes, primary: { href: miRetoHref, label: "Abrir mi reto" } };
    case "revision_c3":
      return {
        ...base,
        headline: "Esperando respuesta de C3.",
        text: "C3 está revisando tu inscripción. No tenés nada que hacer hasta que la apruebe o la rechace.",
        date: `Enviada el ${formatDate(item.createdAt)}`,
        primary: { href: `${retoHref}/inscripcion`, label: "Ver inscripción" },
        secondary: null,
      };
    case "entregada":
      return {
        ...base,
        text: `Tu entrega quedó registrada${item.delivery?.submittedAt ? ` el ${formatDate(item.delivery.submittedAt)}` : ""}. Se evalúa cuando cierra el plazo.`,
        primary: { href: miRetoHref, label: "Ver mi entrega" },
        secondary: { href: retoHref, label: "Ver reto" },
      };
    case "entrega_del_equipo":
      return { ...base, text: team ? `Participás con el equipo ${team.name}. La entrega la envía la líder del equipo.` : "La entrega la envía la líder del equipo.", date: closes, primary: { href: miRetoHref, label: "Abrir mi reto" } };
    case "aprobada":
      return { ...base, text: "Tu inscripción está aprobada.", date: closes, primary: { href: miRetoHref, label: "Abrir mi reto" } };
    case "resultado": {
      const result = item.result;
      const detail = result
        ? [
            `Resultado publicado: ${result.recognition ?? "sin reconocimiento"}`,
            result.average !== null ? `promedio ${result.average.toFixed(1)}` : null,
            result.place ? `puesto ${result.place} de ${result.of}` : null,
          ].filter(Boolean).join(" · ")
        : "Resultado publicado.";
      return { ...base, text: detail, primary: { href: miRetoHref, label: "Ver mi entrega" }, secondary: { href: "/trayectoria", label: "Ver en Trayectoria" } };
    }
    case "sin_entrega":
      return { ...base, text: "El plazo cerró sin entrega enviada.", secondary: { href: retoHref, label: "Ver reto" } };
    case "rechazada":
      return { ...base, text: "C3 no aprobó esta inscripción." };
    case "cancelada":
      return { ...base, text: "Inscripción cancelada. No acredita participación ni resultado." };
  }
}

function assignmentContent(item: Assignment, reason: AssignmentReason): CardContent {
  const href = `/mi-c3/evaluar/${item.challengeId}`;
  const pending = item.solutions - item.finalized;
  const base = { kicker: "Como jurado", title: item.title, meta: null, headline: null, date: null };
  switch (reason) {
    case "evaluar":
      return {
        ...base,
        headline: "Hay soluciones por evaluar.",
        text: `${pending} de ${item.solutions} ${item.solutions === 1 ? "solución" : "soluciones"} sin finalizar. Evaluás sin ver quién entregó.`,
        primary: { href, label: "Evaluar" },
        secondary: null,
      };
    case "esperando_cierre":
      return { ...base, text: "Las evaluaciones se habilitan cuando cierra el plazo de entregas.", primary: null, secondary: { href, label: "Ver detalle" } };
    case "completa":
      return { ...base, text: `Finalizaste las ${item.solutions} ${item.solutions === 1 ? "evaluación" : "evaluaciones"} de este reto.`, primary: null, secondary: { href, label: "Ver evaluaciones" } };
    case "sin_soluciones":
      return { ...base, text: "Cerró el plazo y no hubo soluciones entregadas para evaluar.", primary: null, secondary: { href, label: "Ver detalle" } };
  }
}

function Actions({ content, group, extra }: { content: CardContent; group: ParticipationGroup; extra?: ReactNode }) {
  if (!content.primary && !content.secondary && !extra) return null;
  return (
    <div className="c3-mi-c3__acciones">
      {content.primary ? <Link href={content.primary.href} className="c3-btn c3-btn--primario">{content.primary.label}</Link> : null}
      {content.secondary ? (
        <Link href={content.secondary.href} className={content.primary || group === "finalizada" ? "c3-mi-c3__accion-secundaria" : "c3-btn c3-btn--contorno"}>{content.secondary.label}</Link>
      ) : null}
      {extra}
    </div>
  );
}

function CardShell({ group, content, state, extra, children }: { group: ParticipationGroup; content: CardContent; state: PresentedState; extra?: ReactNode; children?: ReactNode }) {
  const withActions = Boolean(content.primary || content.secondary || extra);
  return (
    <article className={`c3-card c3-mi-c3__tarjeta c3-mi-c3__tarjeta--${group}${withActions ? " c3-mi-c3__tarjeta--con-acciones" : ""}`}>
      <div className="c3-mi-c3__tarjeta-cuerpo">
        <div className="c3-mi-c3__tarjeta-cabecera">
          <span className="c3-mi-c3__kicker">{content.kicker}</span>
          <StatePill state={state} />
        </div>
        <h3 className="c3-titulo c3-mi-c3__tarjeta-titulo">{content.title}</h3>
        {content.meta ? <span className="c3-mi-c3__meta">{content.meta}</span> : null}
        <p className="c3-mi-c3__estado">
          {content.headline ? <strong>{content.headline} </strong> : null}
          {content.text}
        </p>
        {content.date ? <span className="c3-mi-c3__fecha">{content.date}</span> : null}
        {children}
      </div>
      <Actions content={content} group={group} extra={extra} />
    </article>
  );
}

/** Tarjeta de una inscripción. Cancelar es una acción secundaria y pide confirmación antes de enviarse. */
export function EnrollmentCard({
  item,
  group,
  reason,
  busy,
  onCancel,
}: {
  item: MyEnrollmentView;
  group: ParticipationGroup;
  reason: EnrollmentReason;
  busy: boolean;
  onCancel: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const content = enrollmentContent(item, reason);
  const cancellable = reason === "revision_c3";

  return (
    <CardShell
      group={group}
      content={content}
      state={enrollmentReasonState(reason, item)}
      extra={cancellable && !confirming ? (
        <button type="button" className="c3-mi-c3__accion-secundaria c3-mi-c3__accion-cancelar" disabled={busy} onClick={() => setConfirming(true)}>
          Cancelar inscripción
        </button>
      ) : null}
    >
      {cancellable && confirming ? (
        <div className="c3-mi-c3__confirmar" role="group" aria-label={`Confirmar la cancelación de ${item.challengeTitle}`}>
          <p>¿Cancelar tu inscripción? No acredita participación ni resultado.</p>
          <div className="c3-mi-c3__confirmar-acciones">
            <button type="button" className="c3-btn c3-btn--contorno c3-mi-c3__boton-compacto" disabled={busy} onClick={() => onCancel(item.id)}>
              {busy ? "Cancelando…" : "Sí, cancelar inscripción"}
            </button>
            <button type="button" className="c3-mi-c3__accion-secundaria" disabled={busy} onClick={() => setConfirming(false)}>Mantenerla</button>
          </div>
        </div>
      ) : null}
    </CardShell>
  );
}

export function AssignmentCard({ item, group, reason }: { item: Assignment; group: ParticipationGroup; reason: AssignmentReason }) {
  return <CardShell group={group} content={assignmentContent(item, reason)} state={assignmentReasonState(reason)} />;
}
