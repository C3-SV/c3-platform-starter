import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Marco de la zona pública («sitio»): cabecera, contenido y pie. Las páginas aportan su propio `<main id="contenido">`
 * para conservar su composición; el marco garantiza que todas compartan cabecera y pie (antes solo la Home y las
 * tres líneas tenían pie).
 */
export function SiteShell({ children, header = "completa" }: { children: ReactNode; header?: "completa" | "minima" }) {
  return (
    <div className="c3-sitio">
      <SiteHeader variant={header} />
      {children}
      <Footer />
    </div>
  );
}
