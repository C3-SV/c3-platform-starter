import { expect, test, type Page } from "@playwright/test";
import {
  adminToken,
  api,
  assignJudge,
  createAccount,
  createPublishedChallenge,
  enrollApproved,
  linkRepresentative,
  loginAt,
  openSiteMenu,
  type Account,
  type PublishedChallenge,
} from "./helpers";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";

/**
 * Matriz de navegación por capacidad y tamaño: lo que cada cuenta ve en el menú, cómo llega a sus espacios sin
 * conocer la URL, que todas las pantallas de la app compartan marco y que ninguna desborde en ningún ancho.
 */
let token = "";
let challenge: PublishedChallenge;
let orgChallenge: PublishedChallenge;
let participante: Account;
let representante: Account;
let sinVinculo: Account;
let juradaEmpresa: Account;
const organizationName = `Transportes Delta ${Date.now().toString(36)}`;

async function openAccountMenu(page: Page) {
  await page.getByRole("button", { name: /^Menú de la cuenta/ }).click();
}

test.beforeAll(async () => {
  token = await adminToken();
  challenge = await createPublishedChallenge(token);
  participante = await createAccount("participante");
  sinVinculo = await createAccount("sin-vinculo");
  representante = await createAccount("representante");
  juradaEmpresa = await createAccount("jurada-empresa");

  const organizationId = await linkRepresentative(token, organizationName, representante.email);
  // La segunda cuenta de empresa también está vinculada, pero será la única asignada como jurado.
  await api(token, "POST", `/api/admin/organizaciones/${organizationId}/representantes`, { email: juradaEmpresa.email });
  orgChallenge = await createPublishedChallenge(token, { organizationId });
  await assignJudge(token, orgChallenge.challengeId, juradaEmpresa.email, "empresa");

  // Una solución enviada en el challenge de la empresa: sin soluciones no hay nada que evaluar.
  await enrollApproved(token, participante, orgChallenge);
  await api(participante.token, "PUT", `/api/retos/${orgChallenge.challengeId}/entrega`, {
    text: "Solución de prueba: ruteo con ventanas horarias y reglas de prioridad por cliente.",
    links: ["https://github.com/equipo/ruteo"],
    submit: true,
  });
});

