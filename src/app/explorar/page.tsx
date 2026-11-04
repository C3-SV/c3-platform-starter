import { SiteShell } from "@/components/SiteShell";
import { experienceLabel, lineColor, primaryLineOf } from "@/lib/domain/presentation";
import { formatDate, modalityLabel, sessionSummary } from "@/lib/domain/format";
import type { ExperienceKind, ExperienceLine } from "@/lib/domain/types";
import { database } from "@/lib/server/context";
import { listPublicCatalog } from "@/lib/server/catalog";
import type { Metadata } from "next";
import { FiltrosExplorar, type ExploreCard } from "./FiltrosExplorar";

export const metadata: Metadata = { title: "Explorar challenges" };

export const dynamic = "force-dynamic";

/** Textos de la leyenda tal como aparecen en V02. */
const LEYENDA: { kind: ExperienceKind; label: string }[] = [
  { kind: "competencia", label: "Compite · competencias" },
  { kind: "hackathon", label: "Crea · hackathons" },
  { kind: "challenge_empresarial", label: "Conecta · challenges empresariales" },
];

/** V02 · Explorar. Filtros de tipo, línea, estado y demo en el cliente; el servidor entrega el catálogo público. */
export default async function ExplorarPage() {
  const catalog = await listPublicCatalog(database(), new Date());
  const cards: ExploreCard[] = catalog.flatMap((item): ExploreCard[] => {
    const line: ExperienceLine = primaryLineOf(item.experience);
    const label = experienceLabel(item.experience);
    const demo = item.experience.isDemo === true;
    if (item.challenges.length === 0) {
      return [{
        key: item.experience.id,
        href: `/experiencias/${item.experience.id}`,
        kind: item.experience.kind,
        line,
        label,
        state: item.state,
        title: item.experience.title,
        summary: item.experience.summary,
        footer: sessionSummary(item.experience) ?? "Experiencia C3",
        detail: item.experience.location ?? (item.experience.registrationClosesAt ? `Inscripciones hasta el ${formatDate(item.experience.registrationClosesAt)}` : null),
        demo,
      }];
    }
    return item.challenges.map((challenge) => ({
      key: challenge.id,
      href: `/retos/${challenge.id}`,
      kind: item.experience.kind,
      line,
      label,
      state: challenge.state,
      title: challenge.title,
      summary: challenge.summary,
      footer: `${challenge.organizationName} · ${modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize)}`,
      detail: challenge.submissionClosesAt ? `Entregas hasta el ${formatDate(challenge.submissionClosesAt)}` : null,
      demo,
    }));
  });

  return (
    <SiteShell>
      <main id="contenido" className="c3-page c3-ancho" style={{ display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 48px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="c3-titulo" style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 700 }}>Explorá experiencias de C3</h1>
          <p style={{ maxWidth: 680, fontSize: 18, lineHeight: 1.6, color: "var(--c3-texto-suave)" }}>
            Challenges reales de empresas, competencias y hackathons de C3. Las que tienen inscripción abierta te dejan participar desde aquí.
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
          <FiltrosExplorar cards={cards} />
        )}
      </main>
    </SiteShell>
  );
}
