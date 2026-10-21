/** Formato de fechas y modalidades para la UI. Las fechas se muestran en la zona horaria de C3 (El Salvador). */
import { MODALITY_LABEL } from "./presentation.ts";
import type { ExperienceModality } from "./types.ts";

const TIME_ZONE = "America/El_Salvador";

const dateFormat = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return dateTimeFormat.format(new Date(iso));
}

export function modalityLabel(allows: string[], teamMin: number | null, teamMax: number | null): string {
  const hasTeam = allows.includes("team") && teamMin !== null && teamMax !== null;
  const team = hasTeam ? `equipos de ${teamMin} a ${teamMax}` : null;
  if (allows.includes("individual") && team) return `Individual o ${team}`;
  if (team) return team.charAt(0).toUpperCase() + team.slice(1);
  return "Individual";
}

const timeFormat = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE });

export function formatTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return timeFormat.format(new Date(iso));
}

/** «10 de noviembre, 10:00 – 14:00»; si termina otro día, muestra ambas fechas. Sin inicio devuelve null. */
export function formatSession(startsAt: string | null | undefined, endsAt: string | null | undefined): string | null {
  if (!startsAt) return null;
  const start = formatDateTime(startsAt) ?? "";
  if (!endsAt) return start;
  const sameDay = dateFormat.format(new Date(startsAt)) === dateFormat.format(new Date(endsAt));
  return sameDay ? `${start} – ${formatTime(endsAt)}` : `${start} – ${formatDateTime(endsAt)}`;
}

/** Una línea con modalidad y fecha de la sesión para tarjetas; null si la experiencia no define ninguna. */
export function sessionSummary(experience: { modality?: ExperienceModality | null; startsAt?: string | null }): string | null {
  const parts = [
    experience.modality ? MODALITY_LABEL[experience.modality] ?? null : null,
    formatDate(experience.startsAt),
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" · ") : null;
}
