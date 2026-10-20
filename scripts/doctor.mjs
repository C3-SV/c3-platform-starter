// Diagnóstico del entorno local. Solo lee: no modifica archivos ni recursos externos y nunca imprime secretos.
// Uso: npm run doctor   (sale con código 1 si hay errores bloqueantes)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const results = { ok: 0, warn: 0, error: 0 };
const mark = { ok: "✔", warn: "⚠", error: "✖" };

function report(level, message, hint) {
  results[level] += 1;
  console.log(`${mark[level]} ${message}${hint ? `\n    → ${hint}` : ""}`);
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", shell: false });
  return { status: result.status, out: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}

function section(title) {
  console.log(`\n${title}`);
}

// --- Node y dependencias
section("Node y dependencias");
const nodeMajor = Number(process.versions.node.split(".")[0]);
const nvmrc = existsSync(join(root, ".nvmrc")) ? readFileSync(join(root, ".nvmrc"), "utf8").trim() : null;
if (nodeMajor < 22) report("error", `Node ${process.versions.node}: se requiere 22 o superior.`, "Instalá Node 22 (ver .nvmrc).");
else if (nvmrc && Number(nvmrc) !== nodeMajor) report("warn", `Node ${process.versions.node}; el proyecto fija ${nvmrc} en .nvmrc (CI usa 22).`);
else report("ok", `Node ${process.versions.node}`);

if (!existsSync(join(root, "package-lock.json"))) report("error", "Falta package-lock.json.", "El proyecto usa npm; no uses otro gestor.");
if (!existsSync(join(root, "node_modules", "next"))) report("error", "Dependencias sin instalar.", "Ejecutá `npm ci`.");
else report("ok", "Dependencias instaladas (npm)");

const firebaseTools = join(root, "node_modules", "firebase-tools", "package.json");
if (existsSync(firebaseTools)) report("ok", `Firebase CLI ${JSON.parse(readFileSync(firebaseTools, "utf8")).version} (local)`);
else report("error", "firebase-tools no está instalado.", "Ejecutá `npm ci`.");

const java = run("java", ["-version"]);
const javaMatch = java.status === 0 ? /version "(\d+)/.exec(java.out) : null;
if (!javaMatch) report("error", "Java no encontrado: los emuladores no arrancan.", "Windows: `winget install Microsoft.OpenJDK.21`.");
else if (Number(javaMatch[1]) < 21) report("error", `Java ${javaMatch[1]}: se requiere 21 o superior para el emulador.`);
else report("ok", `Java ${javaMatch[1]}`);

// --- Navegador para E2E
section("Pruebas de navegador");
const pwCache = process.env.PLAYWRIGHT_BROWSERS_PATH
  ?? (process.platform === "win32" ? join(process.env.LOCALAPPDATA ?? "", "ms-playwright") : join(process.env.HOME ?? "", ".cache", "ms-playwright"));
const hasChromium = existsSync(pwCache) && run(process.platform === "win32" ? "cmd" : "ls", process.platform === "win32" ? ["/c", "dir", "/b", pwCache] : [pwCache]).out.includes("chromium");
const edgePaths = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"];
const hasEdge = edgePaths.some(existsSync);
if (hasChromium || hasEdge) report("ok", `Navegador disponible (${[hasEdge && "Edge", hasChromium && "Chromium de Playwright"].filter(Boolean).join(", ")})`);
else report("warn", "Sin navegador para Playwright.", "`npx playwright install chromium` y ejecutá con PW_CHANNEL=chromium.");

// --- Firebase y variables de entorno
section("Firebase y variables (sin mostrar secretos)");
const envPath = join(root, ".env.local");
const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  report("ok", ".env.local presente");
} else {
  report("warn", ".env.local no existe.", "`cp .env.example .env.local` y completá el bloque de emuladores (README). En un worktree nuevo: `npm run worktree` lo copia.");
}
const usesEmulators = env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const clientProject = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const serverProject = env.GOOGLE_CLOUD_PROJECT;
if (existsSync(envPath)) {
  console.log(`  Proyecto cliente: ${clientProject || "(sin definir)"} · servidor: ${serverProject || "(sin definir)"} · emuladores: ${usesEmulators ? "sí" : "no"}`);
  if (usesEmulators) {
    if (!clientProject?.startsWith("demo-")) report("error", "Emuladores activos pero el proyecto cliente no es `demo-*`.", "Usá demo-c3-platform para desarrollo local.");
    if (serverProject && !serverProject.startsWith("demo-")) report("error", "Emuladores activos pero GOOGLE_CLOUD_PROJECT no es `demo-*`: riesgo de mezclar proyectos.");
    if (!env.FIRESTORE_EMULATOR_HOST || !env.FIREBASE_AUTH_EMULATOR_HOST) report("error", "Faltan FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST: el servidor podría hablar con Firebase real.");
    else report("ok", "Entorno LOCAL: navegador y servidor apuntan a emuladores");
  } else {
    report("warn", "El entorno apunta a Firebase REAL (emuladores desactivados).", "No ejecutes seeds ni pruebas de escritura. Para trabajar en local activá el bloque de emuladores.");
    if (env.FIRESTORE_EMULATOR_HOST) report("error", "Configuración mezclada: FIRESTORE_EMULATOR_HOST con emuladores de cliente desactivados.");
  }
}

