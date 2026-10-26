import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_HOME, ADMIN_SECTIONS, adminHref, adminSectionOf, parseAdminSection, pendingFor } from "../../src/lib/domain/admin-nav.ts";

test("las secciones siguen el ciclo de vida y cada una tiene su dirección", () => {
  assert.deepEqual(ADMIN_SECTIONS.map((section) => section.id), ["resumen", "propuestas", "experiencias", "inscripciones", "entregas", "jurados", "resultados"]);
  assert.equal(ADMIN_HOME, "resumen");
  assert.equal(adminHref("propuestas"), "/admin/propuestas");
  assert.equal(adminHref("inscripciones", { reto: "abc" }), "/admin/inscripciones?reto=abc");
});

test("solo se aceptan las secciones conocidas", () => {
  assert.equal(parseAdminSection("jurados"), "jurados");
  for (const invalid of ["", "Jurados", "../x", "admin", null, undefined]) {
    assert.equal(parseAdminSection(invalid as string | null | undefined), null, `debería rechazar ${String(invalid)}`);
  }
  assert.equal(adminSectionOf("entregas").label, "Entregas");
});

test("los contadores del menú solo cuentan lo que C3 debe atender", () => {
  const pending = { proposals: 2, enrollments: 3 };
  assert.equal(pendingFor("propuestas", pending), 2);
  assert.equal(pendingFor("inscripciones", pending), 3);
  assert.equal(pendingFor("entregas", pending), 0);
  assert.equal(pendingFor("propuestas", null), 0);
});
