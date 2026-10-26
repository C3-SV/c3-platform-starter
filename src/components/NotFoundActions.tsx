"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";

/** Salidas del 404: siempre Explorar; con sesión, también Mi C3 (la persona sigue dentro de la plataforma). */
export function NotFoundActions() {
  const { session } = useSession();
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
      <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar experiencias</Link>
      {session.status === "signed-in" ? <Link href="/mi-c3" className="c3-btn c3-btn--contorno">Ir a Mi C3</Link> : null}
    </div>
  );
}
