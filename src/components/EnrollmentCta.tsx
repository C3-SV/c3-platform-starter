"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";

/**
 * Llamado a la inscripción de V03. Un visitante pasa por V04 y vuelve a la inscripción del reto.
 * Una persona con sesión va directamente a V06.
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
  const next = encodeURIComponent(`/retos/${challengeId}/inscripcion`);
  const inscribe = `/retos/${challengeId}/inscripcion`;

  if (session.status === "loading") {
    return <span className="c3-btn c3-btn--contorno" aria-busy="true" aria-disabled="true">Cargando…</span>;
  }

  if (!registrationOpen) {
    return <span className="c3-btn" aria-disabled="true">Inscripciones cerradas</span>;
  }

  if (session.status === "signed-in") {
    return variant === "hero" ? (
      <Link href={inscribe} className="c3-btn c3-btn--primario" style={{ padding: "16px 28px", marginLeft: "auto" }}>
        Inscribirme al reto
      </Link>
    ) : (
      <Link href={inscribe} className="c3-btn c3-btn--primario" style={{ padding: "16px 20px" }}>
        Inscribirme
      </Link>
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
