import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { signOutUi } from "./helpers";

async function register(page: Page, name: string, email: string, password: string) {
  await page.goto("/acceso?modo=registro");
  const form = page.locator("form").filter({ has: page.locator("#r-nombre") });
  await page.locator("#r-nombre").fill(name);
  await page.locator("#r-correo").fill(email);
  await page.locator("#r-pass").fill(password);
  await form.locator('input[type="checkbox"]').check();
  await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  // Sin destino previo, la cuenta nueva llega a Mi C3.
  await expect(page).toHaveURL(/\/mi-c3$/);
}

test.describe("Cuenta", () => {
  test("una visitante puede iniciar sesión desde Cuenta sin ver datos privados", async ({ page }) => {
    await page.goto("/cuenta");
    await expect(page.getByRole("heading", { name: "Entrá para administrar tu cuenta", exact: true })).toBeVisible();
    await expect(page.getByText("Iniciá sesión para administrar tu cuenta.")).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Entrar", exact: true })).toHaveAttribute("href", /\/acceso\?next=/);
    await expect(page.getByRole("heading", { name: "Información personal" })).toHaveCount(0);
  });

  test("edita y persiste perfil propio, y mantiene separado el registro oficial", async ({ page }) => {
    const id = randomUUID();
    const email = `cuenta.${id}@correo.test`;
    const originalName = "Lucía Robles de Prueba";
    const newName = "Lucía Robles Actualizada";
    await register(page, originalName, email, "clave-lucia-123");
    await page.goto("/");

    await page.getByRole("button", { name: /^Menú de la cuenta/ }).click();
    await page.getByRole("link", { name: /^Cuenta/ }).click();
    await expect(page).toHaveURL(/\/cuenta$/);
    await expect(page.getByRole("heading", { name: "Tu cuenta", exact: true })).toBeVisible();
    await expect(page.getByLabel("Correo")).toHaveValue(email);
    await expect(page.getByText("No verificado", { exact: true })).toBeVisible();

    await page.goto("/cuenta?uid=otra-persona");
    await expect(page.getByLabel("Correo")).toHaveValue(email);
    await expect(page.getByLabel("Nombre visible")).toHaveValue(originalName);

    await page.getByLabel("GitHub").fill("http://github.com/lucia-prueba");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByText("El enlace debe empezar con https://")).toBeVisible();

    await page.getByLabel("Nombre visible").fill(newName);
    await expect(page.getByLabel("Nombre visible")).toHaveValue(newName);
    await page.getByLabel("Centro de estudio o trabajo").fill("UCA");
    await page.getByLabel("Presentación").fill("Me interesan los challenges de backend.");
    await page.getByLabel("GitHub").fill("https://github.com/lucia-prueba");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Cambios guardados" })).toBeVisible();
    await expect(page.getByLabel("Nombre visible")).toHaveValue(newName);

    await page.reload();
    await expect(page.getByLabel("Nombre visible")).toHaveValue(newName);
    await expect(page.getByLabel("Centro de estudio o trabajo")).toHaveValue("UCA");

    await page.goto("/trayectoria");
    await expect(page.getByRole("heading", { name: newName })).toBeVisible();
    await expect(page.getByText("Registrada por C3")).toBeVisible();
    await expect(page.getByRole("link", { name: "Editar en Cuenta" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar perfil" })).toHaveCount(0);
  });

  test("valida y cambia contraseña con reautenticación, y solicita verificación de correo", async ({ page }) => {
    const id = randomUUID();
    const email = `seguridad.${id}@correo.test`;
    const currentPassword = "clave-actual-123";
    const newPassword = "clave-nueva-456";
    await register(page, "María Seguridad de Prueba", email, currentPassword);
    await page.goto("/cuenta");

    await page.getByLabel("Nueva contraseña").fill(newPassword);
    await page.getByLabel("Confirmar contraseña").fill("distinta-123");
    await page.getByRole("button", { name: "Cambiar contraseña", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Las contraseñas nuevas no coinciden" })).toBeVisible();

    await page.getByRole("button", { name: "Enviar verificación", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Firebase generó el enlace" })).toBeVisible();

    await page.getByLabel("Contraseña actual").fill(currentPassword);
    await page.getByLabel("Nueva contraseña").fill(newPassword);
    await page.getByLabel("Confirmar contraseña").fill(newPassword);
    await page.getByRole("button", { name: "Cambiar contraseña", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Contraseña actualizada" })).toBeVisible();
    await signOutUi(page);
    await page.goto("/acceso");
    await page.locator("#l-correo").fill(email);
    await page.locator("#l-pass").fill(newPassword);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/mi-c3$/);
  });

  test("en móvil permite navegar y no desborda", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "movil", "La navegación inferior se comprueba en el proyecto móvil.");
    const id = randomUUID();
    await register(page, "Noelia Móvil de Prueba", `movil.${id}@correo.test`, "clave-movil-123");
    await page.goto("/cuenta");
    const tabs = page.getByRole("navigation", { name: "Navegación móvil" });
    await expect(tabs.getByRole("link", { name: "Mi C3", exact: true })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Trayectoria", exact: true })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Cuenta", exact: true })).toHaveAttribute("aria-current", "page");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
