"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { C3BrandMark } from "@/components/BrandMark";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import { proposalNextStep, proposalPresentation } from "@/lib/domain/proposals";
import type { CompanySpace } from "@/lib/server/companies";

/** V09 · Espacio de empresa. Solo muestra las organizaciones vinculadas a la persona autenticada. */
export function EmpresaPanel() {
  const { session, signOut } = useSession();
  const [space, setSpace] = useState<CompanySpace | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const signedIn = session.status === "signed-in";

  // Carga del espacio al entrar; las actualizaciones ocurren en la respuesta.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ space: CompanySpace }>("/api/empresa").then(
      (data) => {
        if (!active) return;
        setSpace(data.space);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar tu espacio. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn]);

  if (session.status === "loading") return <Pagina><p>Cargando…</p></Pagina>;
  if (session.status === "unavailable") return <Pagina><p role="alert">{session.message}</p></Pagina>;
  if (session.status === "signed-out") {
    return (
      <Pagina>
        <div className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
          <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Entrá para ver tu espacio de empresa</h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Usás tu cuenta de C3. C3 te vincula a tu organización después de revisar tu solicitud.</p>
          <Link href="/acceso?next=/empresa" className="c3-btn c3-btn--primario" style={{ alignSelf: "flex-start" }}>Entrar</Link>
        </div>
        <Como />
      </Pagina>
    );
  }

  if (loadError) {
    return <Pagina><div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div></Pagina>;
  }
  if (!space) return <Pagina><p style={{ color: "var(--c3-texto-suave)" }}>Cargando tu espacio…</p></Pagina>;

  const organizations = space.organizations;
  if (organizations.length === 0) {
    return (
      <Pagina email={session.user.email} onSignOut={() => void signOut()}>
        <div className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Tu cuenta todavía no está vinculada a una organización</h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>C3 revisa tu solicitud y te vincula cuando corresponda. Mientras tanto, podés proponer un problema.</p>
          <Link href="/empresa/proponer" className="c3-btn c3-btn--primario" style={{ alignSelf: "flex-start" }}>Proponer un challenge</Link>
        </div>
        <Como />
      </Pagina>
    );
  }

  const current = organizations.find((item) => item.id === activeId) ?? organizations[0];
  const challenges = space.challenges.filter((item) => item.organizationId === current.id);
  const proposals = space.proposals.filter((item) => item.organizationId === current.id);

  return (
    <Pagina email={session.user.email} onSignOut={() => void signOut()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Conecta · Para empresas</span>
          <h1 className="c3-titulo" style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 700 }}>{current.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
              Representás a {organizations.length} {organizations.length === 1 ? "organización" : "organizaciones"}.
            </span>
            {organizations.length > 1 ? (
              <>
                <label htmlFor="org" className="c3-visualmente-oculto">Organización activa</label>
                <select id="org" value={current.id} onChange={(event) => setActiveId(event.target.value)} className="c3-campo" style={{ width: "auto", minHeight: 40 }}>
                  {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </>
            ) : null}
          </div>
        </div>
        <Link href="/empresa/proponer" className="c3-btn c3-btn--primario">Proponer un challenge</Link>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Tus retos</h2>
        {challenges.length === 0 ? (
          <div style={{ background: "var(--c3-superficie)", border: "1px dashed var(--c3-borde-fuerte)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>Todavía no tenés más retos publicados</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Cuando C3 publique uno de tus problemas, aparece aquí.</span>
          </div>
        ) : (
          <div className="c3-grilla-tarjetas">
            {challenges.map((challenge) => (
              <article key={challenge.id} className="c3-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 6, background: "var(--c3-conecta)" }} />
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Conecta · Challenge</span>
                    <StatePill state={challenge.state} />
                  </div>
                  <span className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{challenge.title}</span>
                  <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--c3-borde)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontSize: 14 }}>
                      {challenge.submissions.length === 0 ? "Todavía no hay soluciones enviadas" : `${challenge.submissions.length} ${challenge.submissions.length === 1 ? "solución recibida" : "soluciones recibidas"}`}
                    </span>
                    {challenge.submissions.map((solution) => (
                      <div key={solution.id} style={{ background: "var(--c3-superficie-sutil)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {solution.name ?? "Sin nombre"} · {solution.mode === "team" ? "Equipo" : "Individual"}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>
                          Enviada {formatDateTime(solution.submittedAt) ?? ""}
                        </span>
                        <p style={{ fontSize: 14, lineHeight: 1.5 }}>{solution.text}</p>
                        {solution.links.map((link) => (
                          <a key={link} href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}>{link}</a>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {challenge.results ? (
                  <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Resultado publicado</span>
                    {challenge.results.rows.map((row) => (
                      <span key={row.label} style={{ fontSize: 14 }}>
                        {row.label}: {row.recognition ?? "sin reconocimiento"}{row.average !== null ? ` · promedio ${row.average.toFixed(1)}` : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Tus propuestas</h2>
        {proposals.length === 0 ? (
          <div className="c3-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay propuestas vinculadas a esta organización.</p>
          </div>
        ) : (
          <div className="c3-card" style={{ overflow: "hidden" }}>
            {proposals.map((proposal) => (
              <div key={proposal.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "18px 24px", borderTop: "1px solid var(--c3-borde)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Propuesta {proposal.reference}</span>
                  <StatePill state={proposalPresentation(proposal.status)} />
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{proposal.problem}</span>
                <span style={{ fontSize: 14 }}>{proposalNextStep(proposal.status)}</span>
                {proposal.status === "needs_changes" && proposal.reviewNote ? (
                  <div className="c3-alerta c3-alerta--advertencia"><strong>Ajustes pedidos</strong><span style={{ fontSize: 14, lineHeight: 1.5 }}>{proposal.reviewNote}</span></div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <Como />
    </Pagina>
  );
}

function Pagina({ children, email, onSignOut }: { children: ReactNode; email?: string | null; onSignOut?: () => void }) {
  return (
    <div>
      <header style={{ background: "var(--c3-navy)", padding: "0 clamp(16px, 4vw, 48px)" }}>
        <div style={{ maxWidth: 1276, margin: "0 auto", minHeight: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Link href="/" className="c3-logo" aria-label="C3, ir al inicio">
              <C3BrandMark className="c3-brand-mark--header" />
            </Link>
            <span className="c3-etiqueta" style={{ color: "var(--c3-conecta-claro)", borderLeft: "1px solid var(--c3-navy-claro)", paddingLeft: 20 }}>Espacio de empresa</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {email ? <span style={{ fontSize: 14, color: "var(--c3-texto-cabecera)" }}>{email}</span> : null}
            {onSignOut ? (
              <button type="button" className="c3-etiqueta" onClick={onSignOut} style={{ background: "none", border: 0, color: "#ffffff", cursor: "pointer", padding: "12px 8px" }}>Salir</button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="c3-page" style={{ maxWidth: 1276, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 40px) clamp(16px, 4vw, 48px)" }}>
        {children}
      </main>
    </div>
  );
}

function Como() {
  return (
    <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Cómo funciona</h2>
      <div className="c3-dos-columnas-cuatro" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 24 }}>
        {[
          ["Proponés la necesidad", "Con tus palabras, sin brief perfecto."],
          ["C3 define el reto contigo", "Alcance, entregables y rúbrica."],
          ["Equipos entregan soluciones", "Las ves lado a lado en tu espacio."],
          ["Evaluás y C3 publica", "Resultado oficial sobre la misma rúbrica."],
        ].map(([title, text], index) => (
          <div key={title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--c3-conecta)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{index + 1}</div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
