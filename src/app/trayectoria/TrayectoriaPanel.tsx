"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { initialsOf, MovilShell } from "@/components/MovilShell";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/domain/format";
import { deliveryPresentation, enrollmentState } from "@/lib/domain/presentation";
import type { Profile } from "@/lib/server/profile";
import type { MyEnrollmentView } from "@/lib/server/participation";

interface Trajectory {
  profile: Profile;
  enrollments: MyEnrollmentView[];
}

/** V08 · Perfil y trayectoria. Lo que la persona escribe y lo que C3 registra se muestran por separado. */
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

  const profile = data?.profile;
  const name = profile?.displayName || (session.status === "signed-in" ? (session.user.displayName ?? "") : "");

  return (
    <MovilShell nav="trayectoria">
      {session.status === "signed-out" ? (
        <div className="c3-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="c3-titulo" style={{ fontSize: 22, fontWeight: 700 }}>Entrá para ver tu trayectoria</h1>
          <Link href="/acceso?next=/trayectoria" className="c3-btn c3-btn--primario">Entrar</Link>
        </div>
      ) : null}

      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}
      {signedIn && !data && !loadError ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando tu perfil…</p> : null}

      {profile ? (
        <>
          <section style={{ background: "var(--c3-navy)", margin: "-20px -20px 0", padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 999, background: "var(--c3-conecta)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--c3-font-titulo)", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                {initialsOf(profile.displayName, profile.email)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <h1 className="c3-titulo" style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}>{name || "Tu perfil"}</h1>
                {profile.school ? <span style={{ fontSize: 14, color: "var(--c3-texto-cabecera)" }}>{profile.school}</span> : null}
              </div>
              <Link href="/cuenta" style={{ marginLeft: "auto", color: "var(--c3-texto-cabecera)", fontSize: 14, fontWeight: 500 }}>Editar en Cuenta</Link>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {profile.github ? <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: "var(--c3-conecta-claro)" }}>GitHub</a> : null}
              {profile.linkedin ? <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: "var(--c3-conecta-claro)" }}>LinkedIn</a> : null}
              <span aria-disabled="true" title="Próximamente" style={{ marginLeft: "auto", fontSize: 14, color: "var(--c3-texto-cabecera)", opacity: 0.6 }}>Compartir perfil (próximamente)</span>
            </div>
          </section>

          <section className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }} aria-labelledby="escribio">
            <span id="escribio" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Lo que escribió</span>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: profile.bio ? "var(--c3-texto)" : "var(--c3-texto-suave)" }}>
              {profile.bio || "Todavía no escribiste nada. Editá tu perfil para contar en unas líneas qué te interesa."}
            </p>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-labelledby="trayectoria">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 id="trayectoria" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Trayectoria</h2>
              <span className="c3-pill c3-pill--exito">Registrada por C3</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.4, color: "var(--c3-texto-suave)" }}>
              Todo lo de abajo viene de registros oficiales de C3. No se puede editar.
            </p>

            {data && data.enrollments.length === 0 ? (
              <div className="c3-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no tenés trayectoria registrada. Cuando participes en un reto, aparece aquí.</p>
              </div>
            ) : null}

            {data?.enrollments.map((item) => {
              if (item.status === "cancelled") {
                return (
                  <div key={item.id} style={{ background: "var(--c3-superficie-sutil)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Inscripción sin participación</span>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{item.experienceTitle}: inscripción cancelada. No acredita participación ni resultado.</span>
                  </div>
                );
              }
              const delivered = item.delivery?.state === "entregada" || item.delivery?.state === "fuera_de_plazo";
              return (
                <article key={item.id} className="c3-card" style={{ overflow: "hidden" }}>
                  <div style={{ height: 6, background: item.mode === "team" ? "var(--c3-crea)" : "var(--c3-compite)" }} />
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                      <span className="c3-titulo" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{item.challengeTitle ?? item.experienceTitle}</span>
                      {item.delivery ? <StatePill state={deliveryPresentation(item.delivery.state)} /> : <StatePill state={enrollmentState(item.status)} />}
                    </div>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
                      {item.challengeTitle ? `${item.experienceTitle} · ` : ""}{item.mode === "team" ? (item.team ? `Equipo ${item.team.name}` : "Por equipo") : "Individual"}
                      {item.delivery?.submittedAt ? ` · Enviada ${formatDate(item.delivery.submittedAt)}` : ""}
                    </span>
                    {item.result ? (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        Resultado publicado: {item.result.recognition ?? "sin reconocimiento"}
                        {item.result.average !== null ? ` · promedio ${item.result.average.toFixed(1)}` : ""}
                        {item.result.place ? ` · puesto ${item.result.place} de ${item.result.of}` : ""}
                      </span>
                    ) : null}
                    {!delivered && item.challengeId ? <Link href={`/mi-c3/retos/${item.challengeId}`} style={{ fontSize: 14, fontWeight: 500 }}>Ir a mi reto</Link> : null}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </MovilShell>
  );
}
