import Link from "next/link";

export interface Miga {
  label: string;
  /** La última miga (la página actual) no lleva enlace. */
  href?: string;
}

/**
 * Ruta de navegación para las pantallas a dos o más niveles (p. ej. Mi C3 › Mi challenge). Cada nivel anterior
 * es un enlace: el «volver» es contextual y no depende del historial del navegador.
 */
export function Migas({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="c3-migas">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !last ? <Link href={item.href}>{item.label}</Link> : <span aria-current={last ? "page" : undefined}>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
