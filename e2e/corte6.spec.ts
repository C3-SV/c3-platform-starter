import { expect, test } from "@playwright/test";
import { expectSignedIn } from "./helpers";

/**
 * Corte 6: perfil y trayectoria (V08) con lo autodeclarado separado de lo que registra C3, y comprobación de
 * que las vistas móviles no desbordan la pantalla.
 */
const stamp = Date.now().toString(36);
const persona = { name: "Lucía Robles de Prueba", email: `lucia.${stamp}@correo.test`, password: "clave-lucia-123" };

async function register(page: import("@playwright/test").Page) {
  await page.goto("/acceso?modo=registro");
  const form = page.locator("form").filter({ has: page.locator("#r-nombre") });
  await page.locator("#r-nombre").fill(persona.name);
  await page.locator("#r-correo").fill(persona.email);
  await page.locator("#r-pass").fill(persona.password);
  await form.locator('input[type="checkbox"]').check();
  await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expectSignedIn(page);
}

test.describe.serial("Corte 6: perfil y trayectoria", () => {
  test("la persona registrada ve su trayectoria, separada de lo que escribió", async ({ page }) => {
    await register(page);
    await page.goto("/trayectoria");
    await expect(page.getByRole("heading", { level: 1, name: persona.name })).toBeVisible();
    await expect(page.getByText("Todavía no escribiste nada.")).toBeVisible();
    await expect(page.getByText("Registrada por C3")).toBeVisible();
    await expect(page.getByText("Todavía no tenés trayectoria registrada.")).toBeVisible();
  });

  test("Cuenta valida los enlaces y guarda el perfil separado de la trayectoria", async ({ page }) => {
    await page.goto("/acceso?next=/trayectoria");
    await page.locator("#l-correo").fill(persona.email);
    await page.locator("#l-pass").fill(persona.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expectSignedIn(page);
    await page.goto("/cuenta");

    await page.locator("#cuenta-github").fill("http://sin-seguridad.test");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByText("El enlace debe empezar con https://")).toBeVisible();

    await page.locator("#cuenta-github").fill("https://github.com/lucia-prueba");
    await page.locator("#cuenta-school").fill("Ingeniería en Sistemas · UCA");
    await page.locator("#cuenta-bio").fill("Me interesan los problemas de optimización y el backend.");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Cambios guardados" })).toBeVisible();
    await expect(page.locator("#cuenta-bio")).toHaveValue("Me interesan los problemas de optimización y el backend.");
    await expect(page.locator("#cuenta-school")).toHaveValue("Ingeniería en Sistemas · UCA");

    await page.reload();
    await expect(page.locator("#cuenta-bio")).toHaveValue("Me interesan los problemas de optimización y el backend.");
    await page.goto("/trayectoria");
    await expect(page.getByText("Me interesan los problemas de optimización y el backend.")).toBeVisible();
    await expect(page.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute("href", "https://github.com/lucia-prueba");
  });

  test("la navegación de Mi C3 lleva a la trayectoria (barra inferior en móvil, cabecera en escritorio)", async ({ page, isMobile }) => {
    await page.goto("/acceso?next=/mi-c3");
    await page.locator("#l-correo").fill(persona.email);
    await page.locator("#l-pass").fill(persona.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expectSignedIn(page);
    await page.goto("/mi-c3");
    const navigation = page.getByRole("navigation", { name: isMobile ? "Navegación móvil" : "Principal" });
    await navigation.getByRole("link", { name: "Trayectoria", exact: true }).click();
    await expect(page).toHaveURL(/\/trayectoria$/);
  });

  test("las vistas móviles y públicas no desbordan horizontalmente", async ({ page }) => {
    for (const path of ["/mi-c3", "/trayectoria", "/empresa/proponer", "/acceso"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `desbordamiento en ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
