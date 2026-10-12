/** Formato de fechas y modalidades para la UI. Las fechas se muestran en la zona horaria de C3 (El Salvador). */
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
