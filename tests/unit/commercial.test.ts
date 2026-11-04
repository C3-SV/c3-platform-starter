import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_CONDITIONS,
  COMMERCIAL_PACKAGES,
  commercialPackageOf,
  formatUsd,
  parseCommercialPackageId,
} from "../../src/lib/domain/commercial.ts";

test("los tres paquetes conservan la tarifa de referencia aprobada", () => {
  assert.deepEqual(
    COMMERCIAL_PACKAGES.map((item) => [item.id, item.referenceFeeUsd]),
    [["esencial", 800], ["completo", 1500], ["destacado", 3000]],
  );
});

test("cada paquete explica qué recibe la empresa, no solo su precio", () => {
  for (const item of COMMERCIAL_PACKAGES) {
    assert.ok(item.companyValue.length >= 40, `${item.id} necesita un valor observable para la empresa`);
    assert.ok(item.includes.length >= 2, `${item.id} necesita al menos dos elementos incluidos`);
  }
});

test("las condiciones transversales excluyen premios, licencias y contrataciones garantizadas", () => {
  const text = COMMERCIAL_CONDITIONS.join(" ").toLowerCase();
  assert.match(text, /premio/);
  assert.match(text, /licencia|propiedad intelectual/);
  assert.match(text, /contrataci/);
});

test("el paquete se valida contra la lista cerrada y nunca acepta valores libres", () => {
  assert.equal(parseCommercialPackageId("completo"), "completo");
  assert.equal(parseCommercialPackageId("premium"), null);
  assert.equal(parseCommercialPackageId(""), null);
  assert.equal(parseCommercialPackageId(undefined), null);
  assert.equal(commercialPackageOf("destacado")?.label, "Destacado");
  assert.equal(commercialPackageOf("otro"), null);
});

test("formatUsd muestra la tarifa en dólares con separador de miles", () => {
  assert.equal(formatUsd(800), "US$800");
  assert.equal(formatUsd(1500), "US$1,500");
  assert.equal(formatUsd(3000), "US$3,000");
});
