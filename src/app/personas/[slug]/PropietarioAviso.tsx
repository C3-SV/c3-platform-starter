"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest } from "@/lib/client/api";
import type { MyPublicProfile } from "@/lib/server/publicProfiles";

/**
 * Notice only for the profile owner: confirms this is the public view and links to adjust what is shared.
 * Nobody else sees it; the profile never reveals who is looking.
 */
export function PropietarioAviso({ slug }: { slug: string }) {
  const { session } = useSession();
  const signedIn = session.status === "signed-in";
  const [mine, setMine] = useState<MyPublicProfile | null>(null);

  // The response updates state; nothing is set synchronously inside the effect.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ publicProfile: MyPublicProfile }>("/api/perfil/publico").then(
      (data) => {
        if (active) setMine(data.publicProfile);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [signedIn]);

  if (!signedIn || !mine || mine.slug !== slug) return null;
  return (
    <div className="c3-alerta c3-alerta--info" role="status">
      <strong>Así ve tu perfil el público</strong>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>
        Solo lo que elegiste compartir. <Link href="/cuenta#perfil-publico">Cambiar qué compartes o desactivarlo</Link>.
      </span>
    </div>
  );
}
