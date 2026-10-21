import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

/**
 * Mi C3 responsive. Un panel de escritorio (cabecera superior, dos columnas, sin barra inferior) y una app móvil
 * (barra inferior, una columna), con los mismos datos. Cada ejecución crea sus propios datos y recorre los estados:
 * sin experiencias, inscripción pendiente, entrega pendiente, experiencia en curso y jurado. Solo corre en el
 * proyecto «escritorio»: cada prueba fija su propio tamaño de pantalla.
 */
const BASE = "http://localhost:3100";
const stamp = Date.now().toString(36);
const alfa = { experience: `Experiencia Alfa ${stamp}`, challenge: `Reto Alfa ${stamp}` };
const beta = { experience: `Experiencia Beta ${stamp}`, challenge: `Reto Beta ${stamp}` };
const password = "clave-panel-123";
const sinNada = { name: "Ana Sin Nada de Prueba", email: `ana.${stamp}@correo.test` };
const pendiente = { name: "Paola Pendiente de Prueba", email: `paola.${stamp}@correo.test` };
const cancelador = { name: "Camilo Cancela de Prueba", email: `camilo.${stamp}@correo.test` };
const jurado = { name: "Julia Jurado de Prueba", email: `julia.${stamp}@correo.test` };

const VIEWPORTS = [
  { name: "escritorio 1440", width: 1440, height: 900, desktop: true },
  { name: "laptop 1280", width: 1280, height: 800, desktop: true },
  { name: "escritorio mínimo 1024", width: 1024, height: 768, desktop: true },
  { name: "tablet 768", width: 768, height: 1024, desktop: false },
  { name: "móvil 390", width: 390, height: 844, desktop: false },
  { name: "móvil pequeño 360", width: 360, height: 800, desktop: false },
];

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "escritorio", "Las pruebas fijan su propio viewport.");
});

async function loginAt(page: Page, email: string, pass: string, next: string) {
  await page.goto(`/acceso?next=${encodeURIComponent(next)}`);
  await page.locator("#l-correo").fill(email);
  await page.locator("#l-pass").fill(pass);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
}

