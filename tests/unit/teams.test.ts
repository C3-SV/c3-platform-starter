import test from "node:test";
import assert from "node:assert/strict";
import { generateTeamCode, normalizeTeamCode, parseTeamName, teamSlotsLabel, teamStatus, TEAM_CODE_ALPHABET } from "../../src/lib/domain/teams.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

test("el código tiene formato C3-XXXX sin caracteres ambiguos", () => {
  const code = generateTeamCode(() => 0.99);
  assert.match(code, /^C3-[23456789A-HJ-KMNP-Z]{4}$/);
  assert.equal(code.includes("0"), false);
  assert.equal(code.includes("O"), false);
  assert.equal(code.includes("I"), false);
  assert.equal(code.includes("L"), false);
  assert.equal(TEAM_CODE_ALPHABET.length, 31);
});

test("el generador determinista produce el mismo código con la misma semilla", () => {
  assert.equal(generateTeamCode(() => 0), `C3-${TEAM_CODE_ALPHABET[0].repeat(4)}`);
});

test("normalizar acepta minúsculas y espacios, y rechaza lo que no es un código", () => {
  assert.equal(normalizeTeamCode(" c3-7kq4 "), "C3-7KQ4");
  assert.equal(normalizeTeamCode("C3 7KQ4"), "C3-7KQ4");
  assert.equal(normalizeTeamCode("C3-7KQ0"), null, "el cero no pertenece al alfabeto");
  assert.equal(normalizeTeamCode("7KQ4"), null);
  assert.equal(normalizeTeamCode(null), null);
});

test("el nombre del equipo tiene entre 2 y 60 caracteres", () => {
  assert.equal(parseTeamName("  Rutas en caliente "), "Rutas en caliente");
  assert.throws(() => parseTeamName("A"), ValidationFailure);
  assert.throws(() => parseTeamName("x".repeat(61)), ValidationFailure);
});

test("el equipo se habilita al alcanzar el mínimo de integrantes", () => {
  assert.equal(teamStatus(1, 2), "incompleto");
  assert.equal(teamStatus(2, 2), "habilitado");
  assert.equal(teamStatus(4, 2), "habilitado");
});

test("la leyenda de cupos muestra integrantes, máximo y mínimo", () => {
  assert.equal(teamSlotsLabel(3, 2, 4), "3 de 4 integrantes · mínimo 2");
});
