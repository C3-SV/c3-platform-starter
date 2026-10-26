import test from "node:test";
import assert from "node:assert/strict";
import { AFTER_LOGIN_PATH, evaluationHref, loginHref, safeNext } from "../../src/lib/domain/navigation.ts";

test("sin destino válido, tras entrar se va a Mi C3", () => {
  assert.equal(AFTER_LOGIN_PATH, "/mi-c3");
  assert.equal(safeNext(null), "/mi-c3");
  assert.equal(safeNext(undefined), "/mi-c3");
  assert.equal(safeNext(""), "/mi-c3");
});

test("un destino interno se conserva con su consulta", () => {
  assert.equal(safeNext("/retos/abc"), "/retos/abc");
  assert.equal(safeNext("/retos/abc/inscripcion?x=1"), "/retos/abc/inscripcion?x=1");
  assert.equal(safeNext("/mi-c3/evaluar/abc"), "/mi-c3/evaluar/abc");
});

test("no acepta destinos externos ni trucos de ruta", () => {
  for (const hostile of ["https://evil.example", "//evil.example", "/\\evil.example", "\\evil.example", "javascript:alert(1)", "/ok\nHost: evil", "/ok\t/x", " /ok", "mi-c3"]) {
    assert.equal(safeNext(hostile), "/mi-c3", `debería rechazar ${JSON.stringify(hostile)}`);
  }
});

test("no vuelve a la pantalla de acceso ni acepta rutas demasiado largas", () => {
  assert.equal(safeNext("/acceso"), "/mi-c3");
  assert.equal(safeNext("/acceso?next=/mi-c3"), "/mi-c3");
  assert.equal(safeNext(`/${"a".repeat(600)}`), "/mi-c3");
});

test("el destino alternativo solo se usa si es seguro", () => {
  assert.equal(safeNext(null, "/"), "/");
  assert.equal(safeNext("https://evil.example", "/explorar"), "/explorar");
});

test("el enlace de acceso lleva el destino y el modo solo cuando corresponden", () => {
  assert.equal(loginHref(), "/acceso");
  assert.equal(loginHref({ next: "/retos/abc" }), "/acceso?next=%2Fretos%2Fabc");
  assert.equal(loginHref({ next: "/" }), "/acceso");
  assert.equal(loginHref({ next: "/acceso" }), "/acceso");
  assert.equal(loginHref({ next: "https://evil.example" }), "/acceso");
  assert.equal(loginHref({ mode: "registro" }), "/acceso?modo=registro");
  assert.equal(loginHref({ mode: "registro", next: "/retos/abc/inscripcion" }), "/acceso?modo=registro&next=%2Fretos%2Fabc%2Finscripcion");
});

test("la evaluación tiene una sola dirección canónica", () => {
  assert.equal(evaluationHref("abc"), "/mi-c3/evaluar/abc");
  assert.equal(evaluationHref("a b/c"), "/mi-c3/evaluar/a%20b%2Fc");
});
