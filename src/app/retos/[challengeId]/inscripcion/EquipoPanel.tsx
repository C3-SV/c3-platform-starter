"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { initialsOf } from "@/lib/domain/format";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { teamPresentation } from "@/lib/domain/presentation";
import { TEAM_NAME_MAX, teamSlotsLabel } from "@/lib/domain/teams";
import type { EnrollmentStatus } from "@/lib/domain/types";
import type { MyTeamState, TeamView } from "@/lib/server/teams";

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/** Equipo de la inscripción por equipo: crear, unirse con código, ver integrantes y cambiar el equipo hasta el cierre. */
export function EquipoPanel({ challengeId, enrollmentStatus }: { challengeId: string; enrollmentStatus: EnrollmentStatus }) {
  const { session } = useSession();
  const myUid = session.status === "signed-in" ? session.user.uid : null;
  const [state, setState] = useState<MyTeamState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiRequest<{ state: MyTeamState }>(`/api/retos/${challengeId}/equipo`);
      setState(data.state);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu equipo. Intentá de nuevo.");
    }
  }

  // Carga inicial: la respuesta actualiza el estado; no se escribe dentro del efecto.
  useEffect(() => {
    if (enrollmentStatus !== "approved") return;
    let active = true;
    apiRequest<{ state: MyTeamState }>(`/api/retos/${challengeId}/equipo`).then(
      (data) => {
        if (!active) return;
        setState(data.state);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu equipo. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId, enrollmentStatus]);

  if (enrollmentStatus === "pending") {
    return (
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
        Tu inscripción por equipo está en revisión por C3. Cuando la aprueben, vas a poder crear un equipo o unirte con un código.
      </p>
    );
  }
  if (enrollmentStatus !== "approved") return null;

  async function run(label: string, action: () => Promise<void>, success: string) {
    setIssues([]);
    setFormError(null);
    setNotice(null);
    setBusy(label);
    try {
      await action();
      setNotice(success);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos completar la acción. Intentá de nuevo.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("crear", async () => {
      await apiRequest<{ team: TeamView }>(`/api/retos/${challengeId}/equipo`, { method: "POST", body: { name } });
      setName("");
    }, "Equipo creado. Compartí el código para sumar integrantes.");
  }

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("unirse", async () => {
      await apiRequest<{ team: TeamView }>("/api/equipos/unirse", { method: "POST", body: { code } });
      setCode("");
    }, "Te uniste al equipo.");
  }

  async function manage(teamId: string, action: string, userId?: string) {
    await run(action, async () => {
      await apiRequest(`/api/equipos/${teamId}`, { method: "PATCH", body: { action, userId } });
    }, action === "salir" ? "Saliste del equipo." : action === "disolver" ? "Equipo disuelto." : "Equipo actualizado.");
  }

  if (loadError) {
    return <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div>;
  }
  if (!state) return <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Cargando tu equipo…</p>;

  const feedback = (
    <>
      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}
    </>
  );

  if (!state.team) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {feedback}
        <form onSubmit={(event) => void create(event)} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-labelledby="crear-equipo">
          <span id="crear-equipo" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Crear equipo</span>
          <label htmlFor="equipo-nombre" className="c3-etiqueta-campo">Nombre del equipo</label>
          <input
            id="equipo-nombre"
            className={`c3-campo${issueFor(issues, "name") ? " c3-campo--error" : ""}`}
            maxLength={TEAM_NAME_MAX}
            value={name}
            disabled={!state.canManage}
            onChange={(event) => setName(event.target.value)}
          />
          {issueFor(issues, "name") ? <span className="c3-error-campo">{issueFor(issues, "name")}</span> : null}
          <button type="submit" className="c3-btn c3-btn--primario" disabled={!state.canManage || busy !== null}>
            {busy === "crear" ? "Creando…" : "Crear equipo"}
          </button>
        </form>

        <form onSubmit={(event) => void join(event)} noValidate style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--c3-borde)", paddingTop: 16 }} aria-labelledby="unirse-equipo">
          <span id="unirse-equipo" className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>¿Te invitaron a un equipo?</span>
          <label htmlFor="equipo-codigo" className="c3-etiqueta-campo">Código de equipo</label>
          <input
            id="equipo-codigo"
            className={`c3-campo${issueFor(issues, "code") ? " c3-campo--error" : ""}`}
            placeholder="C3-XXXX"
            value={code}
            disabled={!state.canManage}
            onChange={(event) => setCode(event.target.value)}
          />
          {issueFor(issues, "code") ? <span className="c3-error-campo">{issueFor(issues, "code")}</span> : <span className="c3-ayuda">Solo podés estar en un equipo por experiencia.</span>}
          <button type="submit" className="c3-btn c3-btn--contorno" disabled={!state.canManage || busy !== null}>
            {busy === "unirse" ? "Uniéndote…" : "Unirme con código"}
          </button>
          {!state.canManage ? <span className="c3-ayuda">Las inscripciones cerraron: ya no se puede crear ni unirse a un equipo.</span> : null}
        </form>
      </div>
    );
  }

  const team = state.team;
  const amLeader = team.myRole === "lider";
  const emptySlots = Math.max(team.maxSize - team.members.length, 0);

  return (
    <div className="c3-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }} aria-label="Tu equipo">
      {feedback}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Tu equipo</span>
        <span className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>{team.name}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{teamSlotsLabel(team.members.length, team.minSize, team.maxSize)}</span>
          <StatePill state={teamPresentation(team.status)} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {team.members.map((member) => {
          const isMe = member.userId === myUid;
          return (
            <div key={member.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--c3-borde)" }}>
              <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 999, background: member.role === "lider" ? "var(--c3-accion)" : "var(--c3-conecta)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                {initialsOf(member.displayName, null)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{member.displayName ?? "Sin nombre"}{isMe ? " (vos)" : ""}</span>
                <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>
                  {member.role === "lider" ? "Líder · puede enviar la entrega" : "Integrante"}
                </span>
              </div>
              {amLeader && !isMe && state.canManage ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 36, padding: "0 10px", fontSize: 11 }} disabled={busy !== null} onClick={() => void manage(team.id, "transferir", member.userId)}>
                    Hacer líder
                  </button>
                  <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 36, padding: "0 10px", fontSize: 11 }} disabled={busy !== null} onClick={() => void manage(team.id, "quitar", member.userId)}>
                    Quitar
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div key={`libre-${index}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px dashed var(--c3-borde-fuerte)" }}>
            <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 999, border: "1px dashed var(--c3-borde-fuerte)", flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Lugar libre</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--c3-superficie-sutil)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Código para sumar a alguien</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span className="c3-titulo" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.12em" }} data-testid="codigo-equipo">{team.code}</span>
          <button
            type="button"
            className="c3-btn c3-btn--contorno"
            style={{ minHeight: 44, padding: "0 16px" }}
            onClick={() => {
              void navigator.clipboard?.writeText(team.code);
              setNotice("Código copiado.");
            }}
          >
            Copiar
          </button>
        </div>
        <span className="c3-ayuda">La persona debe tener inscripción por equipo aprobada en este challenge. Podés cambiar integrantes hasta el cierre de inscripciones.</span>
      </div>

      {team.canManage ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {amLeader && team.members.length === 1 ? (
            <button type="button" className="c3-btn c3-btn--contorno" disabled={busy !== null} onClick={() => void manage(team.id, "disolver")}>
              Disolver equipo
            </button>
          ) : null}
          {!amLeader ? (
            <button type="button" className="c3-btn c3-btn--contorno" disabled={busy !== null} onClick={() => void manage(team.id, "salir")}>
              Salir del equipo
            </button>
          ) : null}
        </div>
      ) : (
        <span className="c3-ayuda">Las inscripciones cerraron: el equipo ya no se puede cambiar.</span>
      )}

      <Link href={`/mi-c3/retos/${challengeId}`} className="c3-btn c3-btn--primario">Continuar al challenge</Link>
    </div>
  );
}
