"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, reload, signOut as firebaseSignOut } from "firebase/auth";
import { getClientAuth, isClientConfigured } from "../firebase/client.ts";

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: SessionUser }
  | { status: "unavailable"; message: string };

interface AuthContextValue {
  session: SessionState;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sesión de Firebase en el navegador. El rol administrador llega como claim del token verificado. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isClientConfigured();
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(getClientAuth(), async (user) => {
      if (!user) {
        setSession({ status: "signed-out" });
        return;
      }
      const tokenResult = await user.getIdTokenResult();
      setSession({
        status: "signed-in",
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          isAdmin: tokenResult.claims.c3Admin === true,
        },
      });
    });
  }, [configured]);

  const current = useMemo<SessionState>(
    () => (configured ? session : { status: "unavailable", message: "La conexión con el servicio de cuentas no está configurada." }),
    [configured, session],
  );

  const value = useMemo<AuthContextValue>(() => ({
    session: current,
    signOut: async () => {
      await firebaseSignOut(getClientAuth());
    },
    refreshUser: async () => {
      const user = getClientAuth().currentUser;
      if (!user) return;
      await reload(user);
      const tokenResult = await user.getIdTokenResult();
      setSession({
        status: "signed-in",
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          isAdmin: tokenResult.claims.c3Admin === true,
        },
      });
    },
  }), [current]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useSession debe usarse dentro de AuthProvider.");
  return value;
}
