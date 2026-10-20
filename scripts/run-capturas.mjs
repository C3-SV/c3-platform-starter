// Capturas de las páginas principales (escritorio y móvil) en capturas/actual/ (ignorado por Git).
// Se ejecuta con `npm run test:capturas`, que levanta los emuladores igual que test:e2e.
process.env.CAPTURAS = "1";
process.argv.push("e2e/capturas.spec.ts");
await import("./run-e2e.mjs");
