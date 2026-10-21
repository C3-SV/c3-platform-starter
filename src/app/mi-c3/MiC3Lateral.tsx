import Link from "next/link";
import { initialsOf } from "@/components/MovilShell";
import type { SessionUser } from "@/lib/auth/AuthProvider";

const LINES = [
  { href: "/compite", label: "Compite", className: "c3-mi-c3__linea--compite" },
  { href: "/crea", label: "Crea", className: "c3-mi-c3__linea--crea" },
  { href: "/conecta", label: "Conecta", className: "c3-mi-c3__linea--conecta" },
];

/**
 * Columna secundaria de Mi C3: resumen de la cuenta (solo datos de la sesión) y accesos.
 * En móvil queda debajo del contenido principal; en escritorio, a su derecha.
 */
export function MiC3Lateral({ user }: { user: SessionUser }) {
  const name = user.displayName?.trim() || user.email || "Tu cuenta";
  return (
    <aside className="c3-mi-c3__lateral" aria-label="Tu cuenta y accesos">
      <section className="c3-card c3-mi-c3__panel" aria-labelledby="mi-c3-perfil">
        <div className="c3-mi-c3__perfil">
          <span aria-hidden="true" className="c3-mi-c3__avatar">{initialsOf(user.displayName, user.email)}</span>
          <div className="c3-mi-c3__perfil-datos">
            <h2 id="mi-c3-perfil" className="c3-titulo c3-mi-c3__perfil-nombre">{name}</h2>
            {user.email && user.email !== name ? <span className="c3-mi-c3__perfil-correo">{user.email}</span> : null}
          </div>
        </div>
        <div className="c3-mi-c3__perfil-estado">
          <span className={`c3-pill c3-pill--${user.emailVerified ? "exito" : "advertencia"}`}>{user.emailVerified ? "Correo verificado" : "Correo sin verificar"}</span>
          {user.isAdmin ? <span className="c3-pill c3-pill--info">Administración C3</span> : null}
        </div>
      </section>

      <nav className="c3-card c3-mi-c3__panel" aria-labelledby="mi-c3-accesos">
        <h2 id="mi-c3-accesos" className="c3-titulo c3-mi-c3__panel-titulo">Accesos</h2>
        <ul className="c3-mi-c3__accesos">
          <li>
            <Link href="/cuenta" className="c3-mi-c3__acceso"><strong>Cuenta</strong><span>Tu perfil, tu contraseña y tu correo</span></Link>
          </li>
          <li>
            <Link href="/trayectoria" className="c3-mi-c3__acceso"><strong>Trayectoria</strong><span>Tu perfil público y lo que C3 registró de vos</span></Link>
          </li>
          <li>
            <Link href="/explorar" className="c3-mi-c3__acceso"><strong>Explorar</strong><span>Experiencias y retos con inscripción abierta</span></Link>
          </li>
          {user.isAdmin ? (
            <li>
              <Link href="/admin" className="c3-mi-c3__acceso"><strong>Administración</strong><span>Catálogo, inscripciones, jurados y resultados</span></Link>
            </li>
          ) : null}
        </ul>
        <div className="c3-mi-c3__lineas">
          <span className="c3-mi-c3__lineas-titulo">Explorar por línea</span>
          <ul>
            {LINES.map((line) => (
              <li key={line.href}>
                <Link href={line.href} className={`c3-mi-c3__linea ${line.className}`}>{line.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
