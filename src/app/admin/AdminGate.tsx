"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/AuthProvider";
import { AdminFrame } from "./AdminFrame";

/**
 * Control de acceso de la consola. El servidor vuelve a comprobar el permiso en cada llamada de `/api/admin/*`; esto
 * solo decide qué se muestra: la consola para quien tiene el claim, y en el marco de la app una pantalla con salida
 * (entrar, o ir a Mi C3) para todos los demás.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (session.status === "signed-in" && session.user.isAdmin) return <AdminFrame>{children}</AdminFrame>;

  return (
    <AppShell active="admin" signedOut={{ title: "Entrá con una cuenta de administración", text: "Esta sección es solo para el equipo administrador de C3. Al entrar volvés aquí." }}>
      <div className="c3-ancho c3-page">
        <section className="c3-card c3-requiere-sesion" aria-labelledby="admin-sin-permiso">
          <h1 id="admin-sin-permiso" className="c3-titulo">No tenés acceso a esta sección</h1>
          <p>Esta sección es solo para el equipo administrador de C3.</p>
          <div className="c3-requiere-sesion__acciones">
            <Link href="/mi-c3" className="c3-btn c3-btn--primario">Ir a Mi C3</Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
