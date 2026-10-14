import { spawnSync } from "node:child_process";

await import("./seed-e2e.mjs");

const command = process.platform === "win32" ? "playwright.cmd" : "playwright";
const result = spawnSync(command, ["test", ...process.argv.slice(2)], { stdio: "inherit", shell: process.platform === "win32" });
process.exitCode = result.status ?? 1;
