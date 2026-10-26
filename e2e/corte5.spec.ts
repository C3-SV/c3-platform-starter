import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";
import { expectSignedIn } from "./helpers";

/**
 * Corte 5 en el navegador: C3 asigna un jurado por correo, el jurado ve que debe esperar el cierre de entregas,
 * la publicación queda bloqueada sin soluciones, y C3 revoca el acceso. La evaluación completa, el promedio y la
 * publicación con ganadores se prueban en el emulador con reloj controlado (tests/emulator/evaluation.test.ts),
 * porque en el navegador el cierre de entregas no puede adelantarse.
 */
const BASE = "http://localhost:3100";
const stamp = Date.now().toString(36);
const experienceTitle = `Experiencia con jurados ${stamp}`;
const challengeTitle = `Challenge evaluable ${stamp}`;
const jurado = { name: "Marco Solano de Prueba", email: `jurado.${stamp}@correo.test`, password: "clave-jurado-123" };
let challengeId = "";

async function loginAt(page: Page, email: string, password: string, next: string) {
  await page.goto(`/acceso?next=${encodeURIComponent(next)}`);
  await page.locator("#l-correo").fill(email);
  await page.locator("#l-pass").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expectSignedIn(page);
}

async function withAdmin(browser: Browser, work: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await loginAt(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin");
    await work(page);
  } finally {
    await context.close();
  }
}

test.describe.serial("Corte 5: jurados y resultados", () => {
  test("el administrador publica un challenge que tendrá jurados", async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const experienceForm = page.locator("form").filter({ has: page.locator("#exp-titulo") });
      await page.locator("#exp-titulo").fill(experienceTitle);
      await page.locator("#exp-tipo").selectOption("competencia");
      await page.locator("#exp-resumen").fill("Competencia de prueba para validar jurados y resultados.");
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
      await page.locator("#ret-org").fill("Transportes Delta de prueba");
      await page.locator("#ret-resumen").fill("Armar rutas diarias respetando las ventanas horarias del cliente.");
      await page.locator("#ret-problema").fill("Transportes Delta arma las rutas a mano cada mañana y no respeta las ventanas horarias pactadas.");
      await page.locator("#ret-entregables").fill("Repositorio con instrucciones");
      await page.locator("#ret-rubrica").fill("Calidad del resultado | 10\nClaridad del enfoque | 10");
      await page.locator("#ret-cierre").fill("2027-06-30T23:59");
      await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Challenge guardado como borrador" })).toBeVisible();
      await region.getByRole("button", { name: "Publicar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();
    });

    const context = await browser.newContext({ baseURL: BASE });
    const page = await context.newPage();
    try {
      await page.goto("/explorar");
      await page.getByRole("link", { name: new RegExp(challengeTitle) }).click();
      await expect(page).toHaveURL(/\/retos\/[^/]+$/);
      challengeId = new URL(page.url()).pathname.split("/").filter(Boolean)[1];
    } finally {
      await context.close();
    }
    expect(challengeId).toBeTruthy();
  });

  test("el jurado se registra; el administrador lo asigna por correo y ve la rúbrica", async ({ browser, page }) => {
    await page.goto("/acceso?modo=registro");
    const form = page.locator("form").filter({ has: page.locator("#r-nombre") });
    await page.locator("#r-nombre").fill(jurado.name);
    await page.locator("#r-correo").fill(jurado.email);
    await page.locator("#r-pass").fill(jurado.password);
    await form.locator('input[type="checkbox"]').check();
    await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expectSignedIn(page);

    await withAdmin(browser, async (admin) => {
      await admin.getByRole("button", { name: "Jurados y rúbricas", exact: true }).click();
      await admin.locator("#jur-reto").selectOption({ label: challengeTitle });
      await expect(admin.getByText("Calidad del resultado: 0 – 10")).toBeVisible();
      await admin.locator("#jur-correo").fill(jurado.email);
      await admin.locator("#jur-tipo").selectOption("externo");
      await admin.getByRole("button", { name: "Asignar jurado", exact: true }).click();
      await expect(admin.getByRole("status").filter({ hasText: "Jurado asignado" })).toBeVisible();
      await expect(admin.getByRole("group", { name: jurado.email })).toBeVisible();
    });
  });

  test("el jurado ve el challenge en Mi C3 y que debe esperar el cierre de entregas", async ({ page }) => {
    await loginAt(page, jurado.email, jurado.password, "/mi-c3");
    await expect(page.getByText("Como jurado", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "En espera" })).toBeVisible();
    await expect(page.getByText(challengeTitle)).toBeVisible();
    await expect(page.getByText("Esperando el cierre", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Ver detalle", exact: true }).click();
    await expect(page.getByText("Esperá el cierre de entregas")).toBeVisible();
    await expect(page.getByText("Todavía no hay soluciones enviadas para este challenge.")).toBeVisible();
  });

  test("la publicación queda bloqueada sin soluciones y C3 puede revocar al jurado", async ({ browser, page }) => {
    await withAdmin(browser, async (admin) => {
      await admin.getByRole("button", { name: "Resultados oficiales", exact: true }).click();
      await admin.locator("#res-reto").selectOption({ label: challengeTitle });
      await expect(admin.getByText("Todavía no hay soluciones enviadas para publicar.")).toBeVisible();
      await expect(admin.getByRole("button", { name: "Publicar resultado", exact: true })).toBeDisabled();

      await admin.getByRole("button", { name: "Jurados y rúbricas", exact: true }).click();
      await admin.locator("#jur-reto").selectOption({ label: challengeTitle });
      const row = admin.getByRole("group", { name: jurado.email });
      await row.getByRole("button", { name: "Revocar acceso", exact: true }).click();
      await expect(admin.getByRole("status").filter({ hasText: "Acceso revocado" })).toBeVisible();
    });

    await loginAt(page, jurado.email, jurado.password, "/mi-c3");
    await expect(page.getByText("Como jurado", { exact: true })).toHaveCount(0);
  });
});
