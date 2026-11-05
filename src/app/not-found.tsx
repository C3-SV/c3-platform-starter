import type { Metadata } from "next";
import { NotFoundActions } from "@/components/NotFoundActions";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = { title: "No encontramos esta página" };

/** 404 inside the site header and footer, so the person always has a way back. */
export default function NotFound() {
  return (
    <SiteShell>
      <main id="contenido" className="c3-not-found">
        <div className="c3-frame c3-not-found__content">
          <span className="c3-not-found__code">Error 404</span>
          <h1>No encontramos esta página</h1>
          <p>Puede que el challenge haya sido retirado o que la dirección esté mal escrita.</p>
          <NotFoundActions />
        </div>
      </main>
    </SiteShell>
  );
}
