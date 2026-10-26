import test from "node:test";
import assert from "node:assert/strict";
import {
  NO_CAPABILITIES,
  accountMenu,
  appNavigation,
  isJudge,
  isRepresentative,
  parseCapabilities,
  spacesOf,
  type Capabilities,
} from "../../src/lib/domain/capabilities.ts";

const representative: Capabilities = { admin: false, organizations: [{ id: "org1", name: "Ruteo SA" }], judge: { challenges: 0 } };
const everything: Capabilities = { admin: true, organizations: [{ id: "a", name: "A" }, { id: "b", name: "B" }], judge: { challenges: 2 } };

test("una cuenta sin vínculos solo ve los accesos de participante", () => {
  assert.deepEqual(appNavigation(NO_CAPABILITIES).map((item) => item.id), ["mi-c3", "explorar", "trayectoria"]);
  assert.deepEqual(accountMenu(NO_CAPABILITIES).map((item) => item.id), ["mi-c3", "trayectoria", "cuenta"]);
  assert.deepEqual(spacesOf(NO_CAPABILITIES), []);
  assert.equal(isRepresentative(NO_CAPABILITIES), false);
  assert.equal(isJudge(NO_CAPABILITIES), false);
});

test("la representante de una organización ve su espacio de empresa en la navegación y en el menú", () => {
  assert.deepEqual(appNavigation(representative).map((item) => item.label), ["Mi C3", "Explorar", "Trayectoria", "Mi empresa"]);
  const menu = accountMenu(representative);
  assert.deepEqual(menu.map((item) => item.id), ["mi-c3", "trayectoria", "cuenta", "empresa"]);
  assert.equal(menu.find((item) => item.id === "empresa")?.href, "/empresa");
  assert.equal(menu.find((item) => item.id === "empresa")?.description, "Ruteo SA");
});

test("la administradora ve Admin; con varios sombreros ve todos los espacios", () => {
  assert.equal(appNavigation({ ...NO_CAPABILITIES, admin: true }).at(-1)?.href, "/admin");
  assert.deepEqual(spacesOf(everything).map((item) => item.id), ["empresa", "admin"]);
  assert.equal(accountMenu(everything).find((item) => item.id === "empresa")?.description, "2 organizaciones");
  assert.equal(isJudge(everything), true);
});

test("la evaluación no tiene un acceso propio: vive en Mi C3", () => {
  const ids = new Set([...appNavigation(everything), ...accountMenu(everything), ...spacesOf(everything)].map((item) => item.id));
  assert.equal(ids.has("evaluar" as never), false);
});

test("la respuesta del servidor se valida: cualquier forma inesperada no concede nada", () => {
  assert.deepEqual(parseCapabilities(null), NO_CAPABILITIES);
  assert.deepEqual(parseCapabilities("admin"), NO_CAPABILITIES);
  assert.deepEqual(parseCapabilities({ admin: "true", organizations: "x", judge: 5 }), NO_CAPABILITIES);
  assert.deepEqual(
    parseCapabilities({ admin: true, organizations: [{ id: "o", name: "Org" }, { id: 3 }, null, { id: "", name: "x" }], judge: { challenges: 2.7 } }),
    { admin: true, organizations: [{ id: "o", name: "Org" }], judge: { challenges: 2 } },
  );
  assert.deepEqual(parseCapabilities({ judge: { challenges: -4 } }).judge, { challenges: 0 });
  assert.deepEqual(parseCapabilities({ judge: { challenges: Number.NaN } }).judge, { challenges: 0 });
});
