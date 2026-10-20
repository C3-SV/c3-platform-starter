import { expect, test } from "@playwright/test";

// Solo corre con `npm run test:capturas` (la configuración la excluye del E2E normal).
// Para fijar una referencia: copiá capturas/actual a capturas/referencia y compará después a ojo o con una herramienta de diff.
const RUTAS = ["/", "/explorar", "/compite", "/crea", "/conecta", "/acceso", "/empresa/proponer"];
const DIRECTORIO = process.env.CAPTURAS_DIR ?? "capturas/actual";

for (const ruta of RUTAS) {
  test(`captura ${ruta}`, async ({ page }, testInfo) => {
    const errores: string[] = [];
    page.on("pageerror", (error) => errores.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errores.push(`console: ${message.text()}`);
    });

    const respuesta = await page.goto(ruta, { waitUntil: "networkidle" });
    expect(respuesta?.status()).toBeLessThan(400);

    const nombre = ruta === "/" ? "home" : ruta.slice(1).replaceAll("/", "-");
    await page.screenshot({ path: `${DIRECTORIO}/${testInfo.project.name}__${nombre}.png`, fullPage: true });

    // El navegador pide /favicon.ico por su cuenta y el proyecto aún no define icono: ese 404 no es un fallo de la página.
    // Se ignora solo si el favicon realmente responde 404; cualquier otro recurso fallido sigue siendo error.
    const favicon = await page.request.get("/favicon.ico");
    const sinFavicon = favicon.status() === 404;
    const relevantes = errores.filter((error) => !(sinFavicon && /Failed to load resource.*404/.test(error)));
    if (sinFavicon && relevantes.length !== errores.length) testInfo.annotations.push({ type: "aviso", description: "/favicon.ico responde 404 (sin icono definido)" });

    expect(relevantes, "errores de consola o de página").toEqual([]);
  });
}
