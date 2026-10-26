/**
 * Secciones de la consola de administración. Cada una tiene su propia URL (`/admin/[seccion]`): recargar, «atrás»
 * y los enlaces directos conservan la sección. El orden sigue el ciclo de vida de una experiencia.
 */
export interface AdminSection {
  id: "resumen" | "propuestas" | "experiencias" | "inscripciones" | "entregas" | "jurados" | "resultados";
  label: string;
  description: string;
}

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { id: "resumen", label: "Resumen", description: "Qué requiere atención ahora" },
  { id: "propuestas", label: "Propuestas", description: "Revisión de propuestas de empresa y organizaciones" },
  { id: "experiencias", label: "Experiencias y challenges", description: "Crear, editar y publicar experiencias y sus challenges" },
  { id: "inscripciones", label: "Inscripciones y equipos", description: "Aprobar o rechazar inscripciones" },
  { id: "entregas", label: "Entregas", description: "Consulta de entregas y su autorización" },
  { id: "jurados", label: "Jurados y rúbricas", description: "Asignar jurados y ver la rúbrica de cada challenge" },
  { id: "resultados", label: "Resultados oficiales", description: "Consolidar, reconocer y publicar" },
];

export type AdminSectionId = AdminSection["id"];

/** Sección por defecto al entrar a `/admin`: el resumen, con los pendientes enlazados. */
export const ADMIN_HOME: AdminSectionId = "resumen";

export function adminHref(section: AdminSectionId, query?: Record<string, string>): string {
  const params = query ? new URLSearchParams(query).toString() : "";
  return `/admin/${section}${params ? `?${params}` : ""}`;
}

/** Valida el segmento de la URL: solo las secciones conocidas; cualquier otra cosa es un 404. */
export function parseAdminSection(value: string | null | undefined): AdminSectionId | null {
  return ADMIN_SECTIONS.find((section) => section.id === value)?.id ?? null;
}

export function adminSectionOf(id: AdminSectionId): AdminSection {
  return ADMIN_SECTIONS.find((section) => section.id === id) ?? ADMIN_SECTIONS[0];
}

/** Pendientes del equipo de C3 que se muestran como contadores en el menú y como accesos directos en el resumen. */
export interface AdminPending {
  proposals: number;
  enrollments: number;
}

/** Contador de una sección: solo las que tienen algo que atender muestran número. */
export function pendingFor(section: AdminSectionId, pending: AdminPending | null): number {
  if (!pending) return 0;
  if (section === "propuestas") return pending.proposals;
  if (section === "inscripciones") return pending.enrollments;
  return 0;
}
