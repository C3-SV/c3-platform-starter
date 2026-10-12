import Link from "next/link";

export default function NotFound() {
  return (
    <main className="c3-page" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
      <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Error 404</span>
      <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>No encontramos esta página</h1>
      <p style={{ color: "var(--c3-texto-suave)" }}>Puede que el reto haya sido retirado o que la dirección esté mal escrita.</p>
      <Link href="/explorar" className="c3-btn c3-btn--primario">Explorar experiencias</Link>
    </main>
  );
}
