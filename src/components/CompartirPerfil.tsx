"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/auth/AuthProvider";
import { absolutePublicUrl, copyText, usePublicProfile } from "@/lib/client/usePublicProfile";

/**
 * «Compartir perfil» de Trayectoria: muestra si el perfil público está activo y, si lo está, el enlace para
 * compartirlo. Activarlo o ajustar qué se muestra se hace en Cuenta (una sola fuente de la configuración).
 */
export function CompartirPerfil() {
  const { session } = useSession();
  const { profile, error } = usePublicProfile(session.status === "signed-in");
  const [notice, setNotice] = useState<string | null>(null);

  if (error) return <p className="c3-tray__aviso" role="alert">{error}</p>;
  if (!profile) return null;

  if (!profile.enabled || !profile.path) {
    return (
      <div className="c3-tray__compartir">
        <p className="c3-tray__aviso">Tu perfil es privado. Podés activar un perfil público para compartir tu trayectoria con un enlace.</p>
        <Link href="/cuenta#perfil-publico" className="c3-tray__chip">Activar en Cuenta</Link>
      </div>
    );
  }

  const url = absolutePublicUrl(profile.path);
  return (
    <div className="c3-tray__compartir">
      <p className="c3-tray__aviso">Tu perfil público está activo: cualquiera con el enlace ve lo que elegiste compartir.</p>
      <div className="c3-tray__acciones">
        <button type="button" className="c3-tray__chip" onClick={() => void copyText(url).then((ok) => setNotice(ok ? "Enlace copiado." : "No pudimos copiarlo: abrí el perfil y copiá la dirección."))}>Copiar enlace</button>
        <Link href={profile.path} className="c3-tray__chip">Ver perfil público</Link>
        <Link href="/cuenta#perfil-publico" className="c3-tray__chip c3-tray__chip--editar">Qué comparto</Link>
      </div>
      {notice ? <p className="c3-tray__aviso" role="status">{notice}</p> : null}
    </div>
  );
}
