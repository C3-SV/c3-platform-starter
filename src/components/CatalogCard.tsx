import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { StatePill } from "@/components/StatePill";
import type { CoverImage as Cover } from "@/lib/domain/coverImage";
import type { PresentedState } from "@/lib/domain/presentation";
import type { ExperienceKind, ExperienceLine } from "@/lib/domain/types";

/** Serializable data for one catalog card, built on the server from the public catalog. */
export interface CatalogCardData {
  key: string;
  href: string;
  kind: ExperienceKind;
  line: ExperienceLine;
  /** "Compite · Taller" in the catalog, just the line name on a line page. */
  label: string;
  state: PresentedState;
  title: string;
  summary: string;
  footer: string;
  detail: string | null;
  demo: boolean;
  demoNote: string | null;
  /** Source credit ("Fuente: …"), shown on line pages. */
  source: string | null;
  isChallenge: boolean;
  cover: Cover | null;
}

const ICON_PATHS: Record<ExperienceKind, string[]> = {
  competencia: ["M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1", "M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"],
  hackathon: ["M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"],
  challenge_empresarial: ["M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15", "M6 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  taller: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z", "M8 7h8M8 11h6"],
  charla: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  encuentro: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"],
};

/** Decorative icon for an experience kind, drawn in the line color. */
export function KindIcon({ kind }: { kind: ExperienceKind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[kind].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Experience or challenge card used on the home page, the line pages and the catalog. */
export function CatalogCard({ card }: { card: CatalogCardData }) {
  return (
    <Link href={card.href} className={`c3-exp c3-exp--${card.line}`}>
      <div className="c3-exp__media">
        {card.demo ? <span className="c3-exp__badge">DEMO</span> : null}
        {card.cover ? (
          <CoverImage
            cover={card.cover}
            className="c3-exp__cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 380px"
            fallback={<span className="c3-exp__icon"><KindIcon kind={card.kind} /></span>}
          />
        ) : (
          <span className="c3-exp__icon"><KindIcon kind={card.kind} /></span>
        )}
      </div>
      <div className="c3-exp__body">
        <div className="c3-exp__meta">
          <span className="c3-exp__line"><span className={`c3-dot c3-dot--${card.line}`} aria-hidden="true" />{card.label}</span>
          <StatePill state={card.state} />
        </div>
        <h3>{card.title}</h3>
        <p className="c3-exp__summary">{card.summary}</p>
        {card.demoNote ? <p className="c3-exp__note">{card.demoNote}</p> : null}
        {card.detail ? (
          <span className="c3-exp__detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
            {card.detail}
          </span>
        ) : null}
        {card.source ? <span className="c3-exp__source">Fuente: {card.source}</span> : null}
        <div className="c3-exp__footer">
          <span>{card.footer}</span>
          <span className="c3-exp__go">{card.isChallenge ? "Ver challenge" : "Ver experiencia"} <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </Link>
  );
}

/** Placeholder card shown while the next batch of the catalog comes into view. */
export function CatalogCardSkeleton() {
  return (
    <div className="c3-exp c3-exp--skeleton" aria-hidden="true">
      <div className="c3-exp__media"><span className="c3-skeleton" style={{ width: 58, height: 58, borderRadius: 16 }} /></div>
      <div className="c3-exp__body">
        <div className="c3-exp__meta"><span className="c3-skeleton" style={{ width: 72, height: 10 }} /><span className="c3-skeleton" style={{ width: 64, height: 18, borderRadius: 999 }} /></div>
        <span className="c3-skeleton" style={{ width: "88%", height: 18 }} />
        <span className="c3-skeleton" style={{ width: "56%", height: 18 }} />
        <span className="c3-skeleton" style={{ width: "100%", height: 10, marginTop: 6 }} />
        <span className="c3-skeleton" style={{ width: "72%", height: 10 }} />
        <div className="c3-exp__footer"><span className="c3-skeleton" style={{ width: 72, height: 10 }} /><span className="c3-skeleton" style={{ width: 72, height: 10 }} /></div>
      </div>
    </div>
  );
}
