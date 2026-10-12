/** Pie de V01. El texto es el de la vista; el dato de fundación viene del README del proyecto. */
export function Footer() {
  return (
    <footer style={{ background: "var(--c3-navy)", padding: "40px clamp(16px, 4vw, 48px)" }}>
      <div className="c3-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="c3-logo" style={{ fontSize: 22, fontWeight: 800 }}>C3</div>
          <span style={{ fontSize: 14, color: "#a9b8d0" }}>Competitive Coding Club · Fundado en octubre de 2024</span>
        </div>
      </div>
    </footer>
  );
}
