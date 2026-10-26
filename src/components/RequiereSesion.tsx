"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { loginHref } from "@/lib/domain/navigation";

/**
 * Pantalla para quien llega a una vista privada sin sesión: dice qué hace falta y ofrece entrar o crear la cuenta.
 * Al terminar, `next` devuelve a esta misma página (también la tarea de un jurado invitado por enlace).
 */
export function RequiereSesion({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  const pathname = usePathname();
  return (
    <section className="c3-card c3-requiere-sesion" aria-labelledby="requiere-sesion-titulo">
      <h1 id="requiere-sesion-titulo" className="c3-titulo">{title}</h1>
      <p>{text}</p>
      {children}
      <div className="c3-requiere-sesion__acciones">
        <Link href={loginHref({ next: pathname })} className="c3-btn c3-btn--primario">Entrar</Link>
        <Link href={loginHref({ mode: "registro", next: pathname })} className="c3-btn c3-btn--contorno">Crear cuenta</Link>
      </div>
    </section>
  );
}
