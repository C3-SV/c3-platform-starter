"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "@/lib/auth/AuthProvider";
import { useSignOut } from "@/lib/auth/useSignOut";
import { accountMenu, NO_CAPABILITIES } from "@/lib/domain/capabilities";
import { initialsOf } from "@/lib/domain/format";

/**
 * Menú de la cuenta (avatar). Es el mismo en las tres zonas —sitio, app y consola—: Mi C3, Trayectoria y Cuenta,
 * más los espacios que la cuenta tiene (empresa, administración) y «Salir». Patrón de divulgación: un botón que
 * abre una lista de enlaces; se cierra con Escape, al hacer clic fuera o al cambiar de página.
 */
export function UserMenu() {
  const { session } = useSession();
  const signOut = useSignOut();
  const pathname = usePathname();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // Se recuerda en qué página se abrió: al navegar, `open` pasa a false sin escribir estado desde un efecto.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpenOn(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenOn(null);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (session.status !== "signed-in") return null;
  const user = session.user;
  const name = user.displayName?.trim() || user.email || "Tu cuenta";
  const capabilities = user.capabilities ?? { ...NO_CAPABILITIES, admin: user.isAdmin };
  const items = accountMenu(capabilities);

  return (
    <div className="c3-usuario" ref={root}>
      <button
        ref={button}
        type="button"
        className="c3-usuario__boton"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Menú de la cuenta de ${name}`}
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        <span aria-hidden="true" className="c3-cabecera__avatar">{initialsOf(user.displayName, user.email)}</span>
        <span aria-hidden="true" className="c3-usuario__nombre">{name}</span>
        <span aria-hidden="true" className="c3-usuario__flecha">▾</span>
      </button>
      {open ? (
        <div id={panelId} className="c3-usuario__panel">
          <div className="c3-usuario__identidad">
            <strong>{name}</strong>
            {user.email && user.email !== name ? <span>{user.email}</span> : null}
          </div>
          <ul className="c3-usuario__lista">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="c3-usuario__enlace" aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className="c3-usuario__salir" onClick={() => void signOut()}>Salir</button>
        </div>
      ) : null}
    </div>
  );
}
