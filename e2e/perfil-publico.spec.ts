import { expect, test, type Page } from "@playwright/test";
import { adminToken, api, createAccount, createPublishedChallenge, enrollApproved, loginAt, type Account, type PublishedChallenge } from "./helpers";

/**
 * Perfil público compartible: la persona lo activa en Cuenta, elige qué muestra, comparte el enlace y puede cambiarlo o
 * desactivarlo. Quien no lo activó no tiene perfil; el público solo ve lo elegido y nunca datos privados.
 */
let token = "";
let challenge: PublishedChallenge;
let pendingChallenge: PublishedChallenge;

async function personWithDetails(label: string): Promise<Account> {
  const person = await createAccount(label, "Lucía Robles de Prueba");
  await api(person.token, "PUT", "/api/perfil", {
    displayName: person.name,
    school: "Colegio Santa Ana de Prueba",
    bio: "Me interesan los challenges de backend y la automatización.",
    github: "https://github.com/lucia-prueba",
    linkedin: "",
  });
  return person;
}

async function activate(page: Page): Promise<string> {
  await page.goto("/cuenta");
  const section = page.getByRole("region", { name: "Perfil público" });
  await expect(section).toBeVisible();
  await section.getByRole("button", { name: "Activar perfil público" }).click();
  await expect(section.getByRole("status").filter({ hasText: "Perfil público activado" })).toBeVisible();
  const url = await section.getByLabel("Tu enlace").inputValue();
  expect(url).toMatch(/\/personas\/lucia-robles-de-prueba-[a-z0-9]{6}$/);
  return new URL(url).pathname;
}

test.beforeAll(async () => {
  token = await adminToken();
  challenge = await createPublishedChallenge(token);
  pendingChallenge = await createPublishedChallenge(token);
});

test.describe("Activar y compartir", () => {
  test("Trayectoria invita a activarlo en Cuenta, donde nada se comparte hasta que la persona lo decide", async ({ page }) => {
    const person = await personWithDetails("activar");
    await loginAt(page, person, "/trayectoria");
    await expect(page.getByText("Tu perfil es privado.")).toBeVisible();
    await page.getByRole("link", { name: "Activar en Cuenta" }).click();
    await expect(page).toHaveURL(/\/cuenta#perfil-publico$/);

    const section = page.getByRole("region", { name: "Perfil público" });
    await expect(section.getByText("Privado", { exact: true })).toBeVisible();
    await expect(section.getByLabel(/dónde estudio o trabajo/)).not.toBeChecked();
    for (const option of [/lo que escribí sobre mí/, /enlaces profesionales/, /trayectoria en C3/]) {
      await expect(section.getByLabel(option)).toBeChecked();
    }
    await expect(section.getByLabel("Tu enlace")).toHaveCount(0);
  });

  test("activado, el perfil público muestra solo lo elegido y la dueña lo ve como el público", async ({ page }) => {
    const person = await personWithDetails("publico");
    await enrollApproved(token, person, challenge);
    await loginAt(page, person);
    const path = await activate(page);

    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: "Lucía Robles de Prueba" })).toBeVisible();
    await expect(page.getByText("Me interesan los challenges de backend")).toBeVisible();
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/lucia-prueba");
    await expect(page.getByText("Colegio Santa Ana de Prueba")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Explorar experiencias" })).toBeVisible();
    // Participación aprobada, con enlace al challenge público.
    await expect(page.getByRole("link", { name: challenge.title })).toHaveAttribute("href", `/retos/${challenge.challengeId}`);
    // La dueña ve el aviso; no se indexa.
    await expect(page.getByText("Así ve tu perfil el público")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // Trayectoria ahora muestra el estado y el enlace para compartir.
    await page.goto("/trayectoria");
    await expect(page.getByText("Tu perfil público está activo")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver perfil público" })).toHaveAttribute("href", path);
  });

  test("una visitante ve el perfil sin avisos y sin datos privados; el centro de estudio aparece solo si se comparte", async ({ page, browser }) => {
    const person = await personWithDetails("visitante");
    await loginAt(page, person);
    const path = await activate(page);

    const visitor = await browser.newContext({ baseURL: "http://localhost:3100" });
    try {
      const guest = await visitor.newPage();
      await guest.goto(path);
      await expect(guest.getByRole("heading", { level: 1, name: "Lucía Robles de Prueba" })).toBeVisible();
      await expect(guest.getByText("Así ve tu perfil el público")).toHaveCount(0);
      const html = await guest.content();
      for (const secret of [person.email, person.uid, "Colegio Santa Ana"]) expect(html, `no debe contener ${secret}`).not.toContain(secret);

      // Al compartir el centro de estudio, la página lo muestra.
      await page.goto("/cuenta");
      const section = page.getByRole("region", { name: "Perfil público" });
      await section.getByLabel(/dónde estudio o trabajo/).check();
      await section.getByRole("button", { name: "Guardar lo que muestro" }).click();
      await expect(section.getByRole("status").filter({ hasText: "Cambios guardados" })).toBeVisible();
      await guest.reload();
      await expect(guest.getByText("Colegio Santa Ana de Prueba")).toBeVisible();
    } finally {
      await visitor.close();
    }
  });

  test("las inscripciones sin aprobar no aparecen en el perfil público", async ({ page }) => {
    const person = await personWithDetails("pendiente");
    await api(person.token, "POST", `/api/retos/${pendingChallenge.challengeId}/inscripcion`, { mode: "individual" });
    await loginAt(page, person);
    const path = await activate(page);
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: "Lucía Robles de Prueba" })).toBeVisible();
    await expect(page.getByText(pendingChallenge.title)).toHaveCount(0);
    await expect(page.getByText("Todavía no hay participaciones públicas.")).toBeVisible();
  });
});

