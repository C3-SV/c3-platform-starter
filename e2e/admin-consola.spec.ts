import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";
import { adminToken, api, createAccount, createPublishedChallenge, loginAt, signOutUi, type PublishedChallenge } from "./helpers";

/**
 * Consola de administración: una URL por sección (recargar, «atrás» y enlaces directos), entrada por el Resumen con
 * los pendientes enlazados, marco propio conectado con el sitio y acceso solo para administración.
 */
const admin = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
let challenge: PublishedChallenge;
let pendingOwner: Awaited<ReturnType<typeof createAccount>>;

test.beforeAll(async () => {
  const token = await adminToken();
  challenge = await createPublishedChallenge(token);
  pendingOwner = await createAccount("pendiente-admin");
  // Una inscripción sin revisar: es el pendiente que el resumen y el menú deben mostrar.
  await api(pendingOwner.token, "POST", `/api/retos/${challenge.challengeId}/inscripcion`, { mode: "individual" });
});

test.describe("Entrada y URL por sección", () => {
  test("/admin entra por el Resumen", async ({ page }) => {
    await loginAt(page, admin, "/admin");
    await expect(page).toHaveURL(/\/admin\/resumen$/);
    await expect(page.getByRole("heading", { level: 1, name: "Resumen" })).toBeVisible();
    await expect(page).toHaveTitle("Resumen · Admin · C3 Platform");
  });

  test("cada sección tiene su dirección: recargar y «atrás» conservan donde se estaba", async ({ page }) => {
    await loginAt(page, admin, "/admin/jurados");
    await expect(page.getByRole("heading", { level: 1, name: "Jurados y rúbricas" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/admin\/jurados$/);
    await expect(page.getByRole("heading", { level: 1, name: "Jurados y rúbricas" })).toBeVisible();

    const menu = page.getByRole("navigation", { name: "Secciones de administración" });
    if (!(await menu.isVisible())) await page.getByRole("button", { name: /^Sección:/ }).click();
    await menu.getByRole("link", { name: "Entregas", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/entregas$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entregas" })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/jurados$/);
    await expect(page.getByRole("heading", { level: 1, name: "Jurados y rúbricas" })).toBeVisible();
  });

  test("una sección que no existe es un 404", async ({ page }) => {
    await loginAt(page, admin, "/admin");
    const response = await page.goto("/admin/inexistente");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
  });
});

test.describe("Resumen con pendientes enlazados", () => {
  test("las inscripciones pendientes llevan a su revisión y se ven como contador del menú", async ({ page }) => {
    await loginAt(page, admin, "/admin/resumen");
    const pendientes = page.getByRole("link", { name: /Inscripciones pendientes/ });
    await expect(pendientes).toBeVisible();
    await expect(pendientes).toHaveAttribute("href", "/admin/inscripciones");

    const menu = page.getByRole("navigation", { name: "Secciones de administración" });
    if (!(await menu.isVisible())) await page.getByRole("button", { name: /^Sección:/ }).click();
    await expect(menu.getByRole("link", { name: /Inscripciones y equipos/ }).getByLabel(/por atender/)).toBeVisible();

    await pendientes.click();
    await expect(page).toHaveURL(/\/admin\/inscripciones$/);
    await expect(page.getByRole("heading", { level: 1, name: /Inscripciones/ })).toBeVisible();
  });

  test("«Ver inscripciones» de una experiencia abre la revisión con el destino en la URL", async ({ page }) => {
    await loginAt(page, admin, "/admin/experiencias");
    const region = page.getByRole("region", { name: challenge.experienceTitle });
    await region.getByRole("button", { name: /Ver inscripciones/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/inscripciones\\?(reto|experiencia)=`));
    await expect(page.getByRole("group", { name: pendingOwner.email })).toBeVisible();
    // El destino viaja en la URL: recargar conserva la selección.
    await page.reload();
    await expect(page.getByRole("group", { name: pendingOwner.email })).toBeVisible();
  });
});

test.describe("Marco de la consola", () => {
  test("conecta con el resto del sitio: logotipo, «Ver sitio», «Mi C3» y menú de la cuenta", async ({ page }, testInfo) => {
    const movil = testInfo.project.name === "movil";
    await loginAt(page, admin, "/admin/resumen");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "C3, ir al sitio" })).toBeVisible();
    await expect(header.getByRole("navigation", { name: "Ruta de navegación" })).toContainText("Resumen");

    if (movil) {
      // En teléfono los atajos se pliegan: Mi C3 está en el menú de la cuenta y el logotipo lleva al sitio.
      await page.getByRole("button", { name: /^Menú de la cuenta/ }).click();
      await page.locator(".c3-usuario__panel").getByRole("link", { name: /^Mi C3/ }).click();
    } else {
      await header.getByRole("link", { name: "Mi C3", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/mi-c3$/);
    // Mi C3 ofrece volver a la consola como espacio de la cuenta.
    await page.getByRole("complementary", { name: "Tu cuenta y accesos" }).getByRole("link", { name: /^Administración/ }).click();
    await expect(page).toHaveURL(/\/admin\/resumen$/);

    const aSitio = movil ? header.getByRole("link", { name: "C3, ir al sitio" }) : header.getByRole("link", { name: "Ver sitio", exact: true });
    await aSitio.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("«Salir» desde la consola vuelve a la Home", async ({ page }) => {
    await loginAt(page, admin, "/admin/resumen");
    await signOutUi(page);
  });

  test("sin desbordes horizontales en escritorio ni en móvil", async ({ page }) => {
    await loginAt(page, admin, "/admin/resumen");
    for (const path of ["/admin/resumen", "/admin/propuestas", "/admin/experiencias", "/admin/inscripciones", "/admin/entregas", "/admin/jurados", "/admin/resultados"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `desborde en ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test("en pantallas pequeñas el menú se pliega y sigue siendo usable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "movil", "El menú plegable se comprueba en el proyecto móvil.");
    await loginAt(page, admin, "/admin/resumen");
    const menu = page.getByRole("navigation", { name: "Secciones de administración" });
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: /^Sección:/ }).click();
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Resultados oficiales", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/resultados$/);
    await expect(menu).toBeHidden();
  });
});

test.describe("Acceso", () => {
  test("quien no es administradora ve un mensaje con salida y ningún dato", async ({ page }) => {
    const persona = await createAccount("no-admin");
    await loginAt(page, persona, "/admin/propuestas");
    await expect(page.getByRole("heading", { name: "No tenés acceso a esta sección" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Secciones de administración" })).toHaveCount(0);
    await page.getByRole("link", { name: "Ir a Mi C3", exact: true }).click();
    await expect(page).toHaveURL(/\/mi-c3$/);
    // La API tampoco responde a quien no es administradora.
    await expect(async () => {
      await api(persona.token, "GET", "/api/admin/resumen");
    }).rejects.toThrow(/403/);
  });

  test("sin sesión pide entrar y vuelve a la sección enlazada", async ({ page }) => {
    await page.goto("/admin/entregas");
    await expect(page.getByRole("heading", { name: /Entrá con una cuenta de administración/ })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Entrar", exact: true }).click();
    await page.locator("#l-correo").fill(admin.email);
    await page.locator("#l-pass").fill(admin.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/entregas$/);
    await expect(page.getByRole("heading", { level: 1, name: "Entregas" })).toBeVisible();
  });
});
