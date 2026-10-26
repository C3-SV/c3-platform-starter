"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, reload, signOut as firebaseSignOut, type User } from "firebase/auth";
import { apiRequest } from "../client/api.ts";
import { NO_CAPABILITIES, parseCapabilities, type Capabilities } from "../domain/capabilities.ts";
import { getClientAuth, isClientConfigured } from "../firebase/client.ts";

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  /** Claim `c3Admin` del token: sirve para mostrar accesos de inmediato; el servidor lo verifica en cada llamada. */
  isAdmin: boolean;
  /** Capacidades propias (empresa, evaluación, administración) según `/api/me`. `null` mientras se consultan. */
  capabilities: Capabilities | null;
}

type BaseUser = Omit<SessionUser, "capabilities">;

type BaseState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: BaseUser }
  | { status: "unavailable"; message: string };

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: SessionUser }
  | { status: "unavailable"; message: string };

interface AuthContextValue {
  session: SessionState;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Vuelve a pedir las capacidades: útil cuando C3 acaba de vincular la cuenta a una organización o a un challenge. */
  refreshCapabilities: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function toBaseUser(user: User): Promise<BaseUser> {
  const tokenResult = await user.getIdTokenResult();
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    isAdmin: tokenResult.claims.c3Admin === true,
  };
}

/** Consulta `/api/me`. Si falla, la interfaz sigue con los accesos básicos en lugar de quedar esperando. */
async function fetchCapabilities(isAdmin: boolean): Promise<Capabilities> {
  try {
    const data = await apiRequest<{ capabilities?: unknown }>("/api/me");
    return parseCapabilities(data.capabilities);
  } catch {
    return { ...NO_CAPABILITIES, admin: isAdmin };
  }
}

/** Sesión de Firebase en el navegador. El rol administrador llega como claim del token verificado. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isClientConfigured();
  const [session, setSession] = useState<BaseState>({ status: "loading" });
  const [capabilities, setCapabilities] = useState<{ uid: string; value: Capabilities } | null>(null);
  const uid = session.status === "signed-in" ? session.user.uid : null;
  const claimsAdmin = session.status === "signed-in" ? session.user.isAdmin : false;

  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(getClientAuth(), async (user) => {
      if (!user) {
        setSession({ status: "signed-out" });
        return;
      }
      setSession({ status: "signed-in", user: await toBaseUser(user) });
    });
  }, [configured]);

  // Una consulta por cuenta que inicia sesión. La respuesta actualiza el estado; no se escribe dentro del efecto.
  useEffect(() => {
    if (!uid) return;
    let active = true;
    void fetchCapabilities(claimsAdmin).then((value) => {
      if (active) setCapabilities({ uid, value });
    });
    return () => {
      active = false;
    };
  }, [uid, claimsAdmin]);

  const exposed = useMemo<SessionState>(() => {
    if (!configured) return { status: "unavailable", message: "La conexión con el servicio de cuentas no está configurada." };
    if (session.status !== "signed-in") return session;
    const known = capabilities && capabilities.uid === session.user.uid ? capabilities.value : null;
    return { status: "signed-in", user: { ...session.user, capabilities: known } };
  }, [configured, session, capabilities]);

  const refreshCapabilities = useCallback(async () => {
    const user = getClientAuth().currentUser;
    if (!user) return;
    const value = await fetchCapabilities(claimsAdmin);
    setCapabilities({ uid: user.uid, value });
  }, [claimsAdmin]);

  const value = useMemo<AuthContextValue>(() => ({
    session: exposed,
    signOut: async () => {
      await firebaseSignOut(getClientAuth());
    },
    refreshUser: async () => {
      const user = getClientAuth().currentUser;
      if (!user) return;
      await reload(user);
      setSession({ status: "signed-in", user: await toBaseUser(user) });
    },
    refreshCapabilities,
  }), [exposed, refreshCapabilities]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useSession debe usarse dentro de AuthProvider.");
  return value;
}
