"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { C3BrandMark } from "@/components/BrandMark";
import { UserMenu } from "@/components/UserMenu";
import { ADMIN_SECTIONS, adminHref, adminSectionOf, parseAdminSection, pendingFor, type AdminSectionId } from "@/lib/domain/admin-nav";
import { AdminDataProvider, useAdminData } from "./AdminData";

function currentSection(pathname: string): AdminSectionId {
  return parseAdminSection(pathname.split("/")[2]) ?? "resumen";
}

/**
 * Marco de la consola de administración («consola»): cabecera con el logotipo, la sección actual, atajos al sitio y a
 * Mi C3, y menú lateral con contadores de pendientes. Pensada para escritorio; en pantallas pequeñas el menú se
 * pliega en un botón con la sección actual y sigue siendo usable.
 */
export function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <AdminDataProvider>
      <Marco>{children}</Marco>
    </AdminDataProvider>
  );
}

function Marco({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { pending } = useAdminData();
  const menuId = useId();
  // Se recuerda la página en la que se abrió para que navegar a otra sección lo pliegue.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const section = adminSectionOf(currentSection(pathname));

  return (
    <div className="c3-admin">
      <header className="c3-cabecera c3-cabecera--admin">
        <div className="c3-cabecera__interior c3-cabecera__interior--admin">
          <div className="c3-cabecera__principal">
            <Link href="/" className="c3-logo" aria-label="C3, ir al sitio">
              <C3BrandMark className="c3-brand-mark--header" priority />
            </Link>
            <nav aria-label="Ruta de navegación" className="c3-admin__ruta">
              <Link href={adminHref("resumen")}>Admin</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{section.label}</span>
            </nav>
          </div>
          <div className="c3-cabecera__acciones">
            <Link href="/" className="c3-cabecera__enlace c3-admin__atajo">Ver sitio</Link>
            <Link href="/mi-c3" className="c3-cabecera__enlace c3-admin__atajo">Mi C3</Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="c3-admin__cuerpo">
        <div className="c3-admin__lateral">
          <button
            type="button"
            className="c3-admin__menu-boton c3-btn c3-btn--contorno"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            <span>Sección: <strong>{section.label}</strong></span>
            <span aria-hidden="true">{open ? "▴" : "▾"}</span>
          </button>
          <nav id={menuId} aria-label="Secciones de administración" className={`c3-card c3-admin__menu${open ? " c3-admin__menu--abierto" : ""}`}>
            {ADMIN_SECTIONS.map((item) => {
              const count = pendingFor(item.id, pending);
              return (
                <Link key={item.id} href={adminHref(item.id)} aria-current={item.id === section.id ? "page" : undefined} className="c3-admin__enlace">
                  <span>{item.label}</span>
                  {count > 0 ? <span className="c3-admin__contador" aria-label={`${count} por atender`}>{count}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <main id="contenido" className="c3-admin__contenido">{children}</main>
      </div>
    </div>
  );
}
