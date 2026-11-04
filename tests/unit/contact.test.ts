import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionContact,
  contactEligibilityIssue,
  contactStatePresentation,
  nextContactStatus,
  parseContactMessage,
  parseShortlistReason,
} from "../../src/lib/domain/contact.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

const eligible = {
  isLinkedRepresentative: true,
  hasShortlistEntry: true,
  hasApprovedEnrollment: true,
  hasActiveRequest: false,
};

test("una solicitud nace esperando el consentimiento de la persona", () => {
  assert.equal(nextContactStatus(null, "company", "esperando_consentimiento"), "esperando_consentimiento");
  assert.equal(canTransitionContact(null, "participant", "aceptado"), false);
});

test("solo la persona puede aceptar o declinar una solicitud pendiente", () => {
  assert.equal(nextContactStatus("esperando_consentimiento", "participant", "aceptado"), "aceptado");
  assert.equal(nextContactStatus("esperando_consentimiento", "participant", "declinado"), "declinado");
  assert.equal(canTransitionContact("esperando_consentimiento", "company", "aceptado"), false);
});

test("la empresa solo registra contacto y seguimiento después de la aceptación", () => {
  assert.equal(canTransitionContact("esperando_consentimiento", "company", "contactado"), false);
  assert.equal(nextContactStatus("aceptado", "company", "contactado"), "contactado");
  assert.equal(nextContactStatus("contactado", "company", "seguimiento"), "seguimiento");
});

test("una persona puede revocar su permiso en cualquier estado activo y la solicitud queda cerrada", () => {
  for (const status of ["aceptado", "contactado", "seguimiento"] as const) {
    assert.equal(nextContactStatus(status, "participant", "revocado"), "revocado");
  }
  assert.equal(canTransitionContact("revocado", "participant", "aceptado"), false);
  assert.equal(canTransitionContact("declinado", "participant", "aceptado"), false);
});

test("no se puede solicitar contacto sin ser representante, sin lista corta o sin inscripción aprobada", () => {
  assert.equal(contactEligibilityIssue(eligible), null);
  assert.match(contactEligibilityIssue({ ...eligible, isLinkedRepresentative: false }) ?? "", /empresa/);
  assert.match(contactEligibilityIssue({ ...eligible, hasShortlistEntry: false }) ?? "", /lista corta/);
  assert.match(contactEligibilityIssue({ ...eligible, hasApprovedEnrollment: false }) ?? "", /inscripción aprobada/);
});

test("un mismo talento no tiene dos solicitudes activas para la misma organización", () => {
  assert.match(contactEligibilityIssue({ ...eligible, hasActiveRequest: true }) ?? "", /ya existe una solicitud/i);
});

test("el motivo de la lista corta es cualitativo: obligatorio entre 10 y 500 caracteres", () => {
  assert.equal(parseShortlistReason("  Su defensa explica los trade-offs del algoritmo.  "), "Su defensa explica los trade-offs del algoritmo.");
  assert.throws(() => parseShortlistReason("corto"), ValidationFailure);
  assert.throws(() => parseShortlistReason("x".repeat(501)), ValidationFailure);
  assert.throws(() => parseShortlistReason(undefined), ValidationFailure);
});

test("el mensaje de la solicitud de contacto es opcional y tiene límite", () => {
  assert.equal(parseContactMessage(undefined), null);
  assert.equal(parseContactMessage("   "), null);
  assert.equal(parseContactMessage("Nos gustaría conversar sobre la prueba de carga."), "Nos gustaría conversar sobre la prueba de carga.");
  assert.throws(() => parseContactMessage("x".repeat(501)), ValidationFailure);
});

test("la empresa ve estados de proceso y nunca «Contratado»", () => {
  const labels = ["esperando_consentimiento", "aceptado", "declinado", "contactado", "seguimiento", "revocado"].map(
    (status) => contactStatePresentation(status as never, "company").label,
  );
  assert.deepEqual(labels, ["Esperando consentimiento", "Aceptado", "Declinado", "Contactado", "Seguimiento", "Permiso revocado"]);
  assert.ok(!labels.some((label) => /contratad/i.test(label)));
});