async function register(page: Page, name: string, email: string) {
  await page.goto("/acceso?modo=registro");
  const form = page.locator("form").filter({ has: page.locator("#r-nombre") });
  await page.locator("#r-nombre").fill(name);
  await page.locator("#r-correo").fill(email);
  await page.locator("#r-pass").fill(password);
  await form.locator('input[type="checkbox"]').check();
  await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
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

async function publishChallenge(page: Page, experienceTitle: string, challengeTitle: string) {
  const experienceForm = page.locator("form").filter({ has: page.locator("#exp-titulo") });
  await page.locator("#exp-titulo").fill(experienceTitle);
  await page.locator("#exp-tipo").selectOption("hackathon");
  await page.locator("#exp-resumen").fill("Experiencia de prueba para validar el diseño responsive de Mi C3.");
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
  await page.locator("#ret-org").fill("Organización de prueba");
  await page.locator("#ret-resumen").fill("Resolver un caso real con una solución verificable.");
  await page.locator("#ret-problema").fill("La organización necesita resolver este caso de prueba con una solución verificable y documentada.");
  await page.locator("#ret-entregables").fill("Repositorio con instrucciones\nDemo de 4 minutos");
  await page.locator("#ret-rubrica").fill("Calidad del resultado | 10\nClaridad del enfoque | 10");
  await page.locator("#ret-cierre").fill("2027-06-30T23:59");
  await challengeForm.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Reto guardado como borrador" })).toBeVisible();
  await region.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Publicado" })).toBeVisible();
}

async function challengeIdOf(browser: Browser, challengeTitle: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  try {
    await page.goto("/explorar");
    await page.getByRole("link", { name: new RegExp(challengeTitle) }).click();
    await expect(page).toHaveURL(/\/retos\/[^/]+$/);
    return new URL(page.url()).pathname.split("/").filter(Boolean)[1];
  } finally {
    await context.close();
  }
}

async function enroll(page: Page, challengeId: string) {
  await page.goto(`/retos/${challengeId}/inscripcion`);
  await page.getByRole("button", { name: "Inscribirme", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Inscripción enviada" })).toBeVisible();
}

/** Carga Mi C3 con el tamaño dado y devuelve los errores de consola y de página que aparezcan. */
async function openMiC3(page: Page, viewport: { width: number; height: number }): Promise<string[]> {
  const errors: string[] = [];
  const onError = (error: Error) => errors.push(`pageerror: ${error.message}`);
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  };
  page.on("pageerror", onError);
  page.on("console", onConsole);
  await page.setViewportSize(viewport);
  await page.goto("/mi-c3");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  page.off("pageerror", onError);
  page.off("console", onConsole);
  return errors;
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

let alfaId = "";
let betaId = "";

test.describe.serial("Mi C3 responsive", () => {
  test("el administrador publica dos retos y se registran las personas de prueba", async ({ browser }) => {
    await withAdmin(browser, async (admin) => {
      await publishChallenge(admin, alfa.experience, alfa.challenge);
      await publishChallenge(admin, beta.experience, beta.challenge);
    });
    alfaId = await challengeIdOf(browser, alfa.challenge);
    betaId = await challengeIdOf(browser, beta.challenge);
    expect(alfaId).toBeTruthy();
    expect(betaId).toBeTruthy();

    // Cada persona usa su propio contexto: sinNada y jurado solo se registran; las otras dos se inscriben.
    const people: { person: { name: string; email: string }; challengeId: string | null }[] = [
      { person: sinNada, challengeId: null },
      { person: pendiente, challengeId: alfaId },
      { person: cancelador, challengeId: betaId },
      { person: jurado, challengeId: null },
    ];
    for (const { person, challengeId } of people) {
      const context = await browser.newContext({ baseURL: BASE });
      const registerPage = await context.newPage();
      try {
        await register(registerPage, person.name, person.email);
        if (challengeId) await enroll(registerPage, challengeId);
      } finally {
        await context.close();
      }
    }
  });

  test("sin experiencias: un solo bloque de bienvenida, sin secciones vacías, en escritorio y en móvil", async ({ page }) => {
    await loginAt(page, sinNada.email, password, "/mi-c3");
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const errors = await openMiC3(page, viewport);
      expect(errors, "errores de consola o de página").toEqual([]);
      await expect(page.getByRole("heading", { level: 1, name: `Hola, ${sinNada.name.split(" ")[0]}` })).toBeVisible();
      await expect(page.getByText("Todavía no participás en ninguna experiencia.")).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Elegí tu primer reto" })).toBeVisible();
      for (const heading of ["Requiere tu atención", "En espera", "En curso", "Finalizadas"]) {
        await expect(page.getByRole("heading", { level: 2, name: heading })).toHaveCount(0);
      }
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }
    await page.getByRole("link", { name: "Explorar retos", exact: true }).click();
    await expect(page).toHaveURL(/\/explorar$/);
  });

  test("inscripción pendiente: se muestra como espera de C3 y no como una tarea ni como «al día»", async ({ page }) => {
    await loginAt(page, pendiente.email, password, "/mi-c3");
    await openMiC3(page, { width: 1440, height: 900 });
    await expect(page.getByRole("heading", { level: 2, name: "En espera" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toHaveCount(0);
    const summary = page.locator(".c3-mi-c3__resumen-texto");
    await expect(summary).toContainText("Estás esperando la respuesta de C3 sobre 1 inscripción.");
    await expect(summary).not.toContainText(/nada pendiente|al día/i);
    const card = page.getByRole("article").filter({ hasText: alfa.challenge });
    await expect(card.getByText("Esperando respuesta de C3.")).toBeVisible();
    await expect(card.getByText("Pendiente", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Ver inscripción" })).toHaveAttribute("href", `/retos/${alfaId}/inscripcion`);
    // Cancelar es una acción secundaria: sin relleno, no es un botón principal.
    const cancel = card.getByRole("button", { name: "Cancelar inscripción" });
    await expect(cancel).toBeVisible();
    await expect(cancel).not.toHaveClass(/c3-btn--primario/);
  });

  test("la navegación cambia con el tamaño de pantalla y no hay desbordamiento horizontal", async ({ page }) => {
    await loginAt(page, pendiente.email, password, "/mi-c3");
    const mobileNav = page.locator('nav[aria-label="Navegación móvil"]');
    const desktopNav = page.getByRole("navigation", { name: "Principal" });

    for (const viewport of VIEWPORTS) {
      const errors = await openMiC3(page, viewport);
      expect(errors, `errores de consola o de página en ${viewport.name}`).toEqual([]);
      expect(await horizontalOverflow(page), `desbordamiento en ${viewport.name}`).toBeLessThanOrEqual(1);

      const grid = page.locator(".c3-mi-c3__principal");
      const aside = page.locator(".c3-mi-c3__lateral");
      const gridBox = await grid.boundingBox();
      const asideBox = await aside.boundingBox();
      expect(gridBox && asideBox, `columnas visibles en ${viewport.name}`).toBeTruthy();

      if (viewport.desktop) {
        // Escritorio: cabecera superior, sin barra inferior y dos columnas lado a lado.
        await expect(desktopNav, viewport.name).toBeVisible();
        await expect(mobileNav, viewport.name).toBeHidden();
        await expect(page.locator(".c3-movil__barra"), viewport.name).toBeHidden();
        expect(asideBox!.x, `lateral a la derecha en ${viewport.name}`).toBeGreaterThan(gridBox!.x + gridBox!.width - 1);
        const ratio = gridBox!.width / (gridBox!.width + asideBox!.width);
        expect(ratio, `columna principal ≈ 65–70% en ${viewport.name}`).toBeGreaterThan(0.6);
        expect(ratio).toBeLessThan(0.75);
        expect(gridBox!.width + asideBox!.width, `ancho útil en ${viewport.name}`).toBeGreaterThan(Math.min(viewport.width * 0.8, 1000));
      } else {
        // Tablet y móvil: barra inferior pegada al borde inferior, una columna y sin cabecera de escritorio.
        await expect(mobileNav, viewport.name).toBeVisible();
        await expect(desktopNav, viewport.name).toBeHidden();
        const navBox = await mobileNav.boundingBox();
        expect(Math.abs(navBox!.y + navBox!.height - viewport.height), `barra inferior en ${viewport.name}`).toBeLessThanOrEqual(2);
        expect(asideBox!.y, `lateral debajo del contenido en ${viewport.name}`).toBeGreaterThanOrEqual(gridBox!.y + gridBox!.height - 1);
        // El contenido no queda tapado por la barra: al final de la página, el último bloque queda por encima.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const lastBox = await aside.boundingBox();
        const barBox = await mobileNav.boundingBox();
        expect(lastBox!.y + lastBox!.height, `contenido final visible en ${viewport.name}`).toBeLessThanOrEqual(barBox!.y + 1);
      }
    }
  });

  test("la cabecera de escritorio funciona: logo, accesos, cuenta y cierre de sesión", async ({ page }) => {
    await loginAt(page, pendiente.email, password, "/mi-c3");
    await openMiC3(page, { width: 1280, height: 800 });
    const nav = page.getByRole("navigation", { name: "Principal" });
    await expect(nav.getByRole("link", { name: "Mi C3", exact: true })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Explorar", exact: true }).click();
    await expect(page).toHaveURL(/\/explorar$/);
    await page.goto("/mi-c3");
    await nav.getByRole("link", { name: "Trayectoria", exact: true }).click();
    await expect(page).toHaveURL(/\/trayectoria$/);

    await page.goto("/mi-c3");
    await page.getByRole("link", { name: "C3, ir al inicio" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/mi-c3");
    await page.getByRole("link", { name: new RegExp(`${pendiente.name}.*Mi cuenta`) }).click();
    await expect(page).toHaveURL(/\/cuenta$/);

    await page.goto("/mi-c3");
    // La columna lateral lleva a Cuenta, Trayectoria y Explorar.
    const aside = page.getByRole("complementary", { name: "Tu cuenta y accesos" });
    await expect(aside.getByRole("link", { name: /^Cuenta/ })).toHaveAttribute("href", "/cuenta");
    await expect(aside.getByRole("link", { name: /^Trayectoria/ })).toHaveAttribute("href", "/trayectoria");
    await expect(aside.getByRole("link", { name: /^Explorar\b/ })).toHaveAttribute("href", "/explorar");

    await page.getByRole("button", { name: "Salir", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
  });

  test("cancelar una inscripción pendiente pide confirmación y se puede desistir", async ({ page }) => {
    await loginAt(page, cancelador.email, password, "/mi-c3");
    await openMiC3(page, { width: 390, height: 844 });
    const card = page.getByRole("article").filter({ hasText: beta.challenge });
    await card.getByRole("button", { name: "Cancelar inscripción" }).click();
    const confirm = card.getByRole("group", { name: /Confirmar la cancelación/ });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Mantenerla" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(card.getByText("Esperando respuesta de C3.")).toBeVisible();

    await card.getByRole("button", { name: "Cancelar inscripción" }).click();
    await card.getByRole("button", { name: "Sí, cancelar inscripción" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Inscripción cancelada." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Finalizadas" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "En espera" })).toHaveCount(0);
    await expect(page.getByRole("article").filter({ hasText: beta.challenge }).getByText("Cancelada", { exact: true })).toBeVisible();
  });

  test("entrega pendiente: C3 aprueba y la persona ve la acción que le toca", async ({ browser, page }) => {
    await withAdmin(browser, async (admin) => {
      await admin.getByRole("button", { name: "Inscripciones y equipos", exact: true }).click();
      await admin.locator("#ins-reto").selectOption({ label: alfa.challenge });
      const row = admin.getByRole("group", { name: pendiente.email });
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Aprobar", exact: true }).click();
      await expect(admin.getByRole("status").filter({ hasText: "Inscripción aprobada" })).toBeVisible();
    });

    await loginAt(page, pendiente.email, password, "/mi-c3");
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await openMiC3(page, viewport);
      await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "En espera" })).toHaveCount(0);
      await expect(page.locator(".c3-mi-c3__resumen-texto")).toContainText("Tenés 1 acción que requiere tu atención.");
      const card = page.getByRole("article").filter({ hasText: alfa.challenge });
      await expect(card.getByText("Sin entrega", { exact: true })).toBeVisible();
      await expect(card.getByText(/^Cierra el /)).toBeVisible();
      await expect(card.getByRole("link", { name: "Abrir mi reto" })).toHaveAttribute("href", `/mi-c3/retos/${alfaId}`);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }
  });

  test("experiencia en curso: al enviar la entrega pasa de «Requiere tu atención» a «En curso»", async ({ page }) => {
    await loginAt(page, pendiente.email, password, "/mi-c3");
    await openMiC3(page, { width: 1280, height: 800 });
    await page.getByRole("link", { name: "Abrir mi reto" }).click();
    await page.locator("#entrega-texto").fill("Solución de prueba con heurística de inserción y una mejora local posterior.");
    await page.getByLabel("Enlace 1").fill("https://github.com/equipo-de-prueba/panel");
    await page.getByRole("button", { name: "Enviar entrega", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Entrega enviada" })).toBeVisible();

    for (const viewport of [{ width: 1280, height: 800 }, { width: 360, height: 800 }]) {
      await openMiC3(page, viewport);
      await expect(page.getByRole("heading", { level: 2, name: "En curso" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toHaveCount(0);
      await expect(page.locator(".c3-mi-c3__resumen-texto")).toContainText("No tenés acciones pendientes. Tenés 1 participación en curso.");
      const card = page.getByRole("article").filter({ hasText: alfa.challenge });
      await expect(card.getByText("Entregada", { exact: true })).toBeVisible();
      await expect(card.getByRole("link", { name: "Ver mi entrega" })).toHaveAttribute("href", `/mi-c3/retos/${alfaId}`);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }
  });

  test("jurado: el reto asignado aparece como espera hasta el cierre y como acción cuando hay que evaluar", async ({ browser, page }) => {
    await withAdmin(browser, async (admin) => {
      await admin.getByRole("button", { name: "Jurados y rúbricas", exact: true }).click();
      await admin.locator("#jur-reto").selectOption({ label: alfa.challenge });
      await admin.locator("#jur-correo").fill(jurado.email);
      await admin.locator("#jur-tipo").selectOption("externo");
      await admin.getByRole("button", { name: "Asignar jurado", exact: true }).click();
      await expect(admin.getByRole("status").filter({ hasText: "Jurado asignado" })).toBeVisible();
    });

    await loginAt(page, jurado.email, password, "/mi-c3");
    await openMiC3(page, { width: 1280, height: 800 });
    await expect(page.getByRole("heading", { level: 2, name: "En espera" })).toBeVisible();
    await expect(page.getByText("Como jurado", { exact: true })).toBeVisible();
    await expect(page.getByText("Esperando el cierre", { exact: true })).toBeVisible();

    // El cierre de entregas no se puede adelantar en el navegador: se simula solo la respuesta de la consulta de jurado.
    await page.route("**/api/evaluaciones", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ assignments: [{ challengeId: alfaId, title: alfa.challenge, kind: "externo", canEvaluate: true, solutions: 3, finalized: 1 }] }),
      }),
    );
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      await openMiC3(page, viewport);
      await expect(page.getByRole("heading", { level: 2, name: "Requiere tu atención" })).toBeVisible();
      await expect(page.locator(".c3-mi-c3__resumen-texto")).toContainText("Tenés 1 acción que requiere tu atención.");
      const card = page.getByRole("article").filter({ hasText: alfa.challenge });
      await expect(card.getByText("2 de 3 soluciones sin finalizar")).toBeVisible();
      await expect(card.getByRole("link", { name: "Evaluar", exact: true })).toHaveAttribute("href", `/mi-c3/evaluar/${alfaId}`);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    }
  });
});
