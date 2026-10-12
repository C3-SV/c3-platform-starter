import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Variables del cliente y del servidor apuntando a los emuladores. NEXT_PUBLIC_* se usan en
 * el navegador; el resto, en las rutas de servidor. Ejecutar con `npm run test:e2e`, que inicia los emuladores.
 */
const emulatorEnv: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-c3-platform",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:0000000000:web:0000000000",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  GOOGLE_CLOUD_PROJECT: "demo-c3-platform",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Canal del navegador: en esta máquina, Microsoft Edge instalado. En CI se usa Chromium de Playwright.
    channel: process.env.PW_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "movil", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    // Build de producción: valida el build y evita la compilación bajo demanda de `next dev` durante la prueba.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, ...emulatorEnv } as Record<string, string>,
    timeout: 300_000,
  },
});
