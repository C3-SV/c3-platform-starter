"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";
import { getClientAuth } from "@/lib/firebase/client";
import type { Profile } from "@/lib/server/profile";

const isAuthEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

function errorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
}

function authMessage(error: unknown): string {
  switch (errorCode(error)) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "La contraseña actual no coincide.";
    case "auth/weak-password":
      return "La nueva contraseña debe tener al menos 8 caracteres.";
    case "auth/requires-recent-login":
      return "Firebase necesita una sesión reciente. Cerrá sesión y volvé a entrar para intentar de nuevo.";
    case "auth/network-request-failed":
      return "No pudimos conectarnos con Firebase. Revisá tu conexión e intentá de nuevo.";
    case "auth/too-many-requests":
      return "Hubo demasiados intentos. Esperá unos minutos antes de volver a intentar.";
    default:
      return "Firebase no pudo completar esta operación. Intentá de nuevo.";
  }
}

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/** Cuenta personal: Auth administra las credenciales; Firestore conserva solo el perfil editable. */
export function CuentaPanel() {
  const { session, signOut, refreshUser } = useSession();
  const sessionUid = session.status === "signed-in" ? session.user.uid : null;
  const sessionDisplayName = session.status === "signed-in" ? session.user.displayName ?? "" : "";
  const authDisplayName = useRef(session.status === "signed-in" ? session.user.displayName ?? "" : "");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ displayName: "", school: "", bio: "", github: "", linkedin: "" });
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationRefreshBusy, setVerificationRefreshBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    authDisplayName.current = sessionDisplayName;
  }, [sessionDisplayName]);

  useEffect(() => {
    if (!sessionUid) return;
    let active = true;
    apiRequest<{ profile: Profile }>("/api/me").then(
      ({ profile: saved }) => {
        if (!active) return;
        setProfile(saved);
        setForm({
          displayName: saved.displayName ?? authDisplayName.current,
          school: saved.school,
          bio: saved.bio,
          github: saved.github,
          linkedin: saved.linkedin,
        });
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu cuenta. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [sessionUid]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues([]);
    setSaveError(null);
    setSaveNotice(null);
    const name = form.displayName.trim();
    if (name.length < 3 || name.length > 120) {
      setIssues([{ field: "displayName", message: "Escribí tu nombre completo (entre 3 y 120 caracteres)." }]);
      return;
    }
    const user = getClientAuth().currentUser;
    if (!user) {
      setSaveError("Iniciá sesión para guardar tu perfil.");
      return;
    }
    setSaving(true);
    const previousName = user.displayName;
    try {
      await updateProfile(user, { displayName: name });
      try {
        const { profile: saved } = await apiRequest<{ profile: Profile }>("/api/perfil", { method: "PUT", body: form });
        setProfile(saved);
        setForm({ displayName: saved.displayName ?? "", school: saved.school, bio: saved.bio, github: saved.github, linkedin: saved.linkedin });
        await refreshUser();
        setSaveNotice("Cambios guardados. Los resultados y las participaciones oficiales siguen a cargo de C3.");
      } catch (error) {
        await updateProfile(user, { displayName: previousName });
        throw error;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setSaveError(error.message);
      } else if (errorCode(error)) {
        setSaveError(authMessage(error));
      } else {
        setSaveError("No pudimos guardar los cambios. Intentá de nuevo.");
      }
      await refreshUser().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  async function requestEmailVerification() {
    setVerificationBusy(true);
    setVerificationError(null);
    setVerificationMessage(null);
    try {
      const user = getClientAuth().currentUser;
      if (!user || !user.email) throw new Error("No encontramos el correo de esta sesión.");
      await sendEmailVerification(user);
      setVerificationMessage(isAuthEmulator
        ? "Firebase generó el enlace en el emulador de Auth (localhost:4000); el emulador no envía correos reales."
        : "Firebase envió un enlace de verificación al correo de tu cuenta.");
    } catch (error) {
      setVerificationError(errorCode(error) ? authMessage(error) : "No pudimos solicitar la verificación. Intentá de nuevo.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function refreshVerificationStatus() {
    setVerificationRefreshBusy(true);
    setVerificationError(null);
    try {
      await refreshUser();
      setVerificationMessage("Estado del correo actualizado desde Firebase.");
    } catch (error) {
      setVerificationError(authMessage(error));
    } finally {
      setVerificationRefreshBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);
    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }
    const user = getClientAuth().currentUser;
    const email = user?.email;
    if (!user || !email) {
      setPasswordError("No encontramos una sesión con correo y contraseña. Volvé a entrar para continuar.");
      return;
    }
    setPasswordBusy(true);
    try {
      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice("Contraseña actualizada correctamente.");
    } catch (error) {
      setPasswordError(authMessage(error));
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleSignOut() {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(authMessage(error));
    }
  }

  const signedIn = session.status === "signed-in";
  const authUser = signedIn ? getClientAuth().currentUser : null;
  const canChangePassword = Boolean(authUser?.providerData.some(({ providerId }) => providerId === "password"));
  const passwordFields = [
    { id: "actual", label: "Contraseña actual", value: currentPassword, setValue: setCurrentPassword, autoComplete: "current-password" },
    { id: "nueva", label: "Nueva contraseña", value: newPassword, setValue: setNewPassword, autoComplete: "new-password" },
    { id: "confirmar", label: "Confirmar contraseña", value: confirmPassword, setValue: setConfirmPassword, autoComplete: "new-password" },
  ];

  return (
    <>
      <SiteHeader />
      <main className="c3-page c3-container c3-cuenta">
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Mi espacio</span>
          <h1 className="c3-titulo" style={{ fontSize: 32, lineHeight: 1.2, fontWeight: 700 }}>Tu cuenta</h1>
          <p style={{ maxWidth: 720, fontSize: 14, lineHeight: 1.6, color: "var(--c3-texto-suave)" }}>
            Administrá tus datos personales y la seguridad de acceso. C3 conserva por separado tu trayectoria y los resultados oficiales.
          </p>
        </div>

        {session.status === "loading" ? <p role="status" style={{ color: "var(--c3-texto-suave)" }}>Cargando tu sesión…</p> : null}
        {session.status === "unavailable" ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>La cuenta no está disponible</strong><span>{session.message}</span></div> : null}
        {session.status === "signed-out" ? (
          <section className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Entrá para administrar tu cuenta</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Iniciá sesión para administrar tu cuenta.</p>
            <Link href="/acceso?next=%2Fcuenta" className="c3-btn c3-btn--primario" style={{ alignSelf: "flex-start" }}>Entrar</Link>
          </section>
        ) : null}

        {signedIn ? (
          <>
            {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}
            {!profile && !loadError ? <p role="status" style={{ color: "var(--c3-texto-suave)" }}>Cargando tus datos…</p> : null}

            <div className="c3-cuenta__grid">
              <section className="c3-card c3-cuenta__panel" aria-labelledby="datos-personales">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h2 id="datos-personales" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Información personal</h2>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>El nombre y el correo identifican tu acceso. El correo no se cambia desde esta página.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="cuenta-correo" className="c3-etiqueta-campo">Correo</label>
                  <input id="cuenta-correo" className="c3-campo" type="email" value={session.user.email ?? ""} readOnly aria-describedby="cuenta-correo-ayuda" />
                  <span id="cuenta-correo-ayuda" className="c3-ayuda">El correo se administra de forma segura en Firebase Authentication.</span>
                </div>
                {profile ? (
                  <form onSubmit={(event) => void saveProfile(event)} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {saveError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>No pudimos guardar los cambios</strong><span>{saveError}</span></div> : null}
                    {saveNotice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{saveNotice}</strong></div> : null}
                    {[
                      ["displayName", "Nombre visible"],
                      ["school", "Centro de estudio o trabajo"],
                      ["github", "GitHub"],
                      ["linkedin", "LinkedIn"],
                    ].map(([field, label]) => (
                      <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label htmlFor={`cuenta-${field}`} className="c3-etiqueta-campo">{label}</label>
                        <input
                          id={`cuenta-${field}`}
                          className={`c3-campo${issueFor(issues, field) ? " c3-campo--error" : ""}`}
                          value={form[field as keyof typeof form]}
                          onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                          aria-invalid={Boolean(issueFor(issues, field))}
                          aria-describedby={issueFor(issues, field) ? `cuenta-error-${field}` : undefined}
                        />
                        {issueFor(issues, field) ? <span id={`cuenta-error-${field}`} className="c3-error-campo">{issueFor(issues, field)}</span> : null}
                      </div>
                    ))}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label htmlFor="cuenta-bio" className="c3-etiqueta-campo">Presentación</label>
                      <textarea id="cuenta-bio" rows={3} className={`c3-campo${issueFor(issues, "bio") ? " c3-campo--error" : ""}`} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} aria-invalid={Boolean(issueFor(issues, "bio"))} />
                      {issueFor(issues, "bio") ? <span className="c3-error-campo">{issueFor(issues, "bio")}</span> : null}
                    </div>
                    <button type="submit" className="c3-btn c3-btn--primario" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
                  </form>
                ) : null}
              </section>

              <section className="c3-card c3-cuenta__panel" aria-labelledby="seguridad-cuenta">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h2 id="seguridad-cuenta" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Seguridad</h2>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>La contraseña y la verificación del correo las gestiona Firebase Authentication.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
                  <span className={`c3-pill ${session.user.emailVerified ? "c3-pill--exito" : "c3-pill--advertencia"}`}>
                    {session.user.emailVerified ? "Correo verificado" : "No verificado"}
                  </span>
                  {!session.user.emailVerified ? (
                    <>
                      {verificationMessage ? <p role="status" className="c3-ayuda">{verificationMessage}</p> : null}
                      {verificationError ? <p role="alert" className="c3-error-campo">{verificationError}</p> : null}
                      <button type="button" className="c3-btn c3-btn--contorno" onClick={() => void requestEmailVerification()} disabled={verificationBusy || !session.user.email}>
                        {verificationBusy ? "Solicitando…" : "Enviar verificación"}
                      </button>
                      <button type="button" className="c3-btn c3-btn--contorno" onClick={() => void refreshVerificationStatus()} disabled={verificationRefreshBusy}>
                        {verificationRefreshBusy ? "Revisando…" : "Actualizar estado"}
                      </button>
                    </>
                  ) : null}
                </div>

                {canChangePassword ? (
                  <form onSubmit={(event) => void changePassword(event)} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--c3-borde)", paddingTop: 16 }}>
                    <h3 className="c3-titulo" style={{ fontSize: 17, fontWeight: 600 }}>Cambiar contraseña</h3>
                    {passwordError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{passwordError}</strong></div> : null}
                    {passwordNotice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{passwordNotice}</strong></div> : null}
                    {passwordFields.map(({ id, label, value, setValue, autoComplete }) => (
                      <div key={id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label htmlFor={`cuenta-password-${id}`} className="c3-etiqueta-campo">{label}</label>
                        <input id={`cuenta-password-${id}`} className="c3-campo" type="password" autoComplete={autoComplete} value={value} onChange={(event) => setValue(event.target.value)} />
                      </div>
                    ))}
                    <span className="c3-ayuda">Mínimo 8 caracteres. Firebase volverá a comprobar tu contraseña actual antes de guardar.</span>
                    <button type="submit" className="c3-btn c3-btn--contorno" disabled={passwordBusy}>{passwordBusy ? "Actualizando…" : "Cambiar contraseña"}</button>
                  </form>
                ) : (
                  <p className="c3-ayuda">Esta cuenta no tiene una contraseña de Firebase configurada. Usá el método con el que creaste tu cuenta.</p>
                )}

                <div style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <h3 className="c3-titulo" style={{ fontSize: 17, fontWeight: 600 }}>Sesión</h3>
                  {signOutError ? <p role="alert" className="c3-error-campo">{signOutError}</p> : null}
                  <button type="button" className="c3-btn c3-btn--contorno" onClick={() => void handleSignOut()}>Salir de la cuenta</button>
                </div>
              </section>
            </div>

            <div className="c3-alerta c3-alerta--info" style={{ marginTop: 20 }}>
              <strong>Tu trayectoria sigue a cargo de C3</strong>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>Podés consultar tus participaciones y reconocimientos registrados en <Link href="/trayectoria">Trayectoria</Link>. Esos registros oficiales no se editan desde Cuenta.</span>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
