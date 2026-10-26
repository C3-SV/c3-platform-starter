"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "./api.ts";
import type { PublicProfileInput } from "../domain/public-profile.ts";
import type { MyPublicProfile } from "../server/publicProfiles.ts";

interface PublicProfileState {
  profile: MyPublicProfile | null;
  error: string | null;
  /** Guarda la configuración y devuelve el resultado, o lanza ApiError con el motivo. */
  save: (input: PublicProfileInput) => Promise<MyPublicProfile>;
  /** Cambia la dirección pública: la anterior deja de funcionar. */
  rotate: () => Promise<MyPublicProfile>;
}

/** Configuración del perfil público de la persona autenticada (Cuenta y Trayectoria usan la misma). */
export function usePublicProfile(enabled: boolean): PublicProfileState {
  const [profile, setProfile] = useState<MyPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // La respuesta actualiza el estado; no se escribe dentro del efecto.
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    apiRequest<{ publicProfile: MyPublicProfile }>("/api/perfil/publico").then(
      (data) => {
        if (!active) return;
        setProfile(data.publicProfile);
        setError(null);
      },
      (cause: unknown) => {
        if (active) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar tu perfil público. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [enabled]);

  const save = useCallback(async (input: PublicProfileInput) => {
    const data = await apiRequest<{ publicProfile: MyPublicProfile }>("/api/perfil/publico", { method: "PUT", body: input });
    setProfile(data.publicProfile);
    return data.publicProfile;
  }, []);

  const rotate = useCallback(async () => {
    const data = await apiRequest<{ publicProfile: MyPublicProfile }>("/api/perfil/publico/enlace", { method: "POST" });
    setProfile(data.publicProfile);
    return data.publicProfile;
  }, []);

  return { profile, error, save, rotate };
}

/** Dirección completa para compartir (el origen es el del navegador). */
export function absolutePublicUrl(path: string): string {
  return `${window.location.origin}${path}`;
}

/** Copia al portapapeles; devuelve false si el navegador no lo permite (el enlace sigue visible para copiarlo a mano). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
