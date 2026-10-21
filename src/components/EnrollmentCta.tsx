"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";

/**
 * Llamado a la inscripción de V03 (reto) y de la página de experiencia. Un visitante pasa por V04 y vuelve a la
 * inscripción. Una persona con sesión va directamente a V06. `closedLabel` explica por qué no se puede entrar.
 */
export function EnrollmentCta({
  enrollHref,
  registrationOpen,
  variant,
  label = "Inscribirme al reto",
  closedLabel = "Inscripciones cerradas",
}: {
  enrollHref: string;
  registrationOpen: boolean;
  variant: "hero" | "aside";
  label?: string;
  closedLabel?: string;
}) {
  const { session } = useSession();
  const next = encodeURIComponent(enrollHref);

  if (session.status === "loading") {
    return <span className="c3-btn c3-btn--contorno" aria-busy="true" aria-disabled="true">Cargando…</span>;
  }

  if (!registrationOpen) {
    return <span className="c3-btn" aria-disabled="true">{closedLabel}</span>;
  }

  if (session.status === "signed-in") {
    return variant === "hero" ? (
      <Link href={enrollHref} className="c3-btn c3-btn--primario" style={{ padding: "16px 28px", marginLeft: "auto" }}>
        {label}
      </Link>
    ) : (
      <Link href={enrollHref} className="c3-btn c3-btn--primario" style={{ padding: "16px 20px" }}>
        Inscribirme
      </Link>
    );
  }

  if (variant === "hero") {
    return (
      <Link href={`/acceso?modo=registro&next=${next}`} className="c3-btn c3-btn--primario" style={{ padding: "16px 28px", marginLeft: "auto" }}>
        {label}
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
