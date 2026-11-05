"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/AuthProvider";
import { loginHref } from "@/lib/domain/navigation";

/** Footer account links: sign in and sign up for visitors, Mi C3 once signed in. Nothing while the session loads. */
export function FooterAccountLinks() {
  const { session } = useSession();
  if (session.status === "loading") return null;
  if (session.status === "signed-in") {
    return (
      <ul>
        <li><Link href="/mi-c3">Mi C3</Link></li>
      </ul>
    );
  }
  return (
    <ul>
      <li><Link href={loginHref()}>Iniciar sesión</Link></li>
      <li><Link href={loginHref({ mode: "registro" })}>Crear cuenta</Link></li>
    </ul>
  );
}
