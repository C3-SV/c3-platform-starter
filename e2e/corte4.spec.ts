import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";
import { expectSignedIn, openAdminSection } from "./helpers";

/**
 * Corte 4 de punta a punta: una empresa propone sin cuenta; C3 pide ajustes, crea la organización,
 * vincula a su representante por correo, acepta la propuesta y publica un challenge vinculado; la representante
 * entra a su espacio de empresa y ve solo lo suyo.
 */
const BASE = "http://localhost:3100";
const stamp = Date.now().toString(36);
const empresa = {
  companyName: `Distribuidora Atlas ${stamp}`,
  contactName: "Sofía Guzmán, gerencia",
  contactEmail: `sguzman.${stamp}@atlas.test`,
  problem: "Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, con diferencias tardías.",
};
const representante = { name: "Sofía Guzmán de Prueba", email: `rep.${stamp}@atlas.test`, password: "clave-rep-123" };
const challengeTitle = `Conciliación de prueba ${stamp}`;
const experienceTitle = `Experiencia empresarial ${stamp}`;
let reference = "";

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
    await loginAt(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/experiencias");
    await openAdminSection(page, "Propuestas");
    await work(page);
  } finally {
    await context.close();
  }
}

test.describe.serial("Corte 4: empresas", () => {
  test("una empresa propone sin cuenta: valida y recibe confirmación con referencia", async ({ page }) => {
    await page.goto("/empresa/proponer");
    await page.getByRole("button", { name: "Enviar propuesta", exact: true }).click();
    await expect(page.getByText("Organización: escribí al menos 2 caracteres.")).toBeVisible();

    await page.locator("#p-org").fill(empresa.companyName);
    await page.locator("#p-nombre").fill(empresa.contactName);
    await page.locator("#p-correo").fill("sin-arroba");
    await page.locator("#p-problema").fill(empresa.problem);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enviar propuesta", exact: true }).click();
    await expect(page.getByText("Revisá el formato del correo de contacto.")).toBeVisible();

    await page.locator("#p-correo").fill(empresa.contactEmail);
    await page.getByRole("button", { name: "Enviar propuesta", exact: true }).click();
    await expect(page.getByText("Recibimos tu propuesta")).toBeVisible();
    reference = (await page.locator("strong").first().textContent()) ?? "";
    expect(reference).toMatch(/^[A-Z0-9]{6}$/);
  });

  test("C3 pide ajustes a la propuesta con una nota para la empresa", async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const region = page.getByRole("region", { name: `Propuesta ${reference}` });
      await expect(region).toBeVisible();
      await region.locator("textarea").first().fill("corto");
      await region.getByRole("button", { name: "Pedir ajustes", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: "Explicá qué ajustes necesitás" })).toBeVisible();

      await region.locator("textarea").first().fill("Definan el formato de salida esperado y el dataset de prueba.");
      await region.getByRole("button", { name: "Pedir ajustes", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Ajustes pedidos" })).toBeVisible();
      await expect(region.getByText("Requiere ajustes")).toBeVisible();
    });
  });

  test("C3 crea la organización y la empresa se registra; C3 vincula al representante por correo", async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      await page.locator("#org-nombre").fill(empresa.companyName);
      await page.getByRole("button", { name: "Crear organización", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Organización creada" })).toBeVisible();
    });

    const context = await browser.newContext({ baseURL: BASE });
    const rep = await context.newPage();
    try {
      await rep.goto("/acceso?modo=registro");
      const form = rep.locator("form").filter({ has: rep.locator("#r-nombre") });
      await rep.locator("#r-nombre").fill(representante.name);
      await rep.locator("#r-correo").fill(representante.email);
      await rep.locator("#r-pass").fill(representante.password);
      await form.locator('input[type="checkbox"]').check();
      await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
      await expectSignedIn(rep);
    } finally {
      await context.close();
    }

    await withAdmin(browser, async (page) => {
      const orgForm = page.getByRole("form", { name: `Representantes de ${empresa.companyName}` });
      await orgForm.getByLabel("Correo de la persona representante").fill(representante.email);
      await orgForm.getByRole("button", { name: "Vincular representante", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Representante vinculado" })).toBeVisible();
    });
  });

  test("C3 acepta la propuesta vinculada a la organización y publica el challenge", async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const region = page.getByRole("region", { name: `Propuesta ${reference}` });
      await region.getByLabel("Organización (opcional)").selectOption({ label: empresa.companyName });
      await region.getByRole("button", { name: "Aceptar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Propuesta aceptada" })).toBeVisible();

      await openAdminSection(page, "Experiencias y challenges");
      const experienceForm = page.locator("form").filter({ has: page.locator("#exp-titulo") });
      await page.locator("#exp-titulo").fill(experienceTitle);
      await page.locator("#exp-tipo").selectOption("challenge_empresarial");
      await page.locator("#exp-resumen").fill("Challenges que plantean empresas reales para equipos jóvenes.");
      await page.locator("#exp-abre").fill("2026-10-01T00:00");
      await page.locator("#exp-cierra").fill("2027-06-01T23:59");
      await experienceForm.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Experiencia guardada" })).toBeVisible();
      const experienceRegion = page.getByRole("region", { name: experienceTitle });
      await experienceRegion.getByRole("button", { name: "Publicar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();

      const challengeForm = page.locator("form").filter({ has: page.locator("#ret-titulo") });
      await page.locator("#ret-exp").selectOption({ label: experienceTitle });
      await page.locator("#ret-titulo").fill(challengeTitle);
      await page.locator("#ret-org").fill(empresa.companyName);
      await page.locator("#ret-org-vinculada").selectOption({ label: empresa.companyName });
      await page.locator("#ret-resumen").fill("Cruzar extractos bancarios con el libro contable y marcar diferencias.");
      await page.locator("#ret-problema").fill(empresa.problem);
      await page.locator("#ret-entregables").fill("Repositorio con instrucciones");
      await page.locator("#ret-rubrica").fill("Exactitud de la conciliación | 10");
      await page.locator("#ret-cierre").fill("2027-06-30T23:59");
      await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Challenge guardado como borrador" })).toBeVisible();
      await experienceRegion.getByRole("button", { name: "Publicar", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();
    });
  });

  test("la representante ve su espacio de empresa con el challenge y la propuesta; sin vínculo no ve nada", async ({ browser, page }) => {
    await loginAt(page, representante.email, representante.password, "/empresa");
    await expect(page.getByRole("heading", { level: 1, name: empresa.companyName })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Tus challenges" })).toBeVisible();
    await expect(page.getByText(challengeTitle)).toBeVisible();
    await expect(page.getByText("Todavía no hay soluciones enviadas")).toBeVisible();
    await expect(page.getByText(`Propuesta ${reference}`)).toBeVisible();
    await expect(page.getByText("Aceptada", { exact: true }).first()).toBeVisible();

    const context = await browser.newContext({ baseURL: BASE });
    const outsider = await context.newPage();
    try {
      await outsider.goto("/empresa");
      await expect(outsider.getByText("Entrá para ver tu espacio de empresa")).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
