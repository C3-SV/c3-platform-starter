/**
 * Capacidades de una cuenta. Una misma persona puede ser participante, jurado, representante de una organización
 * y administradora a la vez: la interfaz muestra accesos según lo que la cuenta PUEDE hacer, no según un «tipo de usuario».
 *
 * Reglas PURAS. Los datos los arma el servidor desde el token verificado y los vínculos que C3 hizo (`/api/me`);
 * esto solo decide qué accesos mostrar y NUNCA sustituye la autorización de cada ruta de la API.
 */

export interface OrganizationRef {
  id: string;
  name: string;
}

export interface Capabilities {
  /** Claim `c3Admin` verificado por el servidor. */
  admin: boolean;
  /** Organizaciones a las que C3 vinculó la cuenta como representante. */
  organizations: OrganizationRef[];
  /** Challenges que la cuenta evalúa como jurado (asignaciones activas). */
  judge: { challenges: number };
}

/** Sin vínculos ni permisos: lo que ve una cuenta recién creada. */
export const NO_CAPABILITIES: Capabilities = { admin: false, organizations: [], judge: { challenges: 0 } };

export function isRepresentative(capabilities: Pick<Capabilities, "organizations">): boolean {
  return capabilities.organizations.length > 0;
}

export function isJudge(capabilities: Pick<Capabilities, "judge">): boolean {
  return capabilities.judge.challenges > 0;
}

/** Un acceso del menú de la cuenta o de la navegación de la app. */
export interface AccessLink {
  id: "mi-c3" | "explorar" | "trayectoria" | "cuenta" | "empresa" | "admin";
  label: string;
  href: string;
  description: string;
}

const MI_C3: AccessLink = { id: "mi-c3", label: "Mi C3", href: "/mi-c3", description: "Lo que te toca ahora" };
const EXPLORAR: AccessLink = { id: "explorar", label: "Explorar", href: "/explorar", description: "Experiencias y challenges con inscripción abierta" };
const TRAYECTORIA: AccessLink = { id: "trayectoria", label: "Trayectoria", href: "/trayectoria", description: "Lo que C3 registró de tu participación" };
const CUENTA: AccessLink = { id: "cuenta", label: "Cuenta", href: "/cuenta", description: "Tu perfil, tu contraseña y tu correo" };

function companyLink(capabilities: Pick<Capabilities, "organizations">): AccessLink {
  const [first] = capabilities.organizations;
  const many = capabilities.organizations.length > 1;
  return {
    id: "empresa",
    label: "Espacio de empresa",
    href: "/empresa",
    description: many ? `${capabilities.organizations.length} organizaciones` : first?.name ?? "Soluciones y propuestas de tu organización",
  };
}

const ADMIN: AccessLink = { id: "admin", label: "Administración", href: "/admin", description: "Catálogo, inscripciones, jurados y resultados" };

/**
 * Navegación principal de la app autenticada (cabecera de escritorio). Los espacios con capacidad aparecen
 * solo si la cuenta los tiene; la evaluación no tiene ítem propio porque vive en Mi C3.
 */
export function appNavigation(capabilities: Capabilities): AccessLink[] {
  const items: AccessLink[] = [MI_C3, EXPLORAR, TRAYECTORIA];
  if (isRepresentative(capabilities)) items.push({ ...companyLink(capabilities), label: "Mi empresa" });
  if (capabilities.admin) items.push({ ...ADMIN, label: "Admin" });
  return items;
}

/** Menú de la cuenta (avatar): los destinos personales y los espacios que la cuenta tiene. «Salir» lo añade el componente. */
export function accountMenu(capabilities: Capabilities): AccessLink[] {
  const items: AccessLink[] = [MI_C3, TRAYECTORIA, CUENTA];
  if (isRepresentative(capabilities)) items.push(companyLink(capabilities));
  if (capabilities.admin) items.push(ADMIN);
  return items;
}

/** Espacios adicionales que Mi C3 ofrece como tarjetas («Tus espacios»). Vacío si la cuenta solo participa. */
export function spacesOf(capabilities: Capabilities): AccessLink[] {
  const items: AccessLink[] = [];
  if (isRepresentative(capabilities)) items.push(companyLink(capabilities));
  if (capabilities.admin) items.push(ADMIN);
  return items;
}

/** Valida la respuesta de `/api/me` en el cliente: ante cualquier forma inesperada no se concede nada. */
export function parseCapabilities(raw: unknown): Capabilities {
  if (typeof raw !== "object" || raw === null) return NO_CAPABILITIES;
  const value = raw as Record<string, unknown>;
  const organizations = Array.isArray(value.organizations)
    ? value.organizations.flatMap((item): OrganizationRef[] => {
        if (typeof item !== "object" || item === null) return [];
        const { id, name } = item as Record<string, unknown>;
        return typeof id === "string" && id && typeof name === "string" ? [{ id, name }] : [];
      })
    : [];
  const judge = typeof value.judge === "object" && value.judge !== null ? (value.judge as Record<string, unknown>) : {};
  const challenges = typeof judge.challenges === "number" && Number.isFinite(judge.challenges) && judge.challenges > 0 ? Math.floor(judge.challenges) : 0;
  return { admin: value.admin === true, organizations, judge: { challenges } };
}
