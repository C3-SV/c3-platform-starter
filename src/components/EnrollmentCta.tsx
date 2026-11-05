"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";

/**
 * Enrollment call to action on the challenge (V03) and experience pages. A visitor goes through sign in (V04) and
 * comes back; a signed-in person goes straight to enrollment (V06). `closedLabel` says why enrollment is closed.
 */
export function EnrollmentCta({
  enrollHref,
  registrationOpen,
  variant,
  label = "Inscribirme al challenge",
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
      <Link href={enrollHref} className="c3-btn c3-btn--primario">
        {label} <span className="c3-arrow" aria-hidden="true">↗</span>
      </Link>
    ) : (
      <Link href={enrollHref} className="c3-btn c3-btn--primario">
        Inscribirme
      </Link>
    );
  }

  if (variant === "hero") {
    return (
      <Link href={`/acceso?modo=registro&next=${next}`} className="c3-btn c3-btn--primario">
        {label} <span className="c3-arrow" aria-hidden="true">↗</span>
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Link href={`/acceso?modo=registro&next=${next}`} className="c3-btn c3-btn--primario">
        Crear cuenta e inscribirme
      </Link>
      <Link href={`/acceso?next=${next}`} className="c3-btn c3-btn--contorno">
        Ya tengo cuenta
      </Link>
    </div>
  );
}
