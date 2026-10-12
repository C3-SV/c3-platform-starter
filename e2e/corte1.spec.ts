import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

/**
 * Corte 1 de punta a punta: administrador crea y publica un reto; visitante lo consulta;
 * una persona nueva crea cuenta y vuelve al reto; permisos y errores se muestran con texto claro.
 * Los títulos llevan una marca de tiempo para que las dos ejecuciones (escritorio y móvil) no se mezclen.
 */
const stamp = Date.now().toString(36);
const expTitle = `Hackathon de prueba ${stamp}`;
const challengeTitle = `Ruteo de prueba ${stamp}`;
const joven = { name: "Ana Pineda de Prueba", email: `joven.${stamp}@correo.test`, password: "clave-joven-123" };
let challengeHref = "";

async function login(page: Page, email: string, password: string, next = "/") {
  await page.goto(`/acceso?next=${encodeURIComponent(next)}`);
  await page.locator("#l-correo").fill(email);
  await page.locator("#l-pass").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test.describe.serial("Corte 1: primer reto", () => {
  test("el administrador crea una experiencia y un reto, y los publica", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin");
    await expect(page.getByRole("heading", { name: "Experiencias y retos", level: 1 })).toBeVisible();

    const experienceForm = page.locator("form").filter({ has: page.locator("#exp-titulo") });
    await page.locator("#exp-titulo").fill(expTitle);
    await page.locator("#exp-tipo").selectOption("hackathon");
    await page.locator("#exp-resumen").fill("Fin de semana de retos de prueba para validar el flujo completo.");
    await page.locator("#exp-abre").fill("2026-10-01T00:00");
    await page.locator("#exp-cierra").fill("2027-06-01T23:59");
    await experienceForm.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Experiencia guardada" })).toBeVisible();

    const experienceRegion = page.getByRole("region", { name: expTitle });
    await expect(experienceRegion).toBeVisible();
    await experienceRegion.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();

    // Validación en servidor: el formulario de reto vacío muestra motivos por campo.
    const challengeForm = page.locator("form").filter({ has: page.locator("#ret-titulo") });
    await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByText("Nombre del reto: escribí al menos 3 caracteres.")).toBeVisible();

    await page.locator("#ret-exp").selectOption({ label: expTitle });
    await page.locator("#ret-titulo").fill(challengeTitle);
    await page.locator("#ret-org").fill("Transportes Delta de prueba");
    await page.locator("#ret-resumen").fill("Armar rutas diarias respetando las ventanas horarias del cliente.");
    await page.locator("#ret-problema").fill("Transportes Delta arma las rutas a mano cada mañana y no respeta las ventanas horarias que el cliente eligió al comprar.");
    await page.locator("#ret-entregables").fill("Repositorio con instrucciones\nDemo de 4 minutos");
    await page.locator("#ret-rubrica").fill("Calidad del resultado | 10\nClaridad del enfoque | 10");
    await page.getByLabel("Equipo", { exact: true }).check();
    await page.locator("#ret-cierre").fill("2027-06-30T23:59");
    await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Reto guardado como borrador" })).toBeVisible();

    await experienceRegion.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();
    await expect(experienceRegion.getByText(challengeTitle)).toBeVisible();
  });

  test("un visitante encuentra el reto en Explorar y ve su detalle", async ({ page }) => {
    await page.goto("/explorar");
    const card = page.getByRole("link", { name: new RegExp(challengeTitle) });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/retos\//);
    challengeHref = new URL(page.url()).pathname;

    await expect(page.getByRole("heading", { level: 1, name: challengeTitle })).toBeVisible();
    await expect(page.getByText("Transportes Delta de prueba").first()).toBeVisible();
    await expect(page.getByText("Repositorio con instrucciones")).toBeVisible();
    await expect(page.getByText("Calidad del resultado").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Inscribirme al reto" }).first()).toBeVisible();
  });

  test("una persona nueva crea cuenta, vuelve al reto y la sesión persiste al recargar", async ({ page }) => {
    await page.goto(challengeHref);
    await page.getByRole("link", { name: "Inscribirme al reto" }).first().click();
    await expect(page).toHaveURL(/\/acceso\?modo=registro/);

    const registerForm = page.locator("form").filter({ has: page.locator("#r-nombre") });
    await page.locator("#r-nombre").fill(joven.name);
    await page.locator("#r-correo").fill(joven.email);
    await page.locator("#r-pass").fill(joven.password);
    await registerForm.locator('input[type="checkbox"]').check();
    await registerForm.getByRole("button", { name: "Crear cuenta", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(challengeHref.replace(/\//g, "\\/")));
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
    // Con sesión, el llamado de V03 lleva a la inscripción del reto (V06).
    await expect(page).toHaveURL(/\/inscripcion$/);
    await expect(page.getByRole("button", { name: "Inscribirme", exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
  });

  test("una persona que no es administradora no accede al panel de C3", async ({ page }) => {
    await login(page, joven.email, joven.password, "/admin");
    await expect(page.getByText("Esta sección es solo para el equipo administrador de C3.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Experiencias y retos", level: 1 })).toHaveCount(0);
  });

  test("credenciales incorrectas muestran un error comprensible, sin confirmar si la cuenta existe", async ({ page }) => {
    await page.goto("/acceso");
    await page.locator("#l-correo").fill(joven.email);
    await page.locator("#l-pass").fill("contraseña-equivocada");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "No pudimos iniciar sesión" })).toBeVisible();
    await expect(page.getByText("El correo o la contraseña no coinciden.")).toBeVisible();
  });

  test("recuperar contraseña confirma el envío sin revelar si el correo está registrado", async ({ page }) => {
    await page.goto("/acceso");
    await page.locator("#rec-correo").fill(`no.registrado.${stamp}@correo.test`);
    await page.getByRole("button", { name: "Enviar enlace", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Si el correo está registrado" })).toBeVisible();
  });

  test("las páginas públicas no desbordan horizontalmente", async ({ page }) => {
    for (const path of ["/", "/explorar", challengeHref, "/acceso"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `desbordamiento en ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
