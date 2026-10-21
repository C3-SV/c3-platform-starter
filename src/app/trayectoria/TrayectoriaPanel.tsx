"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { initialsOf, MovilShell } from "@/components/MovilShell";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { countWithResult, groupTrajectory, TRAJECTORY_COPY, TRAJECTORY_ORDER } from "@/lib/domain/trayectoria";
import type { Profile } from "@/lib/server/profile";
import type { MyEnrollmentView } from "@/lib/server/participation";
import { TrajectorySectionBlock } from "./TrayectoriaCards";

interface Trajectory {
  profile: Profile;
  enrollments: MyEnrollmentView[];
}

/**
 * V08 · Perfil y trayectoria. Lo que la persona escribe y lo que C3 registra se muestran por separado.
 * Usa el marco adaptable de Mi C3: en móvil y tablet, una columna con la barra inferior; desde 1024 px, cabecera
 * superior y dos columnas (el registro de C3 a la izquierda y lo que escribió la persona a la derecha).
 */
export function TrayectoriaPanel() {
  const { session } = useSession();
  const signedIn = session.status === "signed-in";
  const [data, setData] = useState<Trajectory | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Carga inicial: la respuesta actualiza el estado; no se escribe dentro del efecto.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<Trajectory>("/api/trayectoria").then(
      (response) => {
        if (!active) return;
        setData(response);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu perfil. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn]);

  if (session.status === "loading") return <MovilShell layout="panel" nav="trayectoria"><div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo"><p>Cargando…</p></div></MovilShell>;
  if (session.status === "unavailable") return <MovilShell layout="panel" nav="trayectoria"><div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo"><p role="alert">{session.message}</p></div></MovilShell>;
  if (session.status === "signed-out") {
    return (
      <MovilShell layout="panel" nav={null}>
        <div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo">
          <div className="c3-card c3-mi-c3__acceso-requerido">
            <h1 className="c3-titulo">Entrá para ver tu trayectoria</h1>
            <p>Acá vas a ver tu perfil y lo que C3 registró de tu participación.</p>
            <Link href="/acceso?next=/trayectoria" className="c3-btn c3-btn--primario">Entrar</Link>
          </div>
        </div>
      </MovilShell>
    );
  }

  const profile = data?.profile;
  const name = profile?.displayName || session.user.displayName || "";
  const groups = data ? groupTrajectory(data.enrollments) : null;
  const total = data?.enrollments.length ?? 0;
  const counts = groups && data
    ? [
        { key: "participaciones", value: groups.participaciones.length, label: TRAJECTORY_COPY.participaciones.short },
        { key: "resultado", value: countWithResult(data.enrollments), label: "Con resultado" },
        { key: "en_revision", value: groups.en_revision.length, label: TRAJECTORY_COPY.en_revision.short },
        { key: "sin_participacion", value: groups.sin_participacion.length, label: TRAJECTORY_COPY.sin_participacion.short },
      ]
    : [];

  return (
    <MovilShell layout="panel" nav="trayectoria">
      <section className="c3-mi-c3__resumen c3-tray__hero" aria-label="Tu perfil">
        <div className="c3-mi-c3__contenedor c3-tray__hero-interior">
          <div className="c3-tray__identidad">
            <span aria-hidden="true" className="c3-tray__avatar">{initialsOf(profile?.displayName ?? session.user.displayName, profile?.email ?? session.user.email)}</span>
            <div className="c3-tray__datos">
              <h1 className="c3-titulo">{name || "Tu perfil"}</h1>
              {profile?.school ? <p className="c3-tray__centro">{profile.school}</p> : null}
              {profile ? (
                <div className="c3-tray__acciones">
                  {profile.github ? <a href={profile.github} target="_blank" rel="noopener noreferrer" className="c3-tray__chip">GitHub</a> : null}
                  {profile.linkedin ? <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="c3-tray__chip">LinkedIn</a> : null}
                  <Link href="/cuenta" className="c3-tray__chip c3-tray__chip--editar">Editar en Cuenta</Link>
                </div>
              ) : null}
            </div>
          </div>
          {total > 0 ? (
            <ul className="c3-mi-c3__conteo c3-tray__conteo" aria-label="Resumen de tu trayectoria">
              {counts.map((count) => (
                <li key={count.key} className="c3-mi-c3__conteo-item">
                  <span className="c3-mi-c3__conteo-valor">{count.value}</span>
                  <span className="c3-mi-c3__conteo-etiqueta">{count.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="c3-mi-c3__contenedor c3-mi-c3__cuerpo">
        {loadError ? (
          <div className="c3-alerta c3-alerta--error" role="alert">
            <strong>No pudimos cargar tu perfil</strong>
            <span style={{ fontSize: 14 }}>{loadError}</span>
          </div>
        ) : null}
        {!data && !loadError ? <p className="c3-mi-c3__cargando">Cargando tu perfil…</p> : null}

        {profile && groups ? (
          <div className="c3-tray__grilla">
            <aside className="c3-tray__escribio" aria-labelledby="escribio">
              <section className="c3-card c3-mi-c3__panel">
                <h2 id="escribio" className="c3-titulo c3-mi-c3__panel-titulo">Lo que escribió</h2>
                <p className={`c3-tray__bio${profile.bio ? "" : " c3-tray__bio--vacia"}`}>
                  {profile.bio || "Todavía no escribiste nada. Editá tu perfil para contar en unas líneas qué te interesa."}
                </p>
                <p className="c3-tray__aviso">Lo escribís vos y C3 no lo verifica.</p>
                <span aria-disabled="true" className="c3-tray__proximamente">Compartir perfil: próximamente</span>
              </section>
            </aside>

            <section className="c3-tray__registro" aria-labelledby="trayectoria">
              <header className="c3-tray__registro-cabecera">
                <h2 id="trayectoria" className="c3-titulo">Trayectoria</h2>
                <span className="c3-pill c3-pill--exito">Registrada por C3</span>
                <p>Todo lo de abajo viene de registros oficiales de C3. No se puede editar.</p>
              </header>

              {total === 0 ? (
                <div className="c3-card c3-mi-c3__vacio">
                  <p>Todavía no tenés trayectoria registrada. Cuando participes en un reto, aparece aquí.</p>
                  <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar retos</Link>
                </div>
              ) : null}

              {TRAJECTORY_ORDER.map((section) => (
                <TrajectorySectionBlock key={section} section={section} items={groups[section]} />
              ))}
            </section>
          </div>
        ) : null}
      </div>
    </MovilShell>
  );
}
