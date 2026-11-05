"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { C3BrandMark } from "@/components/BrandMark";
import { UserMenu } from "@/components/UserMenu";
import { useSession } from "@/lib/auth/AuthProvider";
import { loginHref } from "@/lib/domain/navigation";

const LINES = [
  { href: "/compite", label: "Compite", text: "Competencias y challenges técnicos", dot: "c3-dot--compite" },
  { href: "/crea", label: "Crea", text: "Ideas que se vuelven proyectos", dot: "c3-dot--crea" },
  { href: "/conecta", label: "Conecta", text: "Tu trabajo, visible para empresas", dot: "c3-dot--conecta" },
] as const;

/**
 * Public site header. The logo is the way home; Compite, Crea and Conecta live under the "Conoce C3" dropdown.
 * Below 900 px a "Menú" button opens a panel with the same links. The "minima" variant is the sign-in page one.
 */
export function SiteHeader({ variant = "completa" }: { variant?: "completa" | "minima" }) {
  const { session } = useSession();
  const pathname = usePathname();
  const menuId = useId();
  const linesId = useId();
  const linesRef = useRef<HTMLDivElement>(null);
  // Both panels remember the page they were opened on, so navigating closes them.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const [linesOpenOn, setLinesOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const linesOpen = linesOpenOn === pathname;

  useEffect(() => {
    if (!linesOpen) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!linesRef.current?.contains(event.target as Node)) setLinesOpenOn(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLinesOpenOn(null);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [linesOpen]);

  if (variant === "minima") {
    return (
      <header className="c3-site-header">
        <div className="c3-frame c3-site-header__row" style={{ justifyContent: "space-between" }}>
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--header" priority />
          </Link>
          <Link href="/explorar" className="c3-site-link">Seguir explorando sin cuenta <span className="c3-arrow" aria-hidden="true">↗</span></Link>
        </div>
      </header>
    );
  }

  const signedIn = session.status === "signed-in";
  const signedOut = !signedIn && session.status !== "loading";
  const here = loginHref({ next: pathname });
  const registerHere = loginHref({ mode: "registro", next: pathname });
  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);
  const onLinePage = LINES.some((line) => current(line.href));

  return (
    <header className="c3-site-header">
      <div className="c3-frame">
        <div className="c3-site-header__row">
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--header" priority />
          </Link>

          <nav aria-label="Principal" className="c3-site-nav">
            <Link href="/explorar" className="c3-site-link" aria-current={current("/explorar")}>Explorar</Link>
            <div className="c3-dropdown" ref={linesRef}>
              <button
                type="button"
                className={`c3-site-link${onLinePage ? " c3-site-link--active" : ""}`}
                aria-expanded={linesOpen}
                aria-controls={linesId}
                onClick={() => setLinesOpenOn(linesOpen ? null : pathname)}
              >
                Conoce C3 <span className="c3-chevron" aria-hidden="true" />
              </button>
              {linesOpen ? (
                <div className="c3-dropdown__panel" id={linesId}>
                  {LINES.map((line) => (
                    <Link key={line.href} href={line.href} aria-current={current(line.href)} aria-describedby={`${linesId}${line.label}`}>
                      <span className={`c3-dot ${line.dot}`} aria-hidden="true" />
                      <b>{line.label}</b>
                      <small id={`${linesId}${line.label}`} aria-hidden="true">{line.text}</small>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <Link href="/empresa/proponer" className="c3-site-link" aria-current={current("/empresa/proponer")}>Para empresas</Link>
          </nav>

          <div className="c3-site-actions">
            {signedIn ? <UserMenu /> : null}
            {signedOut ? (
              <>
                <Link href={here} className="c3-site-link">Iniciar sesión</Link>
                <Link href={registerHere} className="c3-btn c3-btn--primario">Crear cuenta</Link>
              </>
            ) : null}
            <button
              type="button"
              className="c3-site-menu-button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpenOn(menuOpen ? null : pathname)}
            >
              <span className="c3-site-menu-button__icon" aria-hidden="true" />
              Menú
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav aria-label="Principal" className="c3-site-mobile-panel" id={menuId}>
            <Link href="/explorar" aria-current={current("/explorar")}>Explorar</Link>
            <div className="c3-site-mobile-panel__group">Conoce C3</div>
            {LINES.map((line) => (
              <Link key={line.href} href={line.href} aria-current={current(line.href)}>{line.label}</Link>
            ))}
            <Link href="/empresa/proponer" aria-current={current("/empresa/proponer")}>Para empresas</Link>
            {signedOut ? (
              <div className="c3-site-mobile-panel__buttons">
                <Link href={here} className="c3-btn c3-btn--contorno">Iniciar sesión</Link>
                <Link href={registerHere} className="c3-btn c3-btn--primario">Crear cuenta</Link>
              </div>
            ) : null}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
