import Link from "next/link";
import { LineBrandMark } from "@/components/BrandMark";
import type { ExperienceLine } from "@/lib/domain/types";
import type { PublicChallengeSummary, PublicExperience } from "@/lib/server/catalog";
import { formatDate, modalityLabel, sessionSummary } from "@/lib/domain/format";
import { StatePill } from "@/components/StatePill";

function lineColor(line: ExperienceLine): string {
  return "var(--c3-" + line + ")";
}

function lineTextColor(line: ExperienceLine): string {
  return line === "crea" ? "var(--c3-crea-texto)" : lineColor(line);
}

export function ExperienceCard({
  item,
  line,
  challenge,
}: {
  item: PublicExperience;
  line: ExperienceLine;
  challenge?: PublicChallengeSummary;
}) {
  const title = challenge?.title ?? item.experience.title;
  const summary = challenge?.summary ?? item.experience.summary;
  const state = challenge?.state ?? item.state;
  const demo = challenge?.isDemo ?? item.experience.isDemo;
  const demoNote = challenge?.demoNote ?? item.experience.demoNote;
  const sourceUrl = challenge?.sourceUrl ?? item.experience.sourceUrl;
  const sourceLabel = challenge?.sourceLabel ?? item.experience.sourceLabel;
  const body = (
    <>
      <div style={{ height: 6, background: lineColor(line) }} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div className="c3-experience-card__meta">
          <div className="c3-experience-card__line">
            <LineBrandMark line={line} className="c3-line-mark--card" decorative />
            <span className="c3-etiqueta" style={{ color: lineTextColor(line) }}>{line}</span>
          </div>
          <StatePill state={state} />
        </div>
        {demo ? <span className="c3-pill c3-pill--advertencia" style={{ alignSelf: "flex-start" }}>Demo · no oficial</span> : null}
        <h3 className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{summary}</p>
        {demoNote ? <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--c3-advertencia)" }}>{demoNote}</p> : null}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--c3-borde)", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {challenge ? challenge.organizationName + " · " + modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize) : (sessionSummary(item.experience) ?? "Experiencia C3")}
          </span>
          {challenge?.submissionClosesAt ? <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>Entregas hasta el {formatDate(challenge.submissionClosesAt)}</span> : null}
          {sourceUrl ? <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>Fuente: {sourceLabel ?? sourceUrl}</span> : null}
        </div>
      </div>
    </>
  );

  return (
    <Link href={challenge ? "/retos/" + challenge.id : "/experiencias/" + item.experience.id} className="c3-tarjeta-enlace">{body}</Link>
  );
}
