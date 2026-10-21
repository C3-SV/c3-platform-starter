"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MovilShell } from "@/components/MovilShell";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { GROUP_COPY, GROUP_ORDER, organizeParticipation, overviewMessage, type ParticipationEntry, type ParticipationGroup } from "@/lib/domain/mi-c3";
import type { MyEnrollmentView } from "@/lib/server/participation";
import { AssignmentCard, EnrollmentCard, type Assignment } from "./MiC3Cards";
import { MiC3Lateral } from "./MiC3Lateral";

type Entry = ParticipationEntry<MyEnrollmentView, Assignment>;

/**
 * V05 · Mi C3 (inicio). Separa lo que le toca a la persona («Requiere tu atención»), lo que espera a C3 u otro
 * proceso («En espera»), lo activo («En curso») y lo terminado («Finalizadas»). Cada tarjeta lleva a una
 * acción real o muestra su estado. Una sola composición responsiva: el CSS la presenta como app móvil o como
 * panel de dos columnas (ver `.c3-movil--panel` y `.c3-mi-c3__*` en globals.css).
 */
export function MiC3Panel() {
  const { session } = useSession();
  const [enrollments, setEnrollments] = useState<MyEnrollmentView[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [now, setNow] = useState(() => new Date());
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
      setNow(new Date());
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
        setNow(new Date());
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

  // Retos que me asignaron como jurado. Si la consulta falla, la sección simplemente no aparece.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ assignments: Assignment[] }>("/api/evaluaciones").then(
      (data) => {
        if (active) setAssignments(data.assignments);
      },
      () => undefined,
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

  if (session.status === "loading") return <MovilShell layout="panel"><div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo"><p>Cargando…</p></div></MovilShell>;
  if (session.status === "unavailable") return <MovilShell layout="panel"><div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo"><p role="alert">{session.message}</p></div></MovilShell>;
  if (session.status === "signed-out") {
    return (
      <MovilShell layout="panel" nav={null}>
        <div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo">
          <div className="c3-card c3-mi-c3__acceso-requerido">
            <h1 className="c3-titulo">Entrá para ver tu espacio</h1>
            <p>Acá vas a ver tus inscripciones, tus entregas y lo que toca ahora.</p>
            <Link href="/acceso?next=/mi-c3" className="c3-btn c3-btn--primario">Entrar</Link>
          </div>
        </div>
      </MovilShell>
    );
  }

  const user = session.user;
  const firstName = user.displayName?.split(" ")[0] ?? "";
  const overview = enrollments ? organizeParticipation(enrollments, assignments, now) : null;
  const empty = overview !== null && overview.total === 0;
  const nextTitle = overview?.nextDeadline?.item.challengeTitle;
  const nextDate = formatDateTime(overview?.nextDeadline?.item.submissionClosesAt);

  return (
    <MovilShell layout="panel">
      <section className="c3-mi-c3__resumen" aria-labelledby="mi-c3-titulo">
        <div className="c3-mi-c3__contenedor c3-mi-c3__resumen-interior">
          <div className="c3-mi-c3__resumen-texto">
            <h1 id="mi-c3-titulo" className="c3-titulo">{firstName ? `Hola, ${firstName}` : "Hola"}</h1>
            <p>{overview ? overviewMessage(overview) : "Cargando tu espacio…"}</p>
            {nextTitle && nextDate ? <p className="c3-mi-c3__proximo">Próximo cierre: <strong>{nextTitle}</strong>, el {nextDate}.</p> : null}
          </div>
          {overview && overview.total > 0 ? (
            <ul className="c3-mi-c3__conteo" aria-label="Resumen de tu participación">
              {GROUP_ORDER.map((group) => (
                <li key={group} className={`c3-mi-c3__conteo-item${group === "atencion" && overview.counts[group] > 0 ? " c3-mi-c3__conteo-item--alerta" : ""}`}>
                  <span className="c3-mi-c3__conteo-valor">{overview.counts[group]}</span>
                  <span className="c3-mi-c3__conteo-etiqueta">{GROUP_COPY[group].short}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo">
        {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
        {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}

        {loadError ? (
          <div className="c3-alerta c3-alerta--error" role="alert">
            <strong>No pudimos cargar tu espacio</strong>
            <span style={{ fontSize: 14 }}>{loadError}</span>
            <button type="button" className="c3-btn c3-btn--contorno" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => void load()}>Reintentar</button>
          </div>
        ) : null}

        {enrollments === null && !loadError ? <p className="c3-mi-c3__cargando">Cargando tus inscripciones…</p> : null}

        {overview ? (
          <div className={`c3-mi-c3__grilla${empty ? " c3-mi-c3__grilla--simple" : ""}`}>
            <div className="c3-mi-c3__principal">
              {empty ? (
                <section className="c3-card c3-mi-c3__vacio" aria-labelledby="mi-c3-vacio">
                  <h2 id="mi-c3-vacio" className="c3-titulo">Elegí tu primer reto</h2>
                  <p>Explorá los retos abiertos y sumate a uno. Cuando te inscribas, acá vas a ver qué te toca hacer y qué espera la respuesta de C3.</p>
                  <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar retos</Link>
                </section>
              ) : null}
              {GROUP_ORDER.map((group) => (
                <Seccion key={group} group={group} entries={overview.groups[group]} busyId={busyId} onCancel={(id) => void cancel(id)} />
              ))}
            </div>
            <MiC3Lateral user={user} />
          </div>
        ) : null}
      </div>
    </MovilShell>
  );
}

function Seccion({ group, entries, busyId, onCancel }: { group: ParticipationGroup; entries: Entry[]; busyId: string | null; onCancel: (id: string) => void }) {
  if (entries.length === 0) return null;
  const copy = GROUP_COPY[group];
  return (
    <section className={`c3-mi-c3__seccion c3-mi-c3__seccion--${group}`} aria-labelledby={`mi-c3-${group}`}>
      <header className="c3-mi-c3__seccion-cabecera">
        <h2 id={`mi-c3-${group}`} className="c3-titulo">{copy.title}</h2>
        <span className="c3-mi-c3__seccion-conteo">{entries.length}</span>
        <p>{copy.description}</p>
      </header>
      <div className="c3-mi-c3__lista">
        {entries.map((entry) =>
          entry.kind === "inscripcion" ? (
            <EnrollmentCard key={entry.item.id} item={entry.item} group={group} reason={entry.reason} busy={busyId === entry.item.id} onCancel={onCancel} />
          ) : (
            <AssignmentCard key={entry.item.challengeId} item={entry.item} group={group} reason={entry.reason} />
          ),
        )}
      </div>
    </section>
  );
}
