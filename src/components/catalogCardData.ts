import type { CatalogCardData } from "@/components/CatalogCard";
import { formatDate, sessionSummary } from "@/lib/domain/format";
import { KIND_NAME, primaryLineOf } from "@/lib/domain/presentation";
import type { PublicExperience } from "@/lib/server/catalog";

/**
 * Turns the public catalog into cards: one per published challenge, and one per experience without challenges
 * (workshops, talks, meetups). Presentation only: it never filters or reorders the catalog.
 */
export function catalogCards(catalog: PublicExperience[]): CatalogCardData[] {
  return catalog.flatMap((item): CatalogCardData[] => {
    const line = primaryLineOf(item.experience);
    const kind = item.experience.kind;
    if (item.challenges.length === 0) {
      const closes = item.experience.registrationClosesAt;
      return [{
        key: item.experience.id,
        href: `/experiencias/${item.experience.id}`,
        kind,
        line,
        state: item.state,
        title: item.experience.title,
        summary: item.experience.summary,
        footer: sessionSummary(item.experience) ?? KIND_NAME[kind],
        detail: item.experience.location ?? (closes ? `Inscripciones hasta el ${formatDate(closes)}` : null),
        demo: item.experience.isDemo === true,
        isChallenge: false,
      }];
    }
    return item.challenges.map((challenge) => ({
      key: challenge.id,
      href: `/retos/${challenge.id}`,
      kind,
      line,
      state: challenge.state,
      title: challenge.title,
      summary: challenge.summary,
      footer: challenge.organizationName,
      detail: challenge.submissionClosesAt ? `Entregas hasta el ${formatDate(challenge.submissionClosesAt)}` : null,
      demo: challenge.isDemo || item.experience.isDemo === true,
      isChallenge: true,
    }));
  });
}
