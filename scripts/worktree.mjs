// Crea un worktree de Git para un objetivo concreto, junto al repositorio principal.
// Uso: npm run worktree -- <nombre> [--base <ref>] [--branch <rama>] [--dry-run]
// No elimina nada, no hace push y no duplica worktrees ni ramas ocupadas. Copia .env.local (sin versionarlo).
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const valueOf = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
const name = argv.find((arg, index) => !arg.startsWith("--") && !["--base", "--branch"].includes(argv[index - 1]));
const dryRun = argv.includes("--dry-run");

function fail(message) {
  console.error(`Worktree detenido: ${message}`);
  process.exit(1);
}

const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });

if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) fail("indicá un nombre en minúsculas, ej. `npm run worktree -- ux`.");
const base = valueOf("--base") ?? "HEAD";
const branch = valueOf("--branch") ?? `feat/${name}`;
const target = resolve(root, "..", `c3-platform-${name}`);

const listed = git("worktree", "list", "--porcelain").stdout;
if (existsSync(target)) fail(`ya existe ${target}.`);
if (listed.split("\n").some((line) => line === `branch refs/heads/${branch}`)) fail(`la rama ${branch} ya está abierta en otro worktree.`);

const branchExists = git("show-ref", "--verify", "--quiet", `refs/heads/${branch}`).status === 0;
const args = branchExists ? ["worktree", "add", target, branch] : ["worktree", "add", "-b", branch, target, base];
console.log(`git ${args.join(" ")}`);
if (dryRun) {
  console.log("(simulación: no se creó nada)");
  process.exit(0);
}

const created = git(...args);
if (created.status !== 0) fail(created.stderr.trim());

const envSource = join(root, ".env.local");
if (existsSync(envSource)) {
  copyFileSync(envSource, join(target, ".env.local"));
  console.log("Copiado .env.local (ignorado por Git, no se versiona).");
} else {
  console.log("No hay .env.local en el repositorio principal; creá uno desde .env.example.");
}

console.log(`\nListo: ${target} (rama ${branch}, base ${base}${branchExists ? " — rama existente" : ""})`);
console.log("Siguientes pasos:\n  cd " + target + "\n  npm ci\n  npm run doctor");
console.log("Retirar al terminar (tras integrar): git worktree remove " + target);
