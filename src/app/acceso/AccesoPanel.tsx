"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useSession } from "@/lib/auth/AuthProvider";
import { getClientAuth } from "@/lib/firebase/client";
import { apiRequest, ApiError } from "@/lib/client/api";
import { safeNext } from "@/lib/domain/navigation";

const LOGIN_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "El correo o la contraseña no coinciden. Revisalos e intentá de nuevo.",
  "auth/wrong-password": "El correo o la contraseña no coinciden. Revisalos e intentá de nuevo.",
  "auth/user-not-found": "El correo o la contraseña no coinciden. Revisalos e intentá de nuevo.",
  "auth/invalid-email": "Revisá el formato del correo.",
  "auth/user-disabled": "Esta cuenta está deshabilitada. Escribinos para revisarla.",
  "auth/too-many-requests": "Hubo demasiados intentos. Esperá unos minutos antes de volver a intentar.",
  "auth/network-request-failed": "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.",
};

const REGISTER_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Entrá con tu contraseña.",
  "auth/invalid-email": "Revisá el formato del correo.",
  "auth/weak-password": "La contraseña debe tener al menos 8 caracteres.",
  "auth/network-request-failed": "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";
}

export function AccesoPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useSession();
  const next = safeNext(params.get("next"));
  const registerFirst = params.get("modo") === "registro";
  const nameRef = useRef<HTMLInputElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [registerIssues, setRegisterIssues] = useState<Record<string, string>>({});
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerBusy, setRegisterBusy] = useState(false);

  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null);
  const [recoverBusy, setRecoverBusy] = useState(false);

  useEffect(() => {
    if (session.status === "signed-in") router.replace(next);
  }, [session.status, next, router]);

  useEffect(() => {
    if (registerFirst) nameRef.current?.focus();
  }, [registerFirst]);

  if (session.status === "unavailable") {
    return (
      <div className="c3-alerta c3-alerta--error" role="alert">
        <strong>No podemos abrir el acceso ahora</strong>
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>{session.message}</span>
      </div>
    );
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    if (!EMAIL_PATTERN.test(loginEmail.trim())) {
      setLoginError("Revisá el formato del correo.");
      return;
    }
    setLoginBusy(true);
    try {
      await signInWithEmailAndPassword(getClientAuth(), loginEmail.trim(), loginPassword);
      // El perfil se crea al pedir las capacidades de la sesión (/api/me): no retrasa la entrada.
      router.replace(next);
    } catch (error) {
      setLoginError(LOGIN_ERRORS[errorCode(error)] ?? "No pudimos iniciar sesión. Intentá de nuevo en unos minutos.");
      setLoginBusy(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);
    const issues: Record<string, string> = {};
    if (name.trim().length < 3) issues.name = "Escribí tu nombre completo (al menos 3 caracteres).";
    if (!EMAIL_PATTERN.test(registerEmail.trim())) issues.email = "Revisá el formato del correo.";
    if (registerPassword.length < 8) issues.password = "La contraseña debe tener al menos 8 caracteres.";
    if (!terms) issues.terms = "Para crear la cuenta tenés que aceptar los términos.";
    setRegisterIssues(issues);
    if (Object.keys(issues).length) return;

    setRegisterBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(getClientAuth(), registerEmail.trim(), registerPassword);
      await updateProfile(credential.user, { displayName: name.trim() });
      try {
        await apiRequest("/api/me", { method: "PUT", body: { displayName: name.trim() } });
      } catch {
        setRegisterError("Tu cuenta se creó, pero no pudimos guardar tu nombre. Entrá de nuevo para completarlo.");
        setRegisterBusy(false);
        return;
      }
      router.replace(next);
    } catch (error) {
      setRegisterError(REGISTER_ERRORS[errorCode(error)] ?? (error instanceof ApiError ? error.message : "No pudimos crear la cuenta. Intentá de nuevo."));
      setRegisterBusy(false);
    }
  }

  async function handleRecover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoverError(null);
    setRecoverMessage(null);
    if (!EMAIL_PATTERN.test(recoverEmail.trim())) {
      setRecoverError("Escribí el correo de tu cuenta para enviarte el enlace.");
      return;
    }
    setRecoverBusy(true);
    try {
      await sendPasswordResetEmail(getClientAuth(), recoverEmail.trim());
      setRecoverMessage("Si el correo está registrado, te enviamos un enlace para cambiar la contraseña.");
    } catch (error) {
      if (errorCode(error) === "auth/network-request-failed") {
        setRecoverError("No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.");
      } else if (errorCode(error) === "auth/invalid-email") {
        setRecoverError("Revisá el formato del correo.");
      } else {
        setRecoverMessage("Si el correo está registrado, te enviamos un enlace para cambiar la contraseña.");
      }
    } finally {
      setRecoverBusy(false);
    }
  }

  return (
    <>
      {params.get("next") ? (
        <div style={{ background: "var(--c3-superficie-sutil)", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Entrá o creá tu cuenta para continuar</span>
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Al terminar volvés directo a donde estabas.</span>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        <section className="c3-card" style={{ flex: "1 1 400px", minWidth: 0, padding: 32, display: "flex", flexDirection: "column", gap: 20 }} aria-labelledby="titulo-entrar">
          <h1 id="titulo-entrar" className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Entrar</h1>

          {loginError ? (
            <div className="c3-alerta c3-alerta--error" role="alert">
              <strong>No pudimos iniciar sesión</strong>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{loginError}</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="l-correo" className="c3-etiqueta-campo">Correo</label>
              <input id="l-correo" className="c3-campo" type="email" autoComplete="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="l-pass" className="c3-etiqueta-campo">Contraseña</label>
              <input id="l-pass" className={`c3-campo${loginError ? " c3-campo--error" : ""}`} type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button type="submit" className="c3-btn c3-btn--primario" disabled={loginBusy} style={{ padding: "0 24px" }}>
                {loginBusy ? "Entrando…" : "Entrar"}
              </button>
              <a href="#recuperar" style={{ fontSize: 14, fontWeight: 500 }}>Olvidé mi contraseña</a>
            </div>
          </form>

          <form id="recuperar" onSubmit={handleRecover} noValidate style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--c3-borde)", paddingTop: 20 }}>
            <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Recuperar contraseña</span>
            <label htmlFor="rec-correo" className="c3-etiqueta-campo">Correo de tu cuenta</label>
            <input id="rec-correo" className="c3-campo" type="email" autoComplete="email" value={recoverEmail} onChange={(event) => setRecoverEmail(event.target.value)} />
            {recoverError ? <p className="c3-error-campo" role="alert">{recoverError}</p> : null}
            {recoverMessage ? <p role="status" style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-exito)" }}>{recoverMessage}</p> : null}
            <button type="submit" className="c3-btn c3-btn--contorno" disabled={recoverBusy}>
              {recoverBusy ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        </section>

        <section className="c3-card" style={{ flex: "1 1 400px", minWidth: 0, padding: 32, display: "flex", flexDirection: "column", gap: 20 }} aria-labelledby="titulo-crear">
          <h2 id="titulo-crear" className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Crear cuenta</h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Solo pedimos lo mínimo. Tu perfil lo completás después.</p>

          {registerError ? (
            <div className="c3-alerta c3-alerta--error" role="alert">
              <strong>No pudimos crear la cuenta</strong>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{registerError}</span>
            </div>
          ) : null}

          <form onSubmit={handleRegister} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="r-nombre" className="c3-etiqueta-campo">Nombre completo</label>
              <input ref={nameRef} id="r-nombre" className={`c3-campo${registerIssues.name ? " c3-campo--error" : ""}`} type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(registerIssues.name)} aria-describedby={registerIssues.name ? "e-nombre" : undefined} />
              {registerIssues.name ? <span id="e-nombre" className="c3-error-campo">{registerIssues.name}</span> : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="r-correo" className="c3-etiqueta-campo">Correo</label>
              <input id="r-correo" className={`c3-campo${registerIssues.email ? " c3-campo--error" : ""}`} type="email" autoComplete="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} aria-invalid={Boolean(registerIssues.email)} aria-describedby={registerIssues.email ? "e-correo" : undefined} />
              {registerIssues.email ? <span id="e-correo" className="c3-error-campo">{registerIssues.email}</span> : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="r-pass" className="c3-etiqueta-campo">Contraseña</label>
              <input id="r-pass" className={`c3-campo${registerIssues.password ? " c3-campo--error" : ""}`} type="password" autoComplete="new-password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} aria-invalid={Boolean(registerIssues.password)} aria-describedby={registerIssues.password ? "e-pass" : "ayuda-pass"} />
              {registerIssues.password ? <span id="e-pass" className="c3-error-campo">{registerIssues.password}</span> : <span id="ayuda-pass" className="c3-ayuda">Mínimo 8 caracteres.</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
                <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)", marginTop: 2, flexShrink: 0 }} aria-invalid={Boolean(registerIssues.terms)} />
                <span>Acepto los términos y la política de privacidad de C3.</span>
              </label>
              {registerIssues.terms ? <span className="c3-error-campo">{registerIssues.terms}</span> : <span className="c3-ayuda">Los textos legales se publican antes del piloto.</span>}
            </div>

            <button type="submit" className="c3-btn c3-btn--primario" disabled={registerBusy}>
              {registerBusy ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        </section>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 760 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>¿Representás a una empresa?</span>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
          Usás esta misma cuenta. C3 te vincula a tu organización después de revisar tu solicitud; no se hace creando otro tipo de cuenta.
        </span>
      </div>
    </>
  );
}
