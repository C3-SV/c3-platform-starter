import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

test("las consultas del servidor no necesitan índices compuestos: solo igualdad y un orderBy de un campo", () => {
  const indexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8")) as { indexes: unknown[] };
  const inequality = /\.where\([^)]*,\s*["'](<|>|<=|>=|!=|not-in|array-contains-any)["']/;
  const withOrder: string[] = [];
  for (const file of sources("src/lib/server")) {
    const text = readFileSync(file, "utf8");
    assert.equal(inequality.test(text), false, `${file}: un filtro de desigualdad puede exigir un índice compuesto; declará el índice y actualizá esta prueba`);
    if (text.includes(".orderBy(")) withOrder.push(file.replaceAll("\\", "/"));
  }
  assert.deepEqual(withOrder, ["src/lib/server/audit.ts"], "un orderBy nuevo junto a filtros exige declarar su índice en firestore.indexes.json");
  assert.deepEqual(indexes.indexes, [], "firestore.indexes.json no declara índices porque ninguna consulta los necesita");
});
