import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants";
import { adminToken, createAccount, createPublishedChallenge, linkRepresentative, loginAt, openAdminSection } from "./helpers";

/**
 * Cierre del update: consentimientos de la inscripción (J2, J3), subnavegación de la empresa (E2) y auditoría de
 * administración (E6). Los datos se preparan con la API; cada prueba recorre solo la interfaz.
 */
test("la inscripción exige confirmar la elegibilidad y aceptar las reglas antes de enviarse", async ({ page }) => {
  const admin = await adminToken();
  const challenge = await createPublishedChallenge(admin);
  const persona = await createAccount("consentimientos");
  await loginAt(page, persona, `/retos/${challenge.challengeId}/inscripcion`);

  await page.getByRole("button", { name: "Inscribirme", exact: true }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByText("Inscripción enviada")).toHaveCount(0);

  await page.getByLabel("Confirmo que cumplo los requisitos de elegibilidad").check();
  await page.getByLabel("Acepto las reglas del challenge y el uso de mis datos para la evaluación").check();
  await page.getByRole("button", { name: "Inscribirme", exact: true }).click();
  await expect(page.getByText("Inscripción enviada").first()).toBeVisible();
});

test("el espacio de empresa ofrece subnavegación y la cifra de perfiles de interés", async ({ page }) => {
  const admin = await adminToken();
  const representante = await createAccount("rep-cierre");
  const organizationId = await linkRepresentative(admin, "Empresa de cierre de prueba", representante.email);
  await createPublishedChallenge(admin, { organizationId });
  await loginAt(page, representante, "/empresa");

  await expect(page.getByRole("navigation", { name: "Secciones del espacio de empresa" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Propuestas", exact: true })).toBeVisible();
  await expect(page.getByText("Perfiles de interés").first()).toBeVisible();
});

test("la empresa configura su challenge desde su espacio", async ({ page }) => {
  const admin = await adminToken();
  const representante = await createAccount("rep-config");
  const organizationId = await linkRepresentative(admin, "Empresa de configuración E2E", representante.email);
  await createPublishedChallenge(admin, { organizationId });
  await loginAt(page, representante, "/empresa");

  await page.getByRole("button", { name: "Configurar challenge" }).first().click();
  await page.getByLabel("Resumen", { exact: true }).fill("Resumen ajustado por la empresa desde su espacio de trabajo.");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText("Configuración guardada")).toBeVisible();
});

test("la consola de administración tiene una sección de auditoría", async ({ page }) => {
  await loginAt(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }, "/admin/resumen");
  await openAdminSection(page, "Auditoría");
  await expect(page).toHaveURL(/\/admin\/auditoria$/);
  await expect(page.getByRole("heading", { name: "Auditoría", level: 2 })).toBeVisible();
});
