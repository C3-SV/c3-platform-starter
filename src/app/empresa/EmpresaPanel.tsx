"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { commercialPackageOf, formatUsd } from "@/lib/domain/commercial";
import { formatDeadline } from "@/lib/domain/format";
import { evaluationHref } from "@/lib/domain/navigation";
import { proposalNextStep, proposalPresentation } from "@/lib/domain/proposals";
import type { CompanySpace } from "@/lib/server/companies";
import { ConfiguracionChallenge } from "./ConfiguracionChallenge";
import { TalentoPanel } from "./TalentoPanel";

/** V09 · Espacio de empresa. Solo muestra las organizaciones vinculadas a la persona autenticada. */
export function EmpresaPanel() {
  return (
    <AppShell active="empresa" signedOut={{ title: "Entrá para ver tu espacio de empresa", text: "Usás tu cuenta de C3. C3 te vincula a tu organización después de revisar tu solicitud." }}>
      <EmpresaContenido />
    </AppShell>
  );
}

function EmpresaContenido() {
  const { session } = useSession();
  const [space, setSpace] = useState<CompanySpace | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [talentoId, setTalentoId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
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

  // Al abrir una sección de trabajo, se lleva la vista hasta ella.
  useEffect(() => {
    const target = talentoId ? "talento-seccion" : configId ? "configuracion-seccion" : null;
    if (!target) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(target)?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
  }, [talentoId, configId]);

  if (session.status !== "signed-in") return null;

  if (loadError) {
    return <Pagina><div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div></Pagina>;
  }
  if (!space) return <Pagina><p style={{ color: "var(--c3-texto-suave)" }}>Cargando tu espacio…</p></Pagina>;

  const organizations = space.organizations;
  if (organizations.length === 0) {
    return (
      <Pagina>
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
    <Pagina>
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {challenges.some((challenge) => challenge.submissions.length > 0) ? (
            <a href="#tus-challenges" className="c3-btn c3-btn--contorno">Ver entregas</a>
          ) : null}
          <Link href="/empresa/proponer" className="c3-btn c3-btn--primario">Proponer un challenge</Link>
        </div>
      </div>

      <nav aria-label="Secciones del espacio de empresa" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <a href="#tus-challenges" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 16px" }}>Resumen</a>
        <button
          type="button"
          className="c3-btn c3-btn--contorno"
          style={{ minHeight: 40, padding: "0 16px" }}
          disabled={!challenges.some((challenge) => challenge.submissions.length > 0)}
          onClick={() => setTalentoId(challenges.find((challenge) => challenge.submissions.length > 0)?.id ?? null)}
        >
          Talento
        </button>
        <a href="#tus-propuestas" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 16px" }}>Propuestas</a>
        <button
          type="button"
          className="c3-btn c3-btn--contorno"
          style={{ minHeight: 40, padding: "0 16px" }}
          disabled={challenges.length === 0}
          onClick={() => {
            setTalentoId(null);
            setConfigId(challenges[0]?.id ?? null);
          }}
        >
          Configuración
        </button>
      </nav>

      <section id="tus-challenges" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Tus challenges</h2>
        {challenges.length === 0 ? (
          <div style={{ background: "var(--c3-superficie)", border: "1px dashed var(--c3-borde-fuerte)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>Todavía no tenés challenges publicados</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Cuando C3 publique uno de tus problemas, aparece aquí.</span>
          </div>
        ) : (
          <div className="c3-res-tarjetas">
            {challenges.map((challenge) => {
              const pack = commercialPackageOf(challenge.commercialPackage);
              const hasSubmissions = challenge.submissions.length > 0;
              return (
                <article key={challenge.id} className="c3-res-tarjeta" data-activa={talentoId === challenge.id || configId === challenge.id} aria-label={challenge.title}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Conecta · Challenge empresarial</span>
                    <StatePill state={challenge.state} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <h3 className="c3-titulo" style={{ fontSize: 20, lineHeight: 1.3, fontWeight: 600 }}>{challenge.title}</h3>
                    {challenge.isDemo ? <span className="c3-etiqueta" style={{ color: "var(--c3-advertencia)" }}>DEMO · datos demostrativos</span> : null}
                  </div>
                  <dl aria-label="Cifras del challenge" className="c3-res-kpis">
                    {[
                      ["Inscritas", challenge.metrics.enrolled],
                      ["Entregas recibidas", challenge.metrics.submitted],
                      ["En evaluación", challenge.metrics.evaluating],
                      ["Perfiles de interés", challenge.metrics.shortlisted],
                    ].map(([label, value]) => (
                      <div key={label} className="c3-res-kpi">
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13, color: "var(--c3-texto-suave)" }}>
                    {challenge.submissionClosesAt ? <span>Próximo hito: cierre de entregas el {formatDeadline(challenge.submissionClosesAt) ?? ""}</span> : null}
                    {pack ? <span>Paquete de referencia: {pack.label} · {formatUsd(pack.referenceFeeUsd)} · simulación, sin cobro</span> : null}
                    <span>{hasSubmissions ? `${challenge.submissions.length} ${challenge.submissions.length === 1 ? "solución recibida" : "soluciones recibidas"}` : "Todavía no hay soluciones enviadas"}</span>
                  </div>
                  <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {hasSubmissions ? (
                      <button
                        type="button"
                        className="c3-btn c3-btn--primario"
                        aria-expanded={talentoId === challenge.id}
                        onClick={() => {
                          setConfigId(null);
                          setTalentoId(talentoId === challenge.id ? null : challenge.id);
                        }}
                      >
                        {talentoId === challenge.id ? "Ocultar talento" : "Ver talento y lista corta"}
                      </button>
                    ) : null}
                    {hasSubmissions ? (
                      challenge.evaluation.assigned ? (
                        <Link href={evaluationHref(challenge.id)} className="c3-btn c3-btn--contorno">Evaluar soluciones</Link>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>Para evaluar, C3 te asigna como jurado de este challenge.</span>
                      )
                    ) : null}
                    <button
                      type="button"
                      className="c3-btn c3-btn--contorno"
                      aria-expanded={configId === challenge.id}
                      onClick={() => {
                        setTalentoId(null);
                        setConfigId(configId === challenge.id ? null : challenge.id);
                      }}
                    >
                      {configId === challenge.id ? "Cerrar configuración" : "Configurar challenge"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {talentoId ? (
        <section id="talento-seccion" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 16 }} aria-labelledby="talento-titulo">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 id="talento-titulo" className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Resultados y talento</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
              {challenges.find((item) => item.id === talentoId)?.title}. Compará entregable, proceso y defensa. Agregá a la lista corta a quienes destacan y pedí contacto: la persona decide si acepta.
            </p>
          </div>
          <TalentoPanel challengeId={talentoId} />
        </section>
      ) : null}

      {configId ? (
        <section id="configuracion-seccion" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 16 }} aria-labelledby="configuracion-titulo">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 id="configuracion-titulo" className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Configuración del challenge</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
              {challenges.find((item) => item.id === configId)?.title}. La editan quien representa a la empresa y C3, mientras el challenge está publicado y antes del cierre de entregas.
            </p>
          </div>
          <ConfiguracionChallenge challengeId={configId} />
        </section>
      ) : null}

      <section id="tus-propuestas" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

function Pagina({ children }: { children: ReactNode }) {
  return <div className="c3-ancho c3-page c3-empresa">{children}</div>;
}

function Como() {
  return (
    <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Cómo funciona</h2>
      <div className="c3-dos-columnas-cuatro" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 24 }}>
        {[
          ["Proponés la necesidad", "Con tus palabras, sin brief perfecto."],
          ["C3 define el challenge contigo", "Alcance, entregables y rúbrica."],
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
