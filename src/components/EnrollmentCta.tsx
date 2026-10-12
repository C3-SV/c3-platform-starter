"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";

/**
 * Llamado a la inscripción de V03. Para visitantes lleva a V04 y vuelve al reto.
 * La inscripción real llega en el Corte 2: hasta entonces, una cuenta ve el estado explícito, no un botón falso.
 */
export function EnrollmentCta({
  challengeId,
  registrationOpen,
  variant,
}: {
  challengeId: string;
  registrationOpen: boolean;
  variant: "hero" | "aside";
}) {
  const { session } = useSession();
  const next = encodeURIComponent(`/retos/${challengeId}`);

  if (session.status === "loading") {
    return <span className="c3-btn c3-btn--contorno" aria-busy="true" aria-disabled="true">Cargando…</span>;
  }

  if (!registrationOpen) {
    return <span className="c3-btn" aria-disabled="true">Inscripciones cerradas</span>;
  }

  if (session.status === "signed-in") {
    return (
      <span className="c3-btn" aria-disabled="true" title="Disponible en el siguiente corte">
        Inscripción próximamente
      </span>
    );
  }

  if (variant === "hero") {
    return (
      <Link href={`/acceso?modo=registro&next=${next}`} className="c3-btn c3-btn--primario" style={{ padding: "16px 28px", marginLeft: "auto" }}>
        Inscribirme al reto
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Link href={`/acceso?modo=registro&next=${next}`} className="c3-btn c3-btn--primario" style={{ padding: "16px 20px" }}>
        Crear cuenta e inscribirme
      </Link>
      <Link href={`/acceso?next=${next}`} className="c3-btn c3-btn--contorno" style={{ padding: "16px 20px" }}>
        Ya tengo cuenta
      </Link>
    </div>
  );
}
