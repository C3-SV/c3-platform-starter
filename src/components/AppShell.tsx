"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { C3BrandMark } from "@/components/BrandMark";
import { RequiereSesion } from "@/components/RequiereSesion";
import { SiteShell } from "@/components/SiteShell";
import { UserMenu } from "@/components/UserMenu";
import { useSession } from "@/lib/auth/AuthProvider";
import { appNavigation, NO_CAPABILITIES, type AccessLink } from "@/lib/domain/capabilities";

export type AppSection = AccessLink["id"];

/** Barra inferior en teléfono y tablet: siempre las mismas cuatro puertas de la persona. */
const TABS: { id: AppSection; label: string; href: string }[] = [
  { id: "mi-c3", label: "Mi C3", href: "/mi-c3" },
  { id: "explorar", label: "Explorar", href: "/explorar" },
  { id: "trayectoria", label: "Trayectoria", href: "/trayectoria" },
  { id: "cuenta", label: "Cuenta", href: "/cuenta" },
];

/** Sección de la app a la que pertenece una ruta; las pantallas de otro origen (p. ej. inscripción) la indican con `active`. */
export function sectionOf(pathname: string): AppSection | null {
  if (pathname.startsWith("/mi-c3")) return "mi-c3";
  if (pathname.startsWith("/trayectoria")) return "trayectoria";
  if (pathname.startsWith("/cuenta")) return "cuenta";
  if (pathname.startsWith("/empresa")) return "empresa";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/explorar")) return "explorar";
  return null;
}

export interface SignedOutCopy {
  title: string;
  text: string;
  /** Contenido público que conviene mostrar aunque no haya sesión (p. ej. el resumen del challenge). */
  children?: ReactNode;
}

/**
 * Marco de la app autenticada («app»): una sola cabecera para Mi C3, Trayectoria, Cuenta, Espacio de empresa y las
 * tareas (entrega, inscripción, evaluación).
 * - Desde 1024 px: cabecera superior con la navegación (más «Mi empresa» y «Admin» si la cuenta los tiene) y el menú de la cuenta.
 * - Por debajo: barra superior mínima y barra inferior de cuatro pestañas (Mi C3 · Explorar · Trayectoria · Cuenta).
 * - Sin sesión: la misma pantalla pide entrar y vuelve aquí (`next`), dentro del marco público.
 * El contenido usa todo el ancho útil: cada vista decide su composición; no hay un marco de teléfono centrado.
 */
export function AppShell({ children, active, signedOut }: { children: ReactNode; active?: AppSection | null; signedOut: SignedOutCopy }) {
  const { session } = useSession();
  const pathname = usePathname();
  const section = active === undefined ? sectionOf(pathname) : active;

  if (session.status === "signed-out") {
    return (
      <SiteShell>
        <main id="contenido" className="c3-page c3-ancho">
          <RequiereSesion title={signedOut.title} text={signedOut.text}>{signedOut.children}</RequiereSesion>
        </main>
      </SiteShell>
    );
  }

  const user = session.status === "signed-in" ? session.user : null;
  const capabilities = user ? user.capabilities ?? { ...NO_CAPABILITIES, admin: user.isAdmin } : NO_CAPABILITIES;
  const navigation = appNavigation(capabilities);
  const ready = session.status === "signed-in";

  return (
    <div className="c3-app">
      <header className="c3-cabecera c3-cabecera--app">
        <div className="c3-cabecera__interior c3-cabecera__interior--app">
          <div className="c3-cabecera__principal">
            <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
              <C3BrandMark className="c3-brand-mark--header" priority />
            </Link>
            <nav aria-label="Principal" className="c3-nav-principal">
              {navigation.map((item) => (
                <Link key={item.id} href={item.href} className="c3-cabecera__enlace" aria-current={section === item.id ? "page" : undefined}>{item.label}</Link>
              ))}
            </nav>
          </div>
          <div className="c3-cabecera__acciones">{ready ? <UserMenu /> : null}</div>
        </div>
      </header>

      <div className="c3-app__barra">
        <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
          <C3BrandMark className="c3-brand-mark--mobile" priority />
        </Link>
        {ready ? <UserMenu /> : null}
      </div>

      <main id="contenido" className="c3-app__contenido">
        {session.status === "signed-in" ? children : session.status === "unavailable" ? (
          <div className="c3-ancho c3-app__estado"><p role="alert" className="c3-alerta c3-alerta--error">{session.message}</p></div>
        ) : (
          <div className="c3-ancho c3-app__estado"><p role="status" className="c3-app__cargando">Cargando…</p></div>
        )}
      </main>

      <nav aria-label="Navegación móvil" className="c3-app__tabs">
        {TABS.map((tab) => (
          <Link key={tab.id} href={tab.href} aria-current={section === tab.id ? "page" : undefined} className={`c3-app__tab${section === tab.id ? " c3-app__tab--activo" : ""}`}>{tab.label}</Link>
        ))}
      </nav>
    </div>
  );
}
