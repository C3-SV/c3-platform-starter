import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { expectSignedIn } from "./helpers";

/**
 * Auditoría automática con axe-core (WCAG 2.x A y AA). Falla con cualquier incumplimiento serio o crítico.
 * Los incumplimientos menores se listan en el informe de Playwright, pero no bloquean.
 */
const stamp = Date.now().toString(36);
const persona = { name: "Lucía Robles de Prueba", email: `lucia.${stamp}@correo.test`, password: "clave-lucia-123" };

async function expectNoSeriousViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.help} · ${violation.nodes.length} elemento(s)`);
  expect(serious, `incumplimientos serios en ${label}`).toEqual([]);
}

test("las vistas sin sesión no tienen incumplimientos serios de accesibilidad", async ({ page }) => {
  for (const path of ["/", "/explorar", "/acceso", "/empresa/proponer", "/empresa", "/mi-c3", "/trayectoria", "/admin"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoSeriousViolations(page, path);
  }
});

test("las vistas de una persona registrada no tienen incumplimientos serios de accesibilidad", async ({ page }) => {
  await page.goto("/acceso?modo=registro");
  const form = page.locator("form").filter({ has: page.locator("#r-nombre") });
  await page.locator("#r-nombre").fill(persona.name);
  await page.locator("#r-correo").fill(persona.email);
  await page.locator("#r-pass").fill(persona.password);
  await form.locator('input[type="checkbox"]').check();
  await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expectSignedIn(page);

  for (const path of ["/mi-c3", "/trayectoria"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoSeriousViolations(page, path);
  }
});
