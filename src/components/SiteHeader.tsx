"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { C3BrandMark } from "@/components/BrandMark";
import { UserMenu } from "@/components/UserMenu";
import { useSession } from "@/lib/auth/AuthProvider";
import { loginHref } from "@/lib/domain/navigation";

const LINES = [
  { href: "/compite", label: "Compite" },
  { href: "/crea", label: "Crea" },
  { href: "/conecta", label: "Conecta" },
] as const;

/**
 * Cabecera de la zona pública («sitio»). El logotipo es el inicio: no hay un ítem «Inicio» aparte.
 * Desde 900 px la navegación va en línea; por debajo, un botón «Menú» abre un panel con las mismas opciones
 * (las líneas Compite · Crea · Conecta agrupadas) y la barra se queda en una sola fila de ~60 px.
 * Con sesión, el menú de la cuenta reemplaza a los textos sueltos de antes (Mi C3, Cuenta, Trayectoria, Admin, Salir).
 * La variante «mínima» es la de la pantalla de acceso.
 */
export function SiteHeader({ variant = "completa" }: { variant?: "completa" | "minima" }) {
  const { session } = useSession();
  const pathname = usePathname();
  const menuId = useId();
  // Como en UserMenu: se recuerda la página en la que se abrió para que navegar lo cierre.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  if (variant === "minima") {
    return (
      <header className="c3-cabecera">
        <div className="c3-cabecera__interior">
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--header" priority />
          </Link>
          <Link href="/explorar" className="c3-cabecera__enlace">Seguir explorando sin cuenta</Link>
        </div>
      </header>
    );
  }

  const signedIn = session.status === "signed-in";
  const here = loginHref({ next: pathname });
  const registerHere = loginHref({ mode: "registro", next: pathname });
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <header className="c3-cabecera c3-cabecera--sitio">
      <div className="c3-cabecera__interior c3-cabecera__interior--sitio">
        <Link href="/" className="c3-logo c3-cabecera--sitio__logo" aria-label="C3, ir al inicio">
          <C3BrandMark className="c3-brand-mark--header" priority />
        </Link>

        <nav id={menuId} aria-label="Principal" className={`c3-nav-sitio${open ? " c3-nav-sitio--abierto" : ""}`}>
          <Link href="/explorar" className="c3-cabecera__enlace" aria-current={current("/explorar")}>Explorar</Link>
          <span className="c3-nav-sitio__lineas">
            <span className="c3-nav-sitio__grupo">Líneas</span>
            {LINES.map((line) => (
              <Link key={line.href} href={line.href} className="c3-cabecera__enlace" aria-current={current(line.href)}>{line.label}</Link>
            ))}
          </span>
          <Link href="/empresa/proponer" className="c3-cabecera__enlace" aria-current={current("/empresa/proponer")}>Para empresas</Link>
          {!signedIn && session.status !== "loading" ? (
            <Link href={registerHere} className="c3-cabecera__enlace c3-nav-sitio__solo-movil">Crear cuenta</Link>
          ) : null}
        </nav>

        <div className="c3-cabecera__acciones c3-cabecera--sitio__acciones">
          {signedIn ? (
            <UserMenu />
          ) : session.status === "loading" ? null : (
            <>
              <Link href={here} className="c3-etiqueta c3-cabecera__texto-etiqueta">Entrar</Link>
              <Link href={registerHere} className="c3-etiqueta c3-btn c3-btn--primario c3-cabecera__registro c3-cabecera--sitio__registro">
                Crear cuenta
              </Link>
            </>
          )}
          <button
            type="button"
            className="c3-cabecera__hamburguesa"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            <span aria-hidden="true" className="c3-cabecera__hamburguesa-icono" />
            <span className="c3-etiqueta">Menú</span>
          </button>
        </div>
      </div>
    </header>
  );
}
