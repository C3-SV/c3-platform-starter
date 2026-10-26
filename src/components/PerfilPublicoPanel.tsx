"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/client/api";
import { absolutePublicUrl, copyText, usePublicProfile } from "@/lib/client/usePublicProfile";
import { DEFAULT_SHOW, type PublicProfileShow } from "@/lib/domain/public-profile";

const OPTIONS: { key: keyof PublicProfileShow; label: string; help: string }[] = [
  { key: "school", label: "Mostrar dónde estudio o trabajo", help: "Desactivado por defecto: junto al nombre puede ubicarte." },
  { key: "bio", label: "Mostrar lo que escribí sobre mí", help: "El texto de tu perfil. C3 no lo verifica." },
  { key: "links", label: "Mostrar mis enlaces profesionales", help: "Solo los que cargaste en tu perfil." },
  { key: "trajectory", label: "Mostrar mi trayectoria en C3", help: "Participaciones aprobadas y reconocimientos que C3 publicó. Nunca tus entregas, notas ni promedios." },
];

/**
 * Perfil público compartible (opt-in): la persona decide si existe y qué muestra. Siempre se muestra su nombre; nunca su
 * correo. Desactivado por defecto. Se puede cambiar la dirección en cualquier momento: la anterior deja de funcionar.
 */
export function PerfilPublicoPanel() {
  const { session } = useSession();
  const { profile, error, save, rotate } = usePublicProfile(session.status === "signed-in");
  const [draft, setDraft] = useState<PublicProfileShow | null>(null);
  const [busy, setBusy] = useState<"guardar" | "desactivar" | "cambiar" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const loaded = profile !== null;

  // «Activar en Cuenta» (Trayectoria) llega con #perfil-publico: el bloque aparece cuando la sesión ya cargó.
  useEffect(() => {
    if (loaded && window.location.hash === "#perfil-publico") document.getElementById("perfil-publico")?.scrollIntoView();
  }, [loaded]);

  if (!profile) {
    return (
      <section id="perfil-publico" className="c3-card c3-cuenta__panel" aria-labelledby="perfil-publico-titulo">
        <h2 id="perfil-publico-titulo" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Perfil público</h2>
        {error ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{error}</strong></div> : <p role="status" className="c3-ayuda">Cargando…</p>}
      </section>
    );
  }

  const show = draft ?? profile.show ?? DEFAULT_SHOW;
  const url = profile.enabled && profile.path ? absolutePublicUrl(profile.path) : null;

  async function run(kind: "guardar" | "desactivar" | "cambiar", work: () => Promise<unknown>, success: string) {
    setBusy(kind);
    setNotice(null);
    setFormError(null);
    try {
      await work();
      setDraft(null);
      setNotice(success);
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : "No pudimos guardar los cambios. Intentá de nuevo.");
    } finally {
      setBusy(null);
      setConfirmRotate(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run("guardar", () => save({ enabled: true, show }), profile?.enabled ? "Cambios guardados. Tu perfil público ya los muestra." : "Perfil público activado. Ya podés compartir el enlace.");
  }

  return (
    <section id="perfil-publico" className="c3-card c3-cuenta__panel" aria-labelledby="perfil-publico-titulo">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 id="perfil-publico-titulo" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Perfil público</h2>
        <span className={`c3-pill c3-pill--${profile.enabled ? "exito" : "neutro"}`}>{profile.enabled ? "Activo" : "Privado"}</span>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
        Compartí tu trayectoria con un enlace. Es opcional y está desactivado por defecto. Siempre se muestra tu nombre; tu correo nunca se publica.
        Si sos menor de edad, hablalo antes con tu familia o tutor.
      </p>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <legend className="c3-etiqueta-campo" style={{ marginBottom: 6 }}>Qué se muestra</legend>
          {OPTIONS.map((option) => (
            <label key={option.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={show[option.key]}
                onChange={(event) => setDraft({ ...show, [option.key]: event.target.checked })}
                style={{ width: 20, height: 20, accentColor: "var(--c3-accion)", marginTop: 2, flexShrink: 0 }}
              />
              <span>
                {option.label}
                <span className="c3-ayuda" style={{ display: "block" }}>{option.help}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" className="c3-btn c3-btn--primario" disabled={busy !== null}>
            {busy === "guardar" ? "Guardando…" : profile.enabled ? "Guardar lo que muestro" : "Activar perfil público"}
          </button>
          {profile.enabled ? (
            <button type="button" className="c3-btn c3-btn--contorno" disabled={busy !== null} onClick={() => void run("desactivar", () => save({ enabled: false, show }), "Perfil público desactivado. El enlace dejó de funcionar.")}>
              {busy === "desactivar" ? "Desactivando…" : "Desactivar"}
            </button>
          ) : null}
        </div>
      </form>

      {url && profile.path ? (
        <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <label htmlFor="perfil-publico-enlace" className="c3-etiqueta-campo">Tu enlace</label>
          <input id="perfil-publico-enlace" className="c3-campo" readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="c3-btn c3-btn--contorno" onClick={() => void copyText(url).then((ok) => setNotice(ok ? "Enlace copiado." : "No pudimos copiarlo: seleccioná el enlace y copialo."))}>Copiar enlace</button>
            <Link href={profile.path} className="c3-btn c3-btn--contorno">Ver perfil público</Link>
          </div>
          {confirmRotate ? (
            <div className="c3-alerta c3-alerta--advertencia" role="group" aria-label="Confirmar el cambio de enlace">
              <strong>¿Cambiar el enlace?</strong>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>El enlace actual dejará de funcionar para todas las personas que lo tengan.</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <button type="button" className="c3-btn c3-btn--contorno" disabled={busy !== null} onClick={() => void run("cambiar", rotate, "Enlace cambiado. El anterior ya no funciona.")}>
                  {busy === "cambiar" ? "Cambiando…" : "Sí, cambiar enlace"}
                </button>
                <button type="button" className="c3-mi-c3__accion-secundaria" onClick={() => setConfirmRotate(false)}>Mantenerlo</button>
              </div>
            </div>
          ) : (
            <button type="button" className="c3-mi-c3__accion-secundaria" style={{ alignSelf: "flex-start" }} onClick={() => setConfirmRotate(true)}>Cambiar enlace</button>
          )}
        </div>
      ) : null}
    </section>
  );
}
