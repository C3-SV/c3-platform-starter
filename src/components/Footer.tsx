import Link from "next/link";
import { C3BrandMark } from "@/components/BrandMark";
import { FooterAccountLinks } from "@/components/FooterAccountLinks";

/** Site footer: brand and founding date, then links to participate, for companies and for the account. */
export function Footer() {
  return (
    <footer className="c3-footer">
      <div className="c3-frame">
        <div className="c3-footer__grid">
          <div className="c3-footer__brand">
            <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
              <C3BrandMark className="c3-brand-mark--footer" tone="white" />
            </Link>
            <p>Competitive Coding Club · El Salvador. Fundado en octubre de 2024.</p>
          </div>
          <nav aria-label="Participa">
            <h2>Participa</h2>
            <ul>
              <li><Link href="/explorar">Explorar challenges</Link></li>
              <li><Link href="/compite">Compite</Link></li>
              <li><Link href="/crea">Crea</Link></li>
              <li><Link href="/conecta">Conecta</Link></li>
            </ul>
          </nav>
          <nav aria-label="Empresas">
            <h2>Empresas</h2>
            <ul>
              <li><Link href="/empresa/proponer">Proponer un challenge</Link></li>
              <li><Link href="/conecta">Cómo funciona Conecta</Link></li>
            </ul>
          </nav>
          <nav aria-label="Tu cuenta">
            <h2>Tu cuenta</h2>
            <FooterAccountLinks />
          </nav>
        </div>
        <div className="c3-footer__base">
          <span>© 2026 C3 · Competitive Coding Club</span>
          <span>Hecho en El Salvador</span>
        </div>
      </div>
    </footer>
  );
}
