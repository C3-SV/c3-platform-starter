import type { CatalogCardData } from "@/components/CatalogCard";
import { coverOf } from "@/lib/domain/coverImage";
import { formatDate, modalityLabel, sessionSummary } from "@/lib/domain/format";
import { experienceLabel, LINE_NAME, primaryLineOf } from "@/lib/domain/presentation";
import type { ExperienceLine } from "@/lib/domain/types";
import type { PublicExperience } from "@/lib/server/catalog";

/**
 * Turns the public catalog into cards: one per published challenge, and one per experience without challenges
 * (workshops, talks, meetups). Presentation only: it never filters or reorders the catalog. On a line page
 * (`pageLine`) cards take that line's color and name and also show the demo note and the source credit.
 */
export function catalogCards(catalog: PublicExperience[], { pageLine }: { pageLine?: ExperienceLine } = {}): CatalogCardData[] {
  return catalog.flatMap((item): CatalogCardData[] => {
    const line = pageLine ?? primaryLineOf(item.experience);
    const label = pageLine ? LINE_NAME[pageLine] : experienceLabel(item.experience);
    const kind = item.experience.kind;
    if (item.challenges.length === 0) {
      const closes = item.experience.registrationClosesAt;
      return [{
        key: item.experience.id,
        href: `/experiencias/${item.experience.id}`,
        kind,
        line,
        label,
        state: item.state,
        title: item.experience.title,
        summary: item.experience.summary,
        footer: sessionSummary(item.experience) ?? "Experiencia C3",
        detail: item.experience.location ?? (closes ? `Inscripciones hasta el ${formatDate(closes)}` : null),
        demo: item.experience.isDemo === true,
        demoNote: pageLine ? item.experience.demoNote ?? null : null,
        source: pageLine && item.experience.sourceUrl ? item.experience.sourceLabel ?? item.experience.sourceUrl : null,
        isChallenge: false,
        cover: coverOf(item.experience),
      }];
    }
    return item.challenges.map((challenge) => ({
      key: challenge.id,
      href: `/retos/${challenge.id}`,
      kind,
      line,
      label,
      state: challenge.state,
      title: challenge.title,
      summary: challenge.summary,
      footer: `${challenge.organizationName} · ${modalityLabel(challenge.allows, challenge.teamMinSize, challenge.teamMaxSize)}`,
      detail: challenge.submissionClosesAt ? `Entregas hasta el ${formatDate(challenge.submissionClosesAt)}` : null,
      demo: challenge.isDemo,
      demoNote: pageLine ? challenge.demoNote : null,
      source: pageLine && challenge.sourceUrl ? challenge.sourceLabel ?? challenge.sourceUrl : null,
      isChallenge: true,
      cover: challenge.cover,
    }));
  });
}
