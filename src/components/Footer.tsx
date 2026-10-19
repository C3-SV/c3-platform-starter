/** Pie de V01. El texto es el de la vista; el dato de fundación viene del README del proyecto. */
import Link from "next/link";
import { C3BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer style={{ background: "var(--c3-navy)", padding: "40px clamp(16px, 4vw, 48px)" }}>
      <div className="c3-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
            <C3BrandMark className="c3-brand-mark--footer" />
          </Link>
          <span style={{ fontSize: 14, color: "#a9b8d0" }}>Competitive Coding Club · Fundado en octubre de 2024</span>
        </div>
        <nav aria-label="Pie de página" className="c3-footer__nav">
          <Link href="/compite">Compite</Link>
          <Link href="/crea">Crea</Link>
          <Link href="/conecta">Conecta</Link>
          <Link href="/explorar">Explorar</Link>
        </nav>
      </div>
    </footer>
  );
}