test.describe("Menú de la cuenta según capacidades", () => {
  test("una participante ve Mi C3, Trayectoria y Cuenta; nada de empresa ni de administración", async ({ page }) => {
    await loginAt(page, participante);
    await openAccountMenu(page);
    const menu = page.locator(".c3-usuario__panel");
    await expect(menu.getByRole("link", { name: /^Mi C3/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Trayectoria/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Cuenta/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Espacio de empresa/ })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: /^Administración/ })).toHaveCount(0);
    await expect(menu.getByRole("button", { name: "Salir", exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Tu cuenta y accesos" }).getByRole("heading", { name: "Tus espacios" })).toHaveCount(0);
  });

  test("una cuenta sin vínculo a una organización no ve el espacio de empresa", async ({ page }) => {
    await loginAt(page, sinVinculo);
    await openAccountMenu(page);
    await expect(page.locator(".c3-usuario__panel").getByRole("link", { name: /^Espacio de empresa/ })).toHaveCount(0);
  });

  test("la representante llega a su espacio de empresa sin conocer la URL", async ({ page }) => {
    await loginAt(page, representante);
    const tarjeta = page.getByRole("complementary", { name: "Tu cuenta y accesos" }).getByRole("link", { name: /^Espacio de empresa/ });
    await expect(tarjeta).toBeVisible();
    await tarjeta.click();
    await expect(page).toHaveURL(/\/empresa$/);
    await expect(page.getByRole("heading", { level: 1, name: organizationName })).toBeVisible();

    // También desde el menú de la cuenta, en cualquier pantalla de la app.
    await page.goto("/trayectoria");
    await openAccountMenu(page);
    await page.locator(".c3-usuario__panel").getByRole("link", { name: /^Espacio de empresa/ }).click();
    await expect(page).toHaveURL(/\/empresa$/);
  });

  test("la administradora ve Administración en el menú y como espacio de Mi C3", async ({ page }) => {
    await loginAt(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    await expect(page.getByRole("complementary", { name: "Tu cuenta y accesos" }).getByRole("link", { name: /^Administración/ })).toBeVisible();
    await openAccountMenu(page);
    await expect(page.locator(".c3-usuario__panel").getByRole("link", { name: /^Administración/ })).toBeVisible();
  });
});

test.describe("Evaluar desde el espacio de empresa", () => {
  test("la representante asignada como jurado evalúa desde su espacio, en la ruta canónica", async ({ page }) => {
    await loginAt(page, juradaEmpresa, "/empresa");
    await expect(page.getByRole("heading", { level: 1, name: organizationName })).toBeVisible();
    await page.getByRole("link", { name: "Evaluar soluciones", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/mi-c3/evaluar/${orgChallenge.challengeId}$`));
    await expect(page.getByRole("heading", { level: 1, name: orgChallenge.title })).toBeVisible();
    await expect(page.getByText("Evaluación · representante de la empresa")).toBeVisible();
    // Las migas llevan de vuelta a Mi C3.
    await page.getByRole("navigation", { name: "Ruta de navegación" }).getByRole("link", { name: "Mi C3", exact: true }).click();
    await expect(page).toHaveURL(/\/mi-c3$/);
    await expect(page.getByText("Como jurado", { exact: true })).toBeVisible();
  });

  test("la representante sin asignación ve las soluciones pero no puede evaluarlas", async ({ page }) => {
    await loginAt(page, representante, "/empresa");
    await expect(page.getByText("Solución de prueba: ruteo con ventanas horarias")).toBeVisible();
    await expect(page.getByRole("link", { name: "Evaluar soluciones", exact: true })).toHaveCount(0);
    await expect(page.getByText("C3 te asigna como jurado de este challenge.")).toBeVisible();
  });
});

test.describe("Un solo marco para toda la app", () => {
  test("Mi C3, Trayectoria, Cuenta, Empresa y las tareas comparten la misma navegación", async ({ page }, testInfo) => {
    const persona = await createAccount("marco");
    await enrollApproved(token, persona, challenge);
    await loginAt(page, persona);
    const rutas = ["/mi-c3", "/trayectoria", "/cuenta", "/empresa", `/mi-c3/retos/${challenge.challengeId}`, `/retos/${challenge.challengeId}/inscripcion`];
    for (const ruta of rutas) {
      await page.goto(ruta);
      await expect(page.locator("main#contenido"), ruta).toHaveCount(1);
      if (testInfo.project.name === "movil") {
        const tabs = page.getByRole("navigation", { name: "Navegación móvil" });
        await expect(tabs.getByRole("link"), ruta).toHaveText(["Mi C3", "Explorar", "Trayectoria", "Cuenta"]);
      } else {
        const principal = page.getByRole("navigation", { name: "Principal" });
        await expect(principal.getByRole("link"), ruta).toHaveText(["Mi C3", "Explorar", "Trayectoria"]);
      }
      await expect(page.getByRole("button", { name: /^Menú de la cuenta/ }), ruta).toBeVisible();
    }
  });

  test("la entrega y la inscripción tienen migas contextuales", async ({ page }) => {
    const persona = await createAccount("migas");
    await enrollApproved(token, persona, challenge);
    await loginAt(page, persona, `/mi-c3/retos/${challenge.challengeId}`);
    await expect(page.getByRole("navigation", { name: "Ruta de navegación" })).toContainText(challenge.title);
    await page.getByRole("navigation", { name: "Ruta de navegación" }).getByRole("link", { name: "Mi C3", exact: true }).click();
    await expect(page).toHaveURL(/\/mi-c3$/);

    await page.goto(`/retos/${challenge.challengeId}/inscripcion`);
    const migas = page.getByRole("navigation", { name: "Ruta de navegación" });
    await migas.getByRole("link", { name: challenge.title }).click();
    await expect(page).toHaveURL(new RegExp(`/retos/${challenge.challengeId}$`));
  });

  test("sin sesión, una pantalla privada pide entrar y devuelve a la misma pantalla", async ({ page }) => {
    const persona = await createAccount("sin-sesion");
    await page.goto(`/mi-c3/retos/${challenge.challengeId}`);
    await expect(page.getByRole("heading", { name: "Entrá para ver tu challenge" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Entrar", exact: true }).click();
    await page.locator("#l-correo").fill(persona.email);
    await page.locator("#l-pass").fill(persona.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/mi-c3/retos/${challenge.challengeId}$`));
  });
});

test.describe("Cabecera pública", () => {
  test("en un teléfono ocupa una sola fila y su menú agrupa las líneas", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "movil", "La altura de la cabecera móvil se comprueba en el proyecto móvil.");
    await page.goto("/explorar");
    const caja = await page.getByRole("banner").boundingBox();
    expect(caja!.height, "altura de la cabecera con el menú cerrado").toBeLessThanOrEqual(64);
    await openSiteMenu(page);
    const principal = page.getByRole("navigation", { name: "Principal" });
    for (const nombre of ["Explorar", "Compite", "Crea", "Conecta", "Para empresas"]) {
      await expect(principal.getByRole("link", { name: nombre, exact: true })).toBeVisible();
    }
    await expect(principal.getByText("Líneas", { exact: true })).toBeVisible();
  });

  test("en escritorio la navegación va en línea, sin «Inicio»", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "escritorio", "La navegación en línea se comprueba en escritorio.");
    await page.goto("/explorar");
    const principal = page.getByRole("navigation", { name: "Principal" });
    await expect(principal.getByRole("link")).toHaveText(["Explorar", "Compite", "Crea", "Conecta", "Para empresas"]);
    await expect(principal.getByRole("link", { name: "Inicio" })).toHaveCount(0);
  });
});

test.describe("Sin desbordes horizontales en ningún ancho", () => {
  const anchos = [320, 390, 768, 1024, 1280, 1920];

  test("páginas públicas", async ({ page }) => {
    for (const ancho of anchos) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of ["/", "/explorar", "/compite", "/empresa/proponer", "/acceso", `/retos/${challenge.challengeId}`, "/no-existe"]) {
        await page.goto(ruta);
        await page.waitForLoadState("networkidle");
        const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(desborde, `desborde en ${ruta} a ${ancho}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("pantallas de la app", async ({ page }) => {
    const persona = await createAccount("anchos");
    await enrollApproved(token, persona, challenge);
    await loginAt(page, persona);
    for (const ancho of anchos) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of ["/mi-c3", "/trayectoria", "/cuenta", "/empresa", `/mi-c3/retos/${challenge.challengeId}`, `/retos/${challenge.challengeId}/inscripcion`]) {
        await page.goto(ruta);
        await expect(page.getByRole("button", { name: /^Menú de la cuenta/ })).toBeVisible();
        await page.waitForLoadState("networkidle");
        const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(desborde, `desborde en ${ruta} a ${ancho}px`).toBeLessThanOrEqual(1);
      }
    }
  });
});
