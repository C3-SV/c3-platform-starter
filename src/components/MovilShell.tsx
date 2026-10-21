"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { C3BrandMark } from "@/components/BrandMark";
import { PanelHeader } from "@/components/PanelHeader";
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
 *
 * Con `layout="panel"` (Mi C3) el marco es adaptable: móvil y tablet usan la barra superior y la navegación
 * inferior; desde 1024 px las reemplaza la cabecera de escritorio y el contenido ocupa todo el ancho. Es la
 * misma estructura en todos los anchos (el CSS decide qué se ve), así que los datos se piden una sola vez.
 * Las demás vistas no lo usan y conservan el marco móvil de siempre.
 */
export function MovilShell({
  children,
  backHref,
  backLabel = "Mi C3",
  nav = "inicio",
  layout = "movil",
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  nav?: "inicio" | "explorar" | "trayectoria" | null;
  layout?: "movil" | "panel";
}) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const user = session.status === "signed-in" ? session.user : null;
  const panel = layout === "panel";
  const Contenido = panel ? "main" : "div";

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className={`c3-movil${panel ? " c3-movil--panel" : ""}`}>
      {panel ? (
        <PanelHeader
          activo={nav}
          user={user ? { name: user.displayName ?? user.email ?? "Tu cuenta", initials: initialsOf(user.displayName, user.email), isAdmin: user.isAdmin } : null}
          onSignOut={() => void handleSignOut()}
        />
      ) : null}
      <div className="c3-movil__barra">
        {backHref ? (
          <Link href={backHref} style={{ fontSize: 14, fontWeight: 500, color: "var(--c3-texto-cabecera)", textDecoration: "none" }}>
            ← {backLabel}
          </Link>
        ) : (
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--mobile" priority />
          </Link>
        )}
        {backHref ? (
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--mobile" priority />
          </Link>
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

      <Contenido className="c3-movil__contenido">{children}</Contenido>

      {nav ? (
        <nav aria-label="Navegación móvil" className="c3-movil__nav">
          <Link href="/mi-c3" aria-current={nav === "inicio" ? "page" : undefined} className={`c3-movil__nav-item${nav === "inicio" ? " c3-movil__nav-item--activo" : ""}`}>Inicio</Link>
          <Link href="/explorar" aria-current={nav === "explorar" ? "page" : undefined} className={`c3-movil__nav-item${nav === "explorar" ? " c3-movil__nav-item--activo" : ""}`}>Explorar</Link>
          <Link href="/trayectoria" aria-current={nav === "trayectoria" ? "page" : undefined} className={`c3-movil__nav-item${nav === "trayectoria" ? " c3-movil__nav-item--activo" : ""}`}>Trayectoria</Link>
        </nav>
      ) : null}
    </div>
  );
}
