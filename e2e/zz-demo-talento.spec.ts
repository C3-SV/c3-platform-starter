import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { loginAt } from "./helpers";

/**
 * Flujos de la demo de talento sobre el dataset del seed. Se llama «zz» para correr al final: siembra el emulador
 * con el dataset de demostración y no deja datos que otros recorridos esperen encontrar vacíos.
 * Solo escritorio: el móvil recorre las mismas rutas en los especificos de navegación.
 */
const CHALLENGE_ID = "seed_challenge_empresa-demostracion-rutas";
const EMPRESA = "empresa@demo.c3.com.sv";
const JOVEN = "joven@demo.c3.com.sv";
const ADMIN = "admin@demo.c3.com.sv";

/** Contraseña de prueba de las cuentas demo en el emulador (la misma convención de la suite; nunca remota). */
const PASSWORD = "clave-prueba-123";
const credentials: Record<string, string> = { [EMPRESA]: PASSWORD, [JOVEN]: PASSWORD, [ADMIN]: PASSWORD };

function runNode(args: string[]): void {
  execFileSync("node", ["--env-file-if-exists=.env.local", "--experimental-strip-types", ...args], { env: process.env, stdio: "pipe" });
}

// Solo escritorio: el móvil no siembra ni recorre estos flujos. Los datos que cambian los recorridos de escritorio
// (contactos aceptados, avances) harían chocar una segunda siembra.
test.beforeAll(({}, testInfo) => {
  if (testInfo.project.name !== "escritorio") return;
  runNode(["scripts/seed.mjs", "--mode", "apply", "--project", "demo-c3-platform", "--confirm-project", "demo-c3-platform", "--allow-write", "--emulator"]);
  runNode(["scripts/provision-demo-accounts.mjs", "--emulator", "--project", "demo-c3-platform", "--apply"]);
});

test.describe("Demo de talento sobre el dataset del seed", () => {
  test.skip(({ isMobile }) => isMobile, "Estos recorridos se prueban en escritorio.");

  test("la empresa ve el tablero con evaluación publicada, matriz por criterio y estados de contacto", async ({ page }) => {
    await loginAt(page, { email: EMPRESA, password: credentials[EMPRESA] });
    await page.goto("/empresa");
    await page.getByRole("button", { name: "Ver talento y lista corta" }).first().click();
    const comparacion = page.getByRole("table", { name: "Comparación de entregas" });
    await expect(comparacion).toBeVisible();
    await expect(comparacion.getByText("Ana Martínez")).toBeVisible();
    await expect(comparacion.getByText("Publicada · promedio 34.0")).toBeVisible();
    await expect(page.getByRole("table", { name: "Matriz por criterio" })).toBeVisible();
    await expect(comparacion.getByText("Aceptado")).toBeVisible();
  });

  test("la persona joven ve su bitácora, agrega un avance y acepta la solicitud de contacto", async ({ page }) => {
    await loginAt(page, { email: JOVEN, password: credentials[JOVEN] });
    await page.goto(`/mi-c3/retos/${CHALLENGE_ID}`);
    await expect(page.getByRole("heading", { name: "Avances y decisiones" })).toBeVisible();
    await expect(page.getByText("Comparé la heurística de inserción contra la búsqueda exhaustiva")).toBeVisible();
    await page.locator("#bitacora-texto").fill("Agrego una prueba con demoras reales y registro el resultado en la bitácora.");
    await page.getByRole("button", { name: "Agregar a la bitácora" }).click();
    await expect(page.getByText("Agrego una prueba con demoras reales")).toBeVisible();

    await page.goto("/mi-c3");
    await expect(page.getByRole("heading", { name: "Solicitudes de contacto" })).toBeVisible();
    await expect(page.getByText("Empresa de demostración C3", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Aceptar contacto" }).click();
    await expect(page.getByText("Aceptado", { exact: true }).first()).toBeVisible();
  });

  test("el catálogo filtra por línea y por datos demostrativos", async ({ page }) => {
    await page.goto("/explorar");
    const estado = page.getByRole("status").filter({ hasText: "Mostrando" });
    await expect(estado).toBeVisible();
    const total = (await estado.textContent()) ?? "";
    await page.locator("#filtro-linea").selectOption("conecta");
    await expect(estado).not.toHaveText(total);
    await page.getByLabel("Solo datos demostrativos").check();
    await expect(page.getByText("DEMO").first()).toBeVisible();
  });

  test("la propuesta ofrece la intención opcional con sus tres opciones", async ({ page }) => {
    await page.goto("/empresa/proponer");
    const intencion = page.locator("#p-intencion");
    await expect(intencion).toBeVisible();
    await expect(intencion.locator("option")).toHaveText(["Sin elegir", "Identificar talento", "Explorar una solución", "Ambos"]);
  });

  test("en la consola, una propuesta aceptada lleva a crear el challenge para su organización", async ({ page }) => {
    await loginAt(page, { email: ADMIN, password: credentials[ADMIN] }, "/admin/propuestas");
    await page.goto("/admin/propuestas");
    await expect(page.getByRole("link", { name: "Crear challenge para esta organización" }).first()).toBeVisible();
  });
});
