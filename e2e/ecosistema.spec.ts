import { expect, test } from "@playwright/test";

test.describe("Ecosistema C3", () => {
  for (const [path, heading] of [
    ["/compite", "Compite"],
    ["/crea", "Crea"],
    ["/conecta", "Conecta"],
  ] as const) {
    test(path + " es una página pública navegable", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Principal" })).toContainText("Explorar");
      await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Crea", exact: true })).toBeVisible();
    });
  }

  test("el encabezado conecta las líneas y el logo vuelve a Home", async ({ page }) => {
    await page.goto("/compite");
    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Crea", exact: true }).click();
    await expect(page).toHaveURL(/\/crea$/);
    await page.getByRole("banner").getByRole("link", { name: "C3, ir al inicio" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
