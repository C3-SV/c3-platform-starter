import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

/**
 * Gestión de experiencias sin reto, de punta a punta: C3 crea un taller, lo edita, lo publica, abre y cierra
 * inscripciones, revisa a quien se inscribe y lo concluye; el público lo ve en Home y Explorar. Los retos
 * técnicos conservan su recorrido (corte1–corte6). Los títulos llevan marca de tiempo para no mezclar proyectos.
 */
const stamp = Date.now().toString(36);
const workshopTitle = `Taller de programación competitiva ${stamp}`;
const editedTitle = `${workshopTitle} (editado)`;
const incompleteTitle = `Charla sin fecha ${stamp}`;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const joven = { name: "Marta Quintanilla de Prueba", email: `marta.${stamp}@correo.test`, password: "clave-marta-123" };
let experienceHref = "";
let experienceId = "";

async function login(page: Page, email: string, password: string, next = "/") {
  await page.goto(`/acceso?next=${encodeURIComponent(next)}`);
  await page.locator("#l-correo").fill(email);
  await page.locator("#l-pass").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

async function expectNoSeriousViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.help} · ${violation.nodes.length} elemento(s)`);
  expect(serious, `incumplimientos serios en ${label}`).toEqual([]);
}

async function openAdminExperiences(page: Page) {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin");
  await expect(page.getByRole("heading", { name: "Experiencias y retos", level: 1 })).toBeVisible();
}

test.describe.serial("Experiencias sin reto: del borrador al cierre", () => {
  test("C3 crea un taller en borrador con sesión, modalidad, sede y cupos", async ({ page }) => {
    await openAdminExperiences(page);
    const form = page.locator("form").filter({ has: page.locator("#exp-titulo") });
    await page.locator("#exp-titulo").fill(workshopTitle);
    await page.locator("#exp-tipo").selectOption("taller");
    await expect(page.locator("#exp-linea")).toHaveValue("crea");
    await page.locator("#exp-linea").selectOption("compite");
    await page.locator("#exp-tipo").selectOption("charla");
    await expect(page.locator("#exp-linea")).toHaveValue("compite");
    await page.locator("#exp-tipo").selectOption("taller");
    await page.locator("#exp-resumen").fill("Taller introductorio con problemas guiados para quienes empiezan en programación competitiva.");
    await page.locator("#exp-modalidad").selectOption("presencial");
    await page.locator("#exp-inicio").fill("2027-06-10T09:00");
    await page.locator("#exp-fin").fill("2027-06-10T13:00");
    await page.locator("#exp-lugar").fill("Auditorio ESEN, San Salvador");
    await page.locator("#exp-cupos").fill("0");
    await page.locator("#exp-abre").fill("2026-10-01T00:00");
    await page.locator("#exp-cierra").fill("2027-06-01T23:59");

    // Validación en servidor, con el motivo junto al campo.
    await form.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByText("Cupos: indicá un entero de 1 a 5000")).toBeVisible();

    await page.locator("#exp-cupos").fill("1");
    await form.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Experiencia guardada" })).toBeVisible();

    const region = page.getByRole("region", { name: workshopTitle });
    await expect(region).toBeVisible();
    await expect(region.getByText("Borrador", { exact: true })).toBeVisible();
    await expect(region.getByText("Próximas acciones")).toBeVisible();
    await expect(region.getByText("Auditorio ESEN, San Salvador")).toBeVisible();
    await expect(region.getByText("0 de 1 ocupados")).toBeVisible();
    await expectNoSeriousViolations(page, "admin: listado y formulario de experiencias");
  });

  test("C3 edita la experiencia y la lista se puede buscar y filtrar", async ({ page }) => {
    await openAdminExperiences(page);
    await page.getByRole("region", { name: workshopTitle }).getByRole("button", { name: "Editar", exact: true }).click();
    const form = page.getByRole("form", { name: `Editar ${workshopTitle}` });
    await expect(form.getByRole("button", { name: "Guardar cambios" })).toBeVisible();
    await expect(page.locator("#exp-titulo")).toHaveValue(workshopTitle);
    await expect(page.locator("#exp-modalidad")).toHaveValue("presencial");
    await expect(page.locator("#exp-cupos")).toHaveValue("1");
    await expect(page.locator("#exp-tipo")).toHaveValue("taller");

    await page.locator("#exp-titulo").fill(editedTitle);
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Cambios guardados" })).toBeVisible();
    await expect(page.getByRole("region", { name: editedTitle })).toBeVisible();
    await expect(page.getByRole("region", { name: workshopTitle, exact: true })).toHaveCount(0);

    // Búsqueda por nombre y filtros por estado y línea.
    await page.locator("#exp-buscar").fill(`programacion competitiva ${stamp}`);
    await expect(page.getByRole("region", { name: editedTitle })).toBeVisible();
    await page.locator("#exp-buscar").fill(`no-existe-${stamp}`);
    await expect(page.getByText("Ninguna experiencia coincide con la búsqueda y los filtros.")).toBeVisible();
    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await page.locator("#exp-filtro-estado").selectOption("closed");
    await expect(page.getByRole("region", { name: editedTitle })).toHaveCount(0);
    await page.locator("#exp-filtro-estado").selectOption("draft");
    await page.locator("#exp-filtro-linea").selectOption("compite");
    await expect(page.getByRole("region", { name: editedTitle })).toBeVisible();
    await page.locator("#exp-filtro-linea").selectOption("conecta");
    await expect(page.getByRole("region", { name: editedTitle })).toHaveCount(0);
  });

  test("publicar una charla sin fecha ni sede se rechaza con el motivo; el taller completo se publica", async ({ page }) => {
    await openAdminExperiences(page);
    const form = page.locator("form").filter({ has: page.locator("#exp-titulo") });
    await page.locator("#exp-titulo").fill(incompleteTitle);
    await page.locator("#exp-tipo").selectOption("charla");
    await page.locator("#exp-resumen").fill("Conversación abierta sobre carreras técnicas, sin fecha todavía.");
    await form.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Experiencia guardada" })).toBeVisible();
    const incomplete = page.getByRole("region", { name: incompleteTitle });
    await expect(incomplete.getByText(/Completá antes de publicar/)).toBeVisible();
    await incomplete.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "fecha y hora de inicio" })).toBeVisible();
    await expect(incomplete.getByText("Borrador", { exact: true })).toBeVisible();

    const region = page.getByRole("region", { name: editedTitle });
    await region.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();
    await expect(region.getByText("Inscripciones abiertas", { exact: true })).toBeVisible();
  });

  test("el público ve el taller en Home y en Explorar y abre su detalle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: new RegExp(escape(editedTitle)) })).toBeVisible();

    await page.goto("/explorar");
    const card = page.getByRole("link", { name: new RegExp(escape(editedTitle)) });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Compite · Taller");
    await expect(card).toContainText("Presencial");
    await card.click();
    await expect(page).toHaveURL(/\/experiencias\/[^/]+$/);
    experienceHref = new URL(page.url()).pathname;
    experienceId = experienceHref.split("/").filter(Boolean)[1];

    await expect(page.getByRole("heading", { level: 1, name: editedTitle })).toBeVisible();
    await expect(page.getByText("Auditorio ESEN, San Salvador").first()).toBeVisible();
    await expect(page.getByText("1 disponibles de 1")).toBeVisible();
    await expect(page.getByRole("link", { name: "Inscribirme", exact: true }).first()).toBeVisible();
    await expectNoSeriousViolations(page, "detalle público de experiencia");

    // Una charla en borrador no se ve ni por enlace directo.
    await page.goto("/explorar");
    await expect(page.getByRole("link", { name: new RegExp(escape(incompleteTitle)) })).toHaveCount(0);
  });

  test("una persona nueva crea cuenta, se inscribe al taller y su inscripción queda en revisión", async ({ page }) => {
    await page.goto(experienceHref);
    await page.getByRole("link", { name: "Inscribirme", exact: true }).first().click();
    await expect(page).toHaveURL(/\/acceso\?modo=registro/);

    const registerForm = page.locator("form").filter({ has: page.locator("#r-nombre") });
    await page.locator("#r-nombre").fill(joven.name);
    await page.locator("#r-correo").fill(joven.email);
    await page.locator("#r-pass").fill(joven.password);
    await registerForm.locator('input[type="checkbox"]').check();
    await registerForm.getByRole("button", { name: "Crear cuenta", exact: true }).click();

    await expect(page).toHaveURL(/\/experiencias\/[^/]+\/inscripcion$/);
    await page.getByRole("button", { name: "Inscribirme", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Inscripción enviada" })).toBeVisible();
    await expect(page.getByText("Tu inscripción está en revisión por C3.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Tu inscripción está en revisión por C3.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Inscribirme", exact: true })).toHaveCount(0);

    await page.goto("/mi-c3");
    await expect(page.getByText("En espera")).toBeVisible();
    await expect(page.getByText(editedTitle)).toBeVisible();
  });

  test("el cupo único ya está ocupado: el público ve cupos completos y C3 lo ve en el listado", async ({ page }) => {
    await page.goto(experienceHref);
    await expect(page.getByText("Cupos completos").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Inscribirme", exact: true })).toHaveCount(0);

    await openAdminExperiences(page);
    const region = page.getByRole("region", { name: editedTitle });
    await expect(region.getByText("1 de 1 ocupados · 0 libres")).toBeVisible();
    await expect(region.getByText("Revisá 1 inscripción pendiente.")).toBeVisible();
  });

  test("C3 revisa la inscripción del taller desde el panel", async ({ page }) => {
    await openAdminExperiences(page);
    await page.getByRole("region", { name: editedTitle }).getByRole("button", { name: "Ver inscripciones" }).click();
    await expect(page.getByRole("heading", { name: "Inscripciones y equipos", level: 1 })).toBeVisible();
    await expect(page.locator("#ins-reto")).toHaveValue(`experience:${experienceId}`);
    const row = page.getByRole("group", { name: joven.email });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pendiente")).toBeVisible();
    await row.getByRole("button", { name: "Aprobar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Inscripción aprobada" })).toBeVisible();
    await expect(page.getByRole("group", { name: joven.email }).getByText("Aprobada")).toBeVisible();
    const summary = page.getByRole("region", { name: "Cupos e inscripciones" });
    await expect(summary.getByText("1 de 1 · 0 libres")).toBeVisible();
  });

  test("la persona ve su lugar confirmado en Mi C3", async ({ page }) => {
    await login(page, joven.email, joven.password, "/mi-c3");
    await expect(page.getByText("Confirmadas")).toBeVisible();
    await expect(page.getByText("C3 confirmó tu lugar.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver la experiencia" })).toBeVisible();
  });

  test("C3 cierra y reabre inscripciones desde la tarjeta", async ({ page }) => {
    await openAdminExperiences(page);
    const region = page.getByRole("region", { name: editedTitle });
    await region.getByRole("button", { name: "Cerrar inscripciones" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Inscripciones cerradas" })).toBeVisible();
    await expect(region.getByText("Inscripciones cerradas", { exact: true })).toBeVisible();

    await region.getByRole("button", { name: "Abrir inscripciones" }).click();
    const reopen = region.getByRole("group", { name: "Reabrir inscripciones" });
    await expect(reopen.getByRole("button", { name: "Confirmar apertura" })).toBeDisabled();
    await reopen.getByLabel("Nuevo cierre de inscripciones").fill("2027-06-05T12:00");
    await reopen.getByRole("button", { name: "Confirmar apertura" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Inscripciones abiertas" })).toBeVisible();
    await expect(region.getByText("Inscripciones abiertas", { exact: true })).toBeVisible();
  });

  test("C3 concluye la experiencia: queda histórica, sin inscripciones y con el calendario bloqueado", async ({ page }) => {
    await openAdminExperiences(page);
    const region = page.getByRole("region", { name: editedTitle });
    await region.getByRole("button", { name: "Marcar concluida" }).click();
    const confirmation = region.getByRole("group", { name: /Confirmar/ });
    await expect(confirmation).toContainText("pasa a ser histórica");
    await confirmation.getByRole("button", { name: "Sí, marcar concluida" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Experiencia marcada como concluida" })).toBeVisible();
    await expect(region.getByText("Concluida", { exact: true })).toBeVisible();
    await expect(region.getByRole("button", { name: "Publicar", exact: true })).toHaveCount(0);
    await expect(region.getByRole("button", { name: "Abrir inscripciones" })).toHaveCount(0);
    await expect(region.getByText("Experiencia histórica")).toBeVisible();

    await region.getByRole("button", { name: "Editar", exact: true }).click();
    await expect(page.locator("#exp-inicio")).toBeDisabled();
    await expect(page.locator("#exp-cupos")).toBeDisabled();
    await expect(page.locator("#exp-tipo")).toBeDisabled();
    await expect(page.getByText("La experiencia ya concluyó: este dato queda como registro histórico.").first()).toBeVisible();
    await expect(page.locator("#exp-titulo")).toBeEnabled();
  });

  test("el público ve la experiencia concluida como historia, sin inscripción", async ({ page }) => {
    await page.goto(experienceHref);
    await expect(page.getByText("Esta experiencia concluyó.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Inscribirme", exact: true })).toHaveCount(0);
    await page.goto(`${experienceHref}/inscripcion`);
    await expect(page).toHaveURL(/\/inscripcion$/);
    await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
  });

  test("solo C3 administra: sin sesión es 401 y con una cuenta común es 403, sin cambios", async ({ request }) => {
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
    const signIn = await request.post(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`, {
      data: { email: joven.email, password: joven.password, returnSecureToken: true },
    });
    expect(signIn.ok()).toBeTruthy();
    const { idToken } = await signIn.json() as { idToken: string };
    const body = { title: "Intento sin permiso", kind: "charla", summary: "Una persona común no puede editar experiencias." };

    expect((await request.put(`/api/admin/experiencias/${experienceId}`, { data: body })).status()).toBe(401);
    expect((await request.put(`/api/admin/experiencias/${experienceId}`, { data: body, headers: { Authorization: `Bearer ${idToken}` } })).status()).toBe(403);
    expect((await request.patch(`/api/admin/experiencias/${experienceId}`, { data: { status: "draft" }, headers: { Authorization: `Bearer ${idToken}` } })).status()).toBe(403);
    expect((await request.post(`/api/admin/experiencias/${experienceId}/inscripcion`, { data: { action: "open" }, headers: { Authorization: `Bearer ${idToken}` } })).status()).toBe(403);
    expect((await request.post("/api/admin/experiencias", { data: body, headers: { Authorization: `Bearer ${idToken}` } })).status()).toBe(403);
    expect((await request.get(`/api/admin/inscripciones?experienceId=${experienceId}`, { headers: { Authorization: `Bearer ${idToken}` } })).status()).toBe(403);

    // Una experiencia concluida no se reabre ni se publica de nuevo, ni siquiera por quien administra.
    const adminSignIn = await request.post(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true },
    });
    const adminToken = (await adminSignIn.json() as { idToken: string }).idToken;
    const reopen = await request.patch(`/api/admin/experiencias/${experienceId}`, { data: { status: "published" }, headers: { Authorization: `Bearer ${adminToken}` } });
    expect(reopen.status()).toBe(409);
    expect((await reopen.json()).error.code).toBe("experiencia_historica");
    const open = await request.post(`/api/admin/experiencias/${experienceId}/inscripcion`, { data: { action: "open", registrationClosesAt: "2027-06-05T12:00:00.000Z" }, headers: { Authorization: `Bearer ${adminToken}` } });
    expect(open.status()).toBe(409);
    const enroll = await request.post(`/api/experiencias/${experienceId}/inscripcion`, { headers: { Authorization: `Bearer ${idToken}` } });
    expect(enroll.status()).toBe(404);
  });
});
