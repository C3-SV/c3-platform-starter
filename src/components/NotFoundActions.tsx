"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";

/** 404 exits: always Explore and the home page; with a session, also Mi C3 so the person stays inside the app. */
export function NotFoundActions() {
  const { session } = useSession();
  return (
    <div className="c3-actions" style={{ justifyContent: "center", paddingTop: 8 }}>
      <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar experiencias <span className="c3-arrow" aria-hidden="true">↗</span></Link>
      {session.status === "signed-in" ? (
        <Link href="/mi-c3" className="c3-btn c3-btn--contorno">Ir a Mi C3</Link>
      ) : (
        <Link href="/" className="c3-btn c3-btn--contorno">Volver al inicio</Link>
      )}
    </div>
  );
}
