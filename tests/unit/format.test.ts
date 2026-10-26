import test from "node:test";
import assert from "node:assert/strict";
import { initialsOf } from "../../src/lib/domain/format.ts";

test("las iniciales usan nombre y apellido, o las dos primeras letras de una sola palabra", () => {
  assert.equal(initialsOf("Lucía Robles de Prueba", null), "LP");
  assert.equal(initialsOf("ana", null), "AN");
  assert.equal(initialsOf("  María   José  ", null), "MJ");
});

test("sin nombre se usa el correo y, sin nada, C3", () => {
  assert.equal(initialsOf(null, "noelia.movil@correo.test"), "NO");
  assert.equal(initialsOf("", ""), "C3");
  assert.equal(initialsOf(undefined, undefined), "C3");
});