// --- Puertos
section("Puertos");
const ports = [[3000, "next dev"], [3100, "E2E"], [4000, "UI de emuladores"], [8080, "Firestore"], [9099, "Auth"]];
await Promise.all(ports.map(([port, label]) => new Promise((done) => {
  const server = net.createServer();
  server.once("error", () => { report("warn", `Puerto ${port} (${label}) ocupado.`, "Otra sesión puede estar usándolo; cerrala o usá `npm run dev -- -p <otro>`."); done(); });
  server.once("listening", () => server.close(() => { report("ok", `Puerto ${port} libre (${label})`); done(); }));
  server.listen(port, "127.0.0.1");
})));

// --- Git
section("Git");
const git = (...args) => run("git", args);
const branch = git("rev-parse", "--abbrev-ref", "HEAD").out;
const gitDir = git("rev-parse", "--git-dir").out;
const commonDir = git("rev-parse", "--git-common-dir").out;
console.log(`  Rama: ${branch}${resolve(root, gitDir) !== resolve(root, commonDir) ? " (worktree enlazado)" : ""}`);
const email = git("config", "user.email").out;
if (!email) report("error", "Sin user.email en este repositorio.", "`git config user.email <correo>` (local al repo).");
else report("ok", `Identidad: ${git("config", "user.name").out} <${email}>`);
const tracked = git("ls-files").out.split("\n").filter((file) => /(^|\/)\.env(?!\.example$)[^/]*$|service-account|\.pem$/i.test(file));
if (tracked.length) report("error", `Archivos sensibles versionados: ${tracked.join(", ")}`, "Quitalos del índice (`git rm --cached`) y rotá las credenciales.");
else report("ok", "Sin archivos de credenciales versionados");
if (existsSync(envPath) && git("check-ignore", "-q", ".env.local").status !== 0) report("error", ".env.local no está ignorado por Git.");
const remote = git("remote", "get-url", "origin").out;
if (remote) report("warn", `origin → ${remote}`, "Repositorio público anterior: no hacer push ahí sin autorización.");

// --- Graphify
section("Graphify");
const graphify = run("graphify", ["--version"]);
if (graphify.status === 0) report("ok", `${graphify.out.split("\n")[0]}${existsSync(join(root, "graphify-out", "graph.json")) ? " · grafo presente" : " · sin grafo"}`);
else report("warn", "graphify no está instalado (opcional).", "El grafo versionado se puede leer igual (graphify-out/GRAPH_REPORT.md).");

console.log(`\nResumen: ${results.ok} correctos, ${results.warn} avisos, ${results.error} errores.`);
if (results.error) {
  console.log("Hay errores bloqueantes: corregilos antes de continuar.");
  process.exitCode = 1;
}
