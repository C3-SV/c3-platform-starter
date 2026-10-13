import test from "node:test";
import assert from "node:assert/strict";
import { parseProfileDetails } from "../../src/lib/domain/profile.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

const base = { displayName: "Ana Pineda de Prueba", school: "UCA", bio: "Backend y optimización.", github: "", linkedin: "" };

function fieldsOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationFailure) return error.issues.map((issue) => issue.field).sort();
    throw error;
  }
  return [];
}

test("el perfil autodeclarado acepta enlaces https opcionales", () => {
  assert.deepEqual(parseProfileDetails({ ...base, github: "https://github.com/ana" }).github, "https://github.com/ana");
  assert.equal(parseProfileDetails(base).linkedin, "");
});

test("los enlaces sin https o inválidos se rechazan", () => {
  assert.deepEqual(fieldsOf(() => parseProfileDetails({ ...base, github: "http://github.com/ana" })), ["github"]);
  assert.deepEqual(fieldsOf(() => parseProfileDetails({ ...base, linkedin: "no es una url" })), ["linkedin"]);
});

test("el nombre es obligatorio y la presentación tiene un tope", () => {
  assert.deepEqual(fieldsOf(() => parseProfileDetails({ ...base, displayName: "A" })), ["displayName"]);
  assert.deepEqual(fieldsOf(() => parseProfileDetails({ ...base, bio: "x".repeat(501) })), ["bio"]);
});
