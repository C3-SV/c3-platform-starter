import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

/**
 * Corte 3 de punta a punta: dos personas se inscriben por equipo, C3 aprueba, la líder crea el equipo,
 * la otra persona se une con el código, el equipo queda habilitado y solo la líder envía la entrega.
 */
const BASE = "http://localhost:3100";
const stamp = Date.now().toString(36);
const experienceTitle = `Experiencia por equipos ${stamp}`;
const challengeTitle = `Conciliación por equipos ${stamp}`;
const lider = { name: "Ana Pineda de Prueba", email: `ana.${stamp}@correo.test`, password: "clave-ana-123" };
const integrante = { name: "Luis Menjívar de Prueba", email: `luis.${stamp}@correo.test`, password: "clave-luis-123" };
const solucion = "Conciliación automática con reglas de tolerancia y revisión manual de las diferencias.";
let challengeId = "";
let teamCode = "";

/** Inicia sesión y espera a que la sesión esté confirmada («Salir» visible) antes de seguir navegando. */
async function loginAt(page: Page, email: string, password: string, next: string) {
  await page.goto(`/acceso?next=${encodeURIComponent(next)}`);
  await page.locator("#l-correo").fill(email);
  await page.locator("#l-pass").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
}

async function registerAt(page: Page, person: { name: string; email: string; password: string }) {
  await page.goto("/acceso?modo=registro");
  const form = page.locator("form").filter({ has: page.locator("#r-nombre") });
  await page.locator("#r-nombre").fill(person.name);
  await page.locator("#r-correo").fill(person.email);
  await page.locator("#r-pass").fill(person.password);
  await form.locator('input[type="checkbox"]').check();
  await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
}

async function openInscripcion(page: Page) {
  await page.goto(`/retos/${challengeId}/inscripcion`);
  await expect(page.getByRole("heading", { level: 1, name: challengeTitle })).toBeVisible();
}

/** El reto de esta prueba acepta solo equipos: no aparece la elección de modalidad y la inscripción es por equipo. */
async function enrollAsTeam(page: Page) {
  await openInscripcion(page);
  await expect(page.getByText("Este reto se inscribe por equipo.")).toBeVisible();
  await page.getByRole("button", { name: "Inscribirme", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Inscripción enviada" })).toBeVisible();
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

test.describe.serial("Corte 3: equipos", () => {
  test("el administrador publica un reto que se inscribe solo por equipo", async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const experienceForm = page.locator("form").filter({ has: page.locator("#exp-titulo") });
      await page.locator("#exp-titulo").fill(experienceTitle);
      await page.locator("#exp-tipo").selectOption("hackathon");
      await page.locator("#exp-resumen").fill("Retos por equipo para validar la conformación y la entrega grupal.");
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
      await page.locator("#ret-resumen").fill("Conciliar extractos bancarios y libro contable en equipo.");
      await page.locator("#ret-problema").fill("Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, y las diferencias llegan tarde.");
      await page.locator("#ret-entregables").fill("Repositorio con instrucciones\nDemo de 4 minutos");
      await page.locator("#ret-rubrica").fill("Exactitud de la conciliación | 10");
      await page.getByLabel("Individual", { exact: true }).uncheck();
      await page.getByLabel("Equipo", { exact: true }).check();
      await page.locator("#ret-min").fill("2");
      await page.locator("#ret-max").fill("3");
      await page.locator("#ret-cierre").fill("2027-06-30T23:59");
      await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Reto guardado como borrador" })).toBeVisible();
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

  test("la líder se registra, se inscribe por equipo y crea el equipo con código", async ({ page }) => {
    await registerAt(page, lider);
    await enrollAsTeam(page);
    await expect(page.getByText("Tu inscripción por equipo está en revisión por C3")).toBeVisible();
  });

  test("la integrante se registra e inscribe por equipo", async ({ page }) => {
    await registerAt(page, integrante);
    await enrollAsTeam(page);
    await expect(page.getByText("Tu inscripción por equipo está en revisión por C3")).toBeVisible();
  });

  test("C3 aprueba a las dos inscripciones desde su panel", async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      await page.getByRole("button", { name: "Inscripciones y equipos", exact: true }).click();
      await page.locator("#ins-reto").selectOption({ label: challengeTitle });
      for (const person of [lider, integrante]) {
        const row = page.getByRole("group", { name: person.email });
        await expect(row).toBeVisible();
        await row.getByRole("button", { name: "Aprobar", exact: true }).click();
        await expect(page.getByRole("status").filter({ hasText: "Inscripción aprobada" })).toBeVisible();
      }
    });
  });

  test("la líder crea el equipo y obtiene el código C3-XXXX", async ({ page }) => {
    await loginAt(page, lider.email, lider.password, `/retos/${challengeId}/inscripcion`);
    await openInscripcion(page);
    await page.locator("#equipo-nombre").fill("Rutas en caliente");
    await page.getByRole("button", { name: "Crear equipo", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Equipo creado" })).toBeVisible();
    const code = page.getByTestId("codigo-equipo");
    await expect(code).toHaveText(/^C3-[23456789A-HJ-KMNP-Z]{4}$/);
    teamCode = (await code.textContent()) ?? "";
    expect(teamCode).toMatch(/^C3-/);
    await expect(page.getByText("Incompleto", { exact: true })).toBeVisible();
  });

  test("la integrante se une con el código y el equipo queda habilitado", async ({ page }) => {
    await loginAt(page, integrante.email, integrante.password, `/retos/${challengeId}/inscripcion`);
    await openInscripcion(page);
    await page.locator("#equipo-codigo").fill(teamCode.toLowerCase());
    await page.getByRole("button", { name: "Unirme con código", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Te uniste al equipo" })).toBeVisible();
    await expect(page.getByText("Habilitado", { exact: true })).toBeVisible();
    await expect(page.getByText(integrante.name)).toBeVisible();
  });

  test("solo la líder envía la entrega del equipo; la integrante la ve en solo lectura", async ({ page, browser }) => {
    await loginAt(page, lider.email, lider.password, `/mi-c3/retos/${challengeId}`);
    await expect(page.getByRole("heading", { level: 2, name: "Tu entrega" })).toBeVisible();
    await page.locator("#entrega-texto").fill(solucion);
    await page.getByLabel("Enlace 1").fill("https://github.com/equipo-de-prueba/conciliacion");
    await page.getByRole("button", { name: "Enviar entrega", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Entrega enviada" })).toBeVisible();

    // Otro contexto de navegador: la sesión de Firebase vive en el almacenamiento del contexto, no en cookies.
    const context = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 } });
    const second = await context.newPage();
    try {
      await loginAt(second, integrante.email, integrante.password, `/mi-c3/retos/${challengeId}`);
      await expect(second.getByRole("heading", { level: 2, name: "Tu entrega" })).toBeVisible();
      await expect(second.locator("#entrega-texto")).toBeDisabled();
      await expect(second.locator("#entrega-texto")).toHaveValue(solucion);
      await expect(second.getByText("La entrega quedó registrada y no se puede cambiar.")).toBeVisible();
      await expect(second.getByText("Entregada", { exact: true }).first()).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
