import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";
import { adminToken, assignJudge, createAccount, createPublishedChallenge, loginAt, signOutUi, type Account, type PublishedChallenge } from "./helpers";

/**
 * Navegación entre pantallas: a dónde se llega tras entrar, el enlace de un jurado invitado, «Salir» y las
 * referencias básicas (título por ruta, un solo <main>, enlace para saltar al contenido). Los datos se
 * preparan con la API; cada prueba recorre solo la navegación.
 */
let admin = "";
let challenge: PublishedChallenge;
let jurado: Account;

test.beforeAll(async () => {
  admin = await adminToken();
  challenge = await createPublishedChallenge(admin);
  jurado = await createAccount("jurado");
  await assignJudge(admin, challenge.challengeId, jurado.email);
});

test.describe("Después de entrar", () => {
  test("sin destino previo se llega a Mi C3", async ({ page }) => {
    const persona = await createAccount("sin-destino");
    await loginAt(page, persona);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("«Entrar» de la cabecera recuerda la página donde estaba la persona", async ({ page }) => {
    const persona = await createAccount("desde-cabecera");
    await page.goto(`/retos/${challenge.challengeId}`);
    await page.getByRole("banner").getByRole("link", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/acceso\\?next=${encodeURIComponent(`/retos/${challenge.challengeId}`)}`));
    await page.locator("#l-correo").fill(persona.email);
    await page.locator("#l-pass").fill(persona.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/retos/${challenge.challengeId}$`));
    await expect(page.getByRole("heading", { level: 1, name: challenge.title })).toBeVisible();
  });

  test("un destino externo en next no saca a la persona del sitio", async ({ page }) => {
    const persona = await createAccount("next-externo");
    await page.goto(`/acceso?next=${encodeURIComponent("https://example.org/robo")}`);
    await page.locator("#l-correo").fill(persona.email);
    await page.locator("#l-pass").fill(persona.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/mi-c3$/);
  });
});

test.describe("El enlace de un jurado invitado", () => {
  test("lleva a la evaluación tras entrar: no termina en 404", async ({ page }) => {
    await page.goto(`/mi-c3/evaluar/${challenge.challengeId}`);
    await expect(page.getByRole("heading", { name: /Entrá para evaluar/ })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Entrar", exact: true }).click();
    await page.locator("#l-correo").fill(jurado.email);
    await page.locator("#l-pass").fill(jurado.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/mi-c3/evaluar/${challenge.challengeId}$`));
    await expect(page.getByRole("heading", { level: 1, name: challenge.title })).toBeVisible();
    await expect(page.getByText("No encontramos esta página")).toHaveCount(0);
  });

  test("las direcciones anteriores de la evaluación redirigen a la canónica", async ({ page }) => {
    await loginAt(page, jurado);
    for (const old of [`/evaluar/${challenge.challengeId}`, `/empresa/retos/${challenge.challengeId}/evaluacion`]) {
      await page.goto(old);
      await expect(page).toHaveURL(new RegExp(`/mi-c3/evaluar/${challenge.challengeId}$`));
      await expect(page.getByRole("heading", { level: 1, name: challenge.title })).toBeVisible();
    }
  });

  test("quien no es jurado de ese challenge ve un mensaje claro, no datos", async ({ page }) => {
    const otra = await createAccount("no-jurado");
    await loginAt(page, otra, `/mi-c3/evaluar/${challenge.challengeId}`);
    await expect(page.locator(".c3-alerta--error")).toContainText("No tenés asignado este");
    await expect(page.getByText("Solución 1")).toHaveCount(0);
  });
});

test.describe("Salir", () => {
  for (const path of ["/mi-c3", "/trayectoria", "/cuenta", "/empresa"]) {
    test(`cierra la sesión y vuelve a la Home desde ${path}`, async ({ page }) => {
      const persona = await createAccount("salir");
      await loginAt(page, persona, path);
      await signOutUi(page);
      // Ya sin sesión, la vista privada pide entrar en lugar de mostrar datos.
      await page.goto(path);
      await expect(page.getByRole("main").getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
    });
  }

  test("cierra la sesión de administración y vuelve a la Home", async ({ page }) => {
    await loginAt(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, "/admin");
    await signOutUi(page);
  });
});

test.describe("Referencias básicas de cada página", () => {
  const rutas = ["/", "/explorar", "/compite", "/crea", "/conecta", "/acceso", "/empresa/proponer"];

  test("cada ruta tiene un título propio y un único <main>", async ({ page }) => {
    const titulos = new Map<string, string>();
    for (const ruta of rutas) {
      await page.goto(ruta);
      const titulo = await page.title();
      expect(titulo, `título de ${ruta}`).toMatch(/C3 Platform$/);
      titulos.set(ruta, titulo);
      await expect(page.locator("main"), `<main> de ${ruta}`).toHaveCount(1);
    }
    // Todas distintas excepto la Home, que usa el título por defecto.
    expect(new Set(titulos.values()).size).toBe(rutas.length);
  });

  test("el detalle del challenge pone su nombre en el título", async ({ page }) => {
    await page.goto(`/retos/${challenge.challengeId}`);
    await expect(page).toHaveTitle(`${challenge.title} · C3 Platform`);
  });

  test("el enlace para saltar al contenido existe y lleva al contenido principal", async ({ page }) => {
    await page.goto("/explorar");
    const saltar = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(saltar).toHaveAttribute("href", "#contenido");
    await expect(page.locator("main#contenido")).toHaveCount(1);
  });

  test("el llamado a empresas del challenge lleva a Proponer, sin «Próximamente»", async ({ page }) => {
    await page.goto(`/retos/${challenge.challengeId}`);
    await expect(page.getByText("Próximamente")).toHaveCount(0);
    await page.getByRole("link", { name: "Proponer un challenge", exact: true }).click();
    await expect(page).toHaveURL(/\/empresa\/proponer$/);
  });
});
