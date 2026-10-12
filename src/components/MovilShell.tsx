"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/lib/auth/AuthProvider";

/** Iniciales para el avatar: primera letra del nombre y del apellido (o de la única palabra). */
export function initialsOf(name: string | null | undefined, email: string | null | undefined): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "C3";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Marco de las vistas móviles (V05–V07). Ocupa el ancho del teléfono y se centra en escritorio,
 * conservando la cabecera navy, el avatar y la barra inferior de la guía de estilo.
 */
export function MovilShell({
  children,
  backHref,
  backLabel = "Mi C3",
  nav = "inicio",
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  nav?: "inicio" | "explorar" | null;
}) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const user = session.status === "signed-in" ? session.user : null;

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="c3-movil">
      <div className="c3-movil__barra">
        {backHref ? (
          <Link href={backHref} style={{ fontSize: 14, fontWeight: 500, color: "var(--c3-texto-cabecera)", textDecoration: "none" }}>
            ← {backLabel}
          </Link>
        ) : (
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio" style={{ fontSize: 20, fontWeight: 800 }}>C3</Link>
        )}
        {backHref ? (
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio" style={{ fontSize: 20, fontWeight: 800 }}>C3</Link>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <button type="button" className="c3-etiqueta" onClick={() => void handleSignOut()} style={{ background: "none", border: 0, color: "#ffffff", cursor: "pointer", padding: "8px 4px" }}>
              Salir
            </button>
          ) : null}
          <div
            aria-label={user ? `Sesión de ${user.displayName ?? user.email ?? "tu cuenta"}` : undefined}
            style={{ width: 32, height: 32, borderRadius: 999, background: "var(--c3-conecta)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}
          >
            {user ? initialsOf(user.displayName, user.email) : ""}
          </div>
        </div>
      </div>

      <div className="c3-movil__contenido">{children}</div>

      {nav ? (
        <nav aria-label="Navegación móvil" className="c3-movil__nav">
          <Link href="/mi-c3" aria-current={nav === "inicio" ? "page" : undefined} className={`c3-movil__nav-item${nav === "inicio" ? " c3-movil__nav-item--activo" : ""}`}>Inicio</Link>
          <Link href="/explorar" aria-current={nav === "explorar" ? "page" : undefined} className={`c3-movil__nav-item${nav === "explorar" ? " c3-movil__nav-item--activo" : ""}`}>Explorar</Link>
          <span aria-disabled="true" title="Próximamente" className="c3-movil__nav-item c3-movil__nav-item--pendiente">Trayectoria</span>
        </nav>
      ) : null}
    </div>
  );
}
