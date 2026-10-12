import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { StatePill } from "@/components/StatePill";
import { KIND_LABEL, lineColor, lineTextColor, type PresentedState } from "@/lib/domain/presentation";
import { formatDate, modalityLabel } from "@/lib/domain/format";
import type { ExperienceKind } from "@/lib/domain/types";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** Textos de la leyenda tal como aparecen en V02. */
const LEYENDA: { kind: ExperienceKind; label: string }[] = [
  { kind: "competencia", label: "Compite · competencias" },
  { kind: "hackathon", label: "Crea · hackathons" },
  { kind: "challenge_empresarial", label: "Conecta · challenges de empresas" },
];

interface CardItem {
  key: string;
  href: string | null;
  kind: ExperienceKind;
  state: PresentedState;
  title: string;
  summary: string;
  footer: string;
  detail?: string | null;
}

/** V02 · Explorar experiencias. Sin filtros en el MVP (decisión 2 de la guía de estilo). */
export default async function ExplorarPage() {
  const catalog = await listPublicCatalog(database(), new Date());
  const cards: CardItem[] = catalog.flatMap((item): CardItem[] => {
    if (item.challenges.length === 0) {
      return [{
        key: item.experience.id,
        href: null,
        kind: item.experience.kind,
        state: item.state,
        title: item.experience.title,
        summary: item.experience.summary,
        footer: "Solo informativa",
      }];
    }
    return item.challenges.map((challenge) => ({
      key: challenge.id,
      href: `/retos/${challenge.id}`,
      kind: item.experience.kind,
      state: challenge.state,
      title: challenge.title,
      summary: challenge.summary,
      footer: `${challenge.organizationName} · ${modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize)}`,
      detail: challenge.submissionClosesAt ? `Entregas hasta el ${formatDate(challenge.submissionClosesAt)}` : null,
    }));
  });

  return (
    <div>
      <SiteHeader />
      <main className="c3-page" style={{ maxWidth: 1276, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 48px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="c3-titulo" style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 700 }}>Explorar experiencias</h1>
          <p style={{ maxWidth: 680, fontSize: 18, lineHeight: 1.6, color: "var(--c3-texto-suave)" }}>
            Retos reales de empresas, competencias y hackathons de C3. Las que tienen inscripción abierta te dejan participar desde aquí.
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", paddingTop: 8 }} aria-label="Leyenda de colores">
            {LEYENDA.map((item) => (
              <div key={item.kind} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: lineColor(item.kind) }} />
                <span style={{ fontSize: 14 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="c3-card" style={{ padding: 24 }}>
            <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Todavía no hay experiencias publicadas. Volvé pronto.</p>
          </div>
        ) : (
          <div className="c3-grilla-tarjetas">
            {cards.map((card) => {
              const body = (
                <>
                  <div style={{ height: 6, background: lineColor(card.kind) }} />
                  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span className="c3-etiqueta" style={{ color: lineTextColor(card.kind) }}>{KIND_LABEL[card.kind]}</span>
                      <StatePill state={card.state} />
                    </div>
                    <div className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{card.title}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{card.summary}</div>
                    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--c3-borde)", display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{card.footer}</span>
                      {card.detail ? <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{card.detail}</span> : null}
                    </div>
                  </div>
                </>
              );
              return card.href ? (
                <Link key={card.key} href={card.href} className="c3-tarjeta-enlace">{body}</Link>
              ) : (
                <article key={card.key} className="c3-tarjeta-enlace" style={{ cursor: "default" }}>{body}</article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
