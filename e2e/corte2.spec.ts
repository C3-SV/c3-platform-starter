import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";
import { expectSignedIn, openAdminSection } from "./helpers";

/**
 * Corte 2 de punta a punta: un joven se inscribe, C3 aprueba desde su panel (en otro contexto de navegador),
 * el joven guarda un borrador, recibe validaciones y envía la entrega. Cada ejecución crea sus propios datos.
 */
const BASE = "http://localhost:3100";
const stamp = Date.now().toString(36);
const experienceTitle = `Experiencia individual ${stamp}`;
const challengeTitle = `Challenge individual ${stamp}`;
const joven = { name: "Luis Menjívar de Prueba", email: `luis.${stamp}@correo.test`, password: "clave-luis-123" };
const solucion = "Heurística de inserción con penalización por ventana incumplida y una mejora local posterior.";
let challengeId = "";

/** Inicia sesión y espera a que la sesión esté confirmada («Salir» visible) antes de seguir navegando. */
async function loginAt(page: Page, email: string, password: string, next: string) {
  await page.goto(`/acceso?next=${encodeURIComponent(next)}`);
  await page.locator("#l-correo").fill(email);
  await page.locator("#l-pass").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expectSignedIn(page);
}

test.describe.serial("Corte 2: participación individual", () => {
  test("el administrador publica un challenge individual", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    try {
      await loginAt(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/experiencias");
      await expect(page.getByRole("heading", { name: "Experiencias y challenges", level: 1 })).toBeVisible();

      const experienceForm = page.locator("form").filter({ has: page.locator("#exp-titulo") });
      await page.locator("#exp-titulo").fill(experienceTitle);
      await page.locator("#exp-tipo").selectOption("hackathon");
      await page.locator("#exp-resumen").fill("Challenges individuales de prueba para el segundo corte.");
      await page.locator("#exp-abre").fill("2026-10-01T00:00");
      await page.locator("#exp-cierra").fill("2027-06-01T23:59");
      await experienceForm.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Experiencia guardada" })).toBeVisible();

      const region = page.getByRole("region", { name: experienceTitle });
      await region.getByRole("button", { name: "Publicar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();

      const challengeForm = page.locator("form").filter({ has: page.locator("#ret-titulo") });
      await page.locator("#ret-exp").selectOption({ label: experienceTitle });
      await page.locator("#ret-titulo").fill(challengeTitle);
      await page.locator("#ret-org").fill("Distribuidora Atlas de prueba");
      await page.locator("#ret-resumen").fill("Cruzar extractos bancarios con el libro contable y marcar diferencias.");
      await page.locator("#ret-problema").fill("Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, y las diferencias llegan tarde.");
      await page.locator("#ret-entregables").fill("Repositorio con instrucciones\nDemo de 4 minutos");
      await page.locator("#ret-rubrica").fill("Exactitud de la conciliación | 10\nClaridad del enfoque | 10");
      await page.locator("#ret-cierre").fill("2027-06-30T23:59");
      await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Challenge guardado como borrador" })).toBeVisible();
      await region.getByRole("button", { name: "Publicar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();

      await page.goto("/explorar");
      await page.getByRole("link", { name: new RegExp(challengeTitle) }).click();
      await expect(page).toHaveURL(/\/retos\/[^/]+$/);
      challengeId = new URL(page.url()).pathname.split("/").filter(Boolean)[1];
      expect(challengeId).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test("un joven se registra, se inscribe y su inscripción queda en revisión", async ({ page }) => {
    await page.goto("/acceso?modo=registro");
    const registerForm = page.locator("form").filter({ has: page.locator("#r-nombre") });
    await page.locator("#r-nombre").fill(joven.name);
    await page.locator("#r-correo").fill(joven.email);
    await page.locator("#r-pass").fill(joven.password);
    await registerForm.locator('input[type="checkbox"]').check();
    await registerForm.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expectSignedIn(page);

    await page.goto(`/retos/${challengeId}/inscripcion`);
    await expect(page.getByRole("heading", { level: 1, name: challengeTitle })).toBeVisible();
    await page.getByRole("button", { name: "Inscribirme", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Inscripción enviada" })).toBeVisible();
    await expect(page.getByText("Tu inscripción está en revisión por C3")).toBeVisible();

    await page.goto("/mi-c3");
    await expect(page.getByRole("heading", { level: 1, name: `Hola, ${joven.name.split(" ")[0]}` })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "En espera" })).toBeVisible();
    await expect(page.getByText("Esperando respuesta de C3.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toHaveCount(0);
    await expect(page.getByText(challengeTitle)).toBeVisible();
  });

  test("C3 aprueba la inscripción desde su panel", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    try {
      await loginAt(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/experiencias");
      await openAdminSection(page, "Inscripciones y equipos");
      await page.locator("#ins-reto").selectOption({ label: challengeTitle });
      const row = page.getByRole("group", { name: joven.email });
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Aprobar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Inscripción aprobada" })).toBeVisible();
      await expect(page.getByRole("group", { name: joven.email }).getByText("Aprobada")).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("el joven ve su challenge habilitado, valida la entrega, guarda borrador y envía", async ({ page }) => {
    await loginAt(page, joven.email, joven.password, "/mi-c3");
    await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toBeVisible();
    await page.getByRole("link", { name: "Abrir mi challenge" }).first().click();
    await expect(page.getByRole("heading", { level: 2, name: "Tu entrega" })).toBeVisible();

    await page.locator("#entrega-texto").fill("Muy corto");
    await page.getByRole("button", { name: "Enviar entrega", exact: true }).click();
    await expect(page.getByText("Para enviar, describí la solución con al menos 20 caracteres.")).toBeVisible();

    await page.locator("#entrega-texto").fill(solucion);
    await page.getByLabel("Enlace 1").fill("http://sin-seguridad.test/repo");
    await page.getByRole("button", { name: "Enviar entrega", exact: true }).click();
    await expect(page.getByText("Cada enlace debe empezar con https://")).toBeVisible();

    await page.getByLabel("Enlace 1").fill("https://github.com/equipo-de-prueba/conciliacion");
    await page.getByRole("button", { name: "Guardar borrador", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();
    await expect(page.getByText("Borrador", { exact: true }).first()).toBeVisible();

    await page.reload();
    await expect(page.locator("#entrega-texto")).toHaveValue(solucion);

    await page.getByRole("button", { name: "Enviar entrega", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Entrega enviada" })).toBeVisible();
    await expect(page.getByText("Entregada", { exact: true }).first()).toBeVisible();

    await page.goto("/mi-c3");
    await expect(page.getByRole("heading", { level: 2, name: "En curso" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toHaveCount(0);
  });

  test("una inscripción aprobada no se duplica y la página lo muestra", async ({ page }) => {
    await loginAt(page, joven.email, joven.password, `/retos/${challengeId}/inscripcion`);
    await expect(page.getByRole("link", { name: "Ir a mi challenge" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Inscribirme", exact: true })).toHaveCount(0);
  });
});