test.describe("Cambiar o desactivar", () => {
  test("cambiar el enlace invalida el anterior; desactivar lo apaga", async ({ page }) => {
    const person = await personWithDetails("rotar");
    await loginAt(page, person);
    const first = await activate(page);

    const section = page.getByRole("region", { name: "Perfil público" });
    await section.getByRole("button", { name: "Cambiar enlace" }).click();
    await section.getByRole("button", { name: "Sí, cambiar enlace" }).click();
    await expect(section.getByRole("status").filter({ hasText: "Enlace cambiado" })).toBeVisible();
    const second = new URL(await section.getByLabel("Tu enlace").inputValue()).pathname;
    expect(second).not.toBe(first);

    expect((await page.goto(first))?.status()).toBe(404);
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
    expect((await page.goto(second))?.status()).toBe(200);

    await page.goto("/cuenta");
    await section.getByRole("button", { name: "Desactivar" }).click();
    await expect(section.getByRole("status").filter({ hasText: "Perfil público desactivado" })).toBeVisible();
    expect((await page.goto(second))?.status()).toBe(404);
  });

  test("una dirección inventada responde igual que una desactivada", async ({ page }) => {
    for (const slug of ["lucia-robles-aaaaaa", "../admin", "x"]) {
      const response = await page.goto(`/personas/${encodeURIComponent(slug)}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByText("No encontramos esta página")).toBeVisible();
    }
  });

  test("sin sesión, Cuenta no ofrece el perfil público y la API lo rechaza", async ({ page }) => {
    await page.goto("/cuenta");
    await expect(page.getByRole("region", { name: "Perfil público" })).toHaveCount(0);
    const response = await page.request.get("/api/perfil/publico");
    expect(response.status()).toBe(401);
  });
});

test.describe("Diseño", () => {
  test("el perfil público no desborda en ningún ancho", async ({ page }) => {
    const person = await personWithDetails("ancho");
    await enrollApproved(token, person, challenge);
    await loginAt(page, person);
    const path = await activate(page);
    for (const ancho of [320, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(desborde, `desborde a ${ancho}px`).toBeLessThanOrEqual(1);
    }
  });
});
