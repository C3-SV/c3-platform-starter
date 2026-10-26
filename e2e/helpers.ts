import { expect, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

/**
 * Utilidades compartidas por las pruebas de navegación. Preparan datos con la misma API que usa la aplicación
 * (y, para adelantar un cierre, con la API REST del emulador de Firestore) para no recorrer formularios
 * que ya cubren otras especificaciones. Todo apunta a los emuladores `demo-c3-platform`.
 */
export const BASE = "http://localhost:3100";
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = "http://127.0.0.1:8080";
const PROJECT = "demo-c3-platform";

export const PASSWORD = "clave-prueba-123";

export interface Account {
  email: string;
  password: string;
  name: string;
  uid: string;
  token: string;
}

let counter = 0;
const stamp = Date.now().toString(36);

/** Sufijo único por ejecución para que correos y títulos no choquen entre pruebas ni entre repeticiones. */
export function unique(label: string): string {
  counter += 1;
  return `${label}-${stamp}-${counter}`;
}

async function identity(path: string, body: Record<string, unknown>): Promise<{ localId: string; idToken: string }> {
  const response = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/${path}?key=demo-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Auth emulador ${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

/** Llama a la API de la aplicación con el token de una cuenta. Falla con el mensaje del servidor si no responde 2xx. */
export async function api<T = unknown>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status}: ${JSON.stringify(payload)}`);
  return payload as T;
}

/** Crea una cuenta como lo hace el registro: Auth, nombre en Auth y perfil en la API. */
export async function createAccount(label: string, name = `Persona ${label} de Prueba`): Promise<Account> {
  const email = `${unique(label)}@correo.test`;
  const { localId, idToken } = await identity("accounts:signUp", { email, password: PASSWORD });
  await identity("accounts:update", { idToken, displayName: name });
  const fresh = await identity("accounts:signInWithPassword", { email, password: PASSWORD });
  await api(fresh.idToken, "PUT", "/api/me", { displayName: name });
  return { email, password: PASSWORD, name, uid: localId, token: fresh.idToken };
}

/** Token de la cuenta administradora de las pruebas (la crea `scripts/seed-e2e.mjs`). */
export async function adminToken(): Promise<string> {
  const { idToken } = await identity("accounts:signInWithPassword", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return idToken;
}

/** Renueva el token de una cuenta (por ejemplo, después de que C3 le asigne algo). */
export async function tokenOf(account: Pick<Account, "email" | "password">): Promise<string> {
  const { idToken } = await identity("accounts:signInWithPassword", { email: account.email, password: account.password });
  return idToken;
}

export interface PublishedChallenge {
  experienceId: string;
  challengeId: string;
  title: string;
  experienceTitle: string;
}

/** Experiencia y challenge publicados, listos para inscribirse. `organizationId` lo vincula a un espacio de empresa. */
export async function createPublishedChallenge(admin: string, options: { title?: string; organizationId?: string } = {}): Promise<PublishedChallenge> {
  const title = options.title ?? unique("Challenge de prueba");
  const experienceTitle = `Experiencia ${title}`;
  const { experience } = await api<{ experience: { id: string } }>(admin, "POST", "/api/admin/experiencias", {
    title: experienceTitle,
    kind: "challenge_empresarial",
    summary: "Experiencia de prueba para validar la navegación entre pantallas.",
    registrationOpensAt: "2026-10-01T00:00:00-06:00",
    registrationClosesAt: "2027-06-01T23:59:00-06:00",
  });
  await api(admin, "PATCH", `/api/admin/experiencias/${experience.id}`, { status: "published" });
  const { challenge } = await api<{ challenge: { id: string } }>(admin, "POST", "/api/admin/retos", {
    experienceId: experience.id,
    title,
    summary: "Armar rutas diarias respetando las ventanas horarias del cliente.",
    problem: "Transportes Delta arma las rutas a mano cada mañana y no respeta las ventanas horarias pactadas.",
    deliverables: ["Repositorio con instrucciones"],
    rubric: [{ label: "Calidad del resultado", maxScore: 10 }, { label: "Claridad del enfoque", maxScore: 10 }],
    organizationName: "Transportes Delta de prueba",
    ...(options.organizationId ? { organizationId: options.organizationId } : {}),
    allows: ["individual"],
    teamMinSize: null,
    teamMaxSize: null,
    submissionClosesAt: "2027-06-30T23:59:00-06:00",
  });
  await api(admin, "PATCH", `/api/admin/retos/${challenge.id}`, { status: "published" });
  return { experienceId: experience.id, challengeId: challenge.id, title, experienceTitle };
}

/** Asigna a una cuenta como jurado del challenge (`externo` o `empresa`). */
export async function assignJudge(admin: string, challengeId: string, email: string, kind: "externo" | "empresa" = "externo"): Promise<void> {
  await api(admin, "POST", `/api/admin/retos/${challengeId}/jurados`, { email, kind });
}

/** Crea una organización y vincula a la cuenta como su representante. */
export async function linkRepresentative(admin: string, organizationName: string, email: string): Promise<string> {
  const { organization } = await api<{ organization: { id: string } }>(admin, "POST", "/api/admin/organizaciones", { name: organizationName });
  await api(admin, "POST", `/api/admin/organizaciones/${organization.id}/representantes`, { email });
  return organization.id;
}

/** Inscribe a la cuenta en el challenge y C3 la aprueba. Devuelve el id de la inscripción. */
export async function enrollApproved(admin: string, account: Account, challenge: PublishedChallenge): Promise<string> {
  await api(account.token, "POST", `/api/retos/${challenge.challengeId}/inscripcion`, { mode: "individual" });
  const enrollmentId = `${challenge.experienceId}__${account.uid}`;
  await api(admin, "PATCH", `/api/admin/inscripciones/${enrollmentId}`, { status: "approved" });
  return enrollmentId;
}

/** Cambia un campo de texto de un documento con la API REST del emulador de Firestore (reglas de «owner»). */
export async function setField(collection: string, id: string, field: string, value: string): Promise<void> {
  const response = await fetch(
    `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${id}?updateMask.fieldPaths=${field}`,
    {
      method: "PATCH",
      headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { [field]: { stringValue: value } } }),
    },
  );
  if (!response.ok) throw new Error(`Firestore ${collection}/${id}: ${response.status} ${await response.text()}`);
}

/** Adelanta el cierre de entregas de un challenge para poder evaluarlo (en el navegador el reloj no se controla). */
export async function closeSubmissions(challengeId: string): Promise<void> {
  await setField("challenges", challengeId, "submissionClosesAt", "2026-10-02T00:00:00.000Z");
}

/** Entra con correo y contraseña. Sin `next` se espera llegar a Mi C3. */
export async function loginAt(page: Page, account: Pick<Account, "email" | "password">, next?: string): Promise<void> {
  await page.goto(next ? `/acceso?next=${encodeURIComponent(next)}` : "/acceso");
  await page.locator("#l-correo").fill(account.email);
  await page.locator("#l-pass").fill(account.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(next ? new RegExp(`${escapeForRegExp(next)}$`) : /\/mi-c3$/);
}

export function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Cierra la sesión con la interfaz, desde donde esté el botón «Salir»: suelto en una cabecera o dentro del menú
 * de la cuenta. Espera a que la sesión termine y se vuelva a la Home antes de seguir.
 */
export async function signOutUi(page: Page): Promise<void> {
  const salir = page.getByRole("button", { name: "Salir", exact: true });
  if (!(await salir.first().isVisible())) {
    await page.getByRole("button", { name: /^Menú de la cuenta/ }).first().click();
  }
  await salir.first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
}

/** En pantallas pequeñas la navegación del sitio público está plegada: se abre con «Menú». En escritorio no hace nada. */
export async function openSiteMenu(page: Page): Promise<void> {
  const menu = page.getByRole("button", { name: "Menú", exact: true });
  if (await menu.isVisible()) await menu.click();
}

/** La sesión está confirmada cuando la cabecera ofrece el menú de la cuenta (o, en vistas aún sin él, «Salir»). */
export async function expectSignedIn(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: /^(Menú de la cuenta|Salir)/ }).first()).toBeVisible();
}
