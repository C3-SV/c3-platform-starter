"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./AuthProvider";

/**
 * «Salir» se comporta igual en todas las pantallas: cierra la sesión y lleva a la Home pública.
 * Se usa `replace` para que «atrás» no devuelva a una pantalla privada que ya no se puede ver.
 */
export function useSignOut(): () => Promise<void> {
  const { signOut } = useSession();
  const router = useRouter();
  return useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [signOut, router]);
}
