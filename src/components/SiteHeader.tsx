"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/AuthProvider";

/**
 * Cabecera pública de V01–V03 («completa») y de V04 («mínima»).
 * Las opciones de navegación solo aparecen cuando la ruta destino ya existe.
 */
export function SiteHeader({ variant = "completa" }: { variant?: "completa" | "minima" }) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (variant === "minima") {
    return (
      <header className="c3-cabecera">
        <div className="c3-cabecera__interior">
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">C3</Link>
          <Link href="/explorar" className="c3-cabecera__enlace">Seguir explorando sin cuenta</Link>
        </div>
      </header>
    );
  }

  const signedIn = session.status === "signed-in";

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="c3-cabecera">
      <div className="c3-cabecera__interior">
        <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">C3</Link>
          <nav aria-label="Principal" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Link href="/explorar" className="c3-cabecera__enlace" aria-current={pathname === "/explorar" ? "page" : undefined}>Explorar</Link>
            <Link href="/empresa/proponer" className="c3-cabecera__enlace" aria-current={pathname === "/empresa/proponer" ? "page" : undefined}>Para empresas</Link>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {signedIn ? (
            <>
              <Link href="/mi-c3" className="c3-etiqueta c3-cabecera__texto-etiqueta">Mi C3</Link>
              {session.user.isAdmin ? (
                <Link href="/admin" className="c3-etiqueta c3-cabecera__texto-etiqueta">Admin</Link>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                className="c3-etiqueta c3-cabecera__texto-etiqueta"
                style={{ background: "none", border: 0, cursor: "pointer" }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/acceso" className="c3-etiqueta c3-cabecera__texto-etiqueta">Entrar</Link>
              <Link href="/acceso?modo=registro" className="c3-etiqueta c3-btn c3-btn--primario" style={{ padding: "14px 20px", borderRadius: 12 }}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
