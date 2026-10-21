/**
 * Trayectoria: ordena lo que C3 registró de la persona en secciones que se entienden de un vistazo.
 * Reglas PURAS: no consultan Firebase ni reemplazan la autorización del servidor. Lo que la persona escribe
 * de sí misma (perfil) no entra acá; la trayectoria es solo registro oficial.
 *
 * - participaciones: inscripción aprobada, con o sin entrega, con o sin resultado publicado.
 * - en_revision: inscripción pendiente; C3 todavía no decidió, así que no acredita nada.
 * - sin_participacion: inscripción cancelada o rechazada. No acredita participación ni resultado.
 */
import type { EnrollmentStatus } from "./types.ts";

export type TrajectorySection = "participaciones" | "en_revision" | "sin_participacion";

export const TRAJECTORY_ORDER: readonly TrajectorySection[] = ["participaciones", "en_revision", "sin_participacion"];

export const TRAJECTORY_COPY: Record<TrajectorySection, { title: string; short: string; description: string }> = {
  participaciones: { title: "Participaciones", short: "Participaciones", description: "Retos y experiencias en los que C3 aprobó tu inscripción." },
  en_revision: { title: "En revisión por C3", short: "En revisión", description: "Todavía no acreditan participación: C3 no respondió." },
  sin_participacion: { title: "Sin participación", short: "Sin participación", description: "Inscripciones canceladas o rechazadas. No acreditan participación ni resultado." },
};

export interface TrajectoryFacts {
  status: EnrollmentStatus;
  /** Resultado publicado por C3 para su entrega, si existe. */
  result: unknown | null;
}

export function trajectorySection(item: TrajectoryFacts): TrajectorySection {
  if (item.status === "cancelled" || item.status === "rejected") return "sin_participacion";
  if (item.status === "pending") return "en_revision";
  return "participaciones";
}

export type TrajectoryGroups<T> = Record<TrajectorySection, T[]>;

/**
 * Reparte las inscripciones en secciones. Conserva el orden recibido (la más reciente primero), salvo en
 * «participaciones», donde los resultados publicados van arriba: es lo más valioso del registro.
 */
export function groupTrajectory<T extends TrajectoryFacts>(items: readonly T[]): TrajectoryGroups<T> {
  const groups: TrajectoryGroups<T> = { participaciones: [], en_revision: [], sin_participacion: [] };
  for (const item of items) groups[trajectorySection(item)].push(item);
  const withResult = groups.participaciones.filter((item) => item.result !== null && item.result !== undefined);
  const withoutResult = groups.participaciones.filter((item) => item.result === null || item.result === undefined);
  groups.participaciones = [...withResult, ...withoutResult];
  return groups;
}

export function countWithResult(items: readonly TrajectoryFacts[]): number {
  return items.filter((item) => trajectorySection(item) === "participaciones" && item.result !== null && item.result !== undefined).length;
}

export type Medal = "oro" | "plata" | "bronce";

/** Medalla por puesto publicado (guía de diseño V08: oro, plata y bronce solo para mostrar el puesto). */
export function medalFor(place: number | null | undefined): Medal | null {
  if (place === 1) return "oro";
  if (place === 2) return "plata";
  if (place === 3) return "bronce";
  return null;
}

/** Texto de la medalla: «ORO» para el primer puesto y «2.º», «3.º» para los siguientes, como en la guía. */
export function medalText(medal: Medal): string {
  return medal === "oro" ? "ORO" : medal === "plata" ? "2.º" : "3.º";
}

export function medalName(medal: Medal): string {
  return medal === "oro" ? "Medalla de oro" : medal === "plata" ? "Medalla de plata" : "Medalla de bronce";
}
