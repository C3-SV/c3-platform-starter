import Link from "next/link";
import { C3BrandMark } from "@/components/BrandMark";

export type PanelSection = "inicio" | "explorar" | "trayectoria" | null;

export interface PanelUser {
  name: string;
  initials: string;
  isAdmin: boolean;
}

/**
 * Cabecera de escritorio de los paneles de la persona (Mi C3). Reutiliza la cabecera navy de la plataforma
 * (`c3-cabecera`) con los accesos de la barra inferior móvil más la identidad, Cuenta y Salir.
 * Se muestra desde 1024 px; por debajo, el marco móvil usa su barra superior y su navegación inferior.
 */
export function PanelHeader({ activo, user, loading = false, onSignOut }: { activo: PanelSection; user: PanelUser | null; loading?: boolean; onSignOut: () => void }) {
  const current = (section: Exclude<PanelSection, null>) => (activo === section ? "page" : undefined);
  return (
    <header className="c3-cabecera c3-cabecera--panel">
      <div className="c3-cabecera__interior">
        <div className="c3-cabecera__principal">
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--header" />
          </Link>
          {loading ? null : user ? (
            <nav aria-label="Principal" className="c3-nav-principal">
              <Link href="/mi-c3" className="c3-cabecera__enlace" aria-current={current("inicio")}>Mi C3</Link>
              <Link href="/explorar" className="c3-cabecera__enlace" aria-current={current("explorar")}>Explorar</Link>
              <Link href="/trayectoria" className="c3-cabecera__enlace" aria-current={current("trayectoria")}>Trayectoria</Link>
            </nav>
          ) : (
            <nav aria-label="Principal" className="c3-nav-principal">
              <Link href="/explorar" className="c3-cabecera__enlace">Explorar</Link>
            </nav>
          )}
        </div>
        <div className="c3-cabecera__acciones">
          {loading ? null : user ? (
            <>
              {user.isAdmin ? <Link href="/admin" className="c3-etiqueta c3-cabecera__texto-etiqueta">Admin</Link> : null}
              <Link href="/cuenta" className="c3-cabecera__cuenta">
                <span aria-hidden="true" className="c3-cabecera__avatar">{user.initials}</span>
                <span className="c3-cabecera__cuenta-texto">
                  <span className="c3-cabecera__cuenta-nombre">{user.name}</span>
                  <span className="c3-cabecera__cuenta-ayuda">Mi cuenta</span>
                </span>
              </Link>
              <button type="button" onClick={onSignOut} className="c3-etiqueta c3-cabecera__texto-etiqueta">Salir</button>
            </>
          ) : (
            <>
              <Link href="/acceso" className="c3-etiqueta c3-cabecera__texto-etiqueta">Entrar</Link>
              <Link href="/acceso?modo=registro" className="c3-etiqueta c3-btn c3-btn--primario c3-cabecera__registro">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
