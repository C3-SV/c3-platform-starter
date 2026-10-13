import test from "node:test";
import assert from "node:assert/strict";
import { isHoneypotFilled, parseProposalInput, parseReviewInput, proposalNextStep, proposalPresentation } from "../../src/lib/domain/proposals.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";

const valid = {
  companyName: "Transportes Delta",
  contactName: "Marcela Reyes, jefa de operaciones",
  contactEmail: "  MReyes@Delta.test ",
  problem: "Armamos las rutas de reparto a mano cada mañana y no respetan las ventanas horarias del cliente.",
  desiredOutcome: "Comparar enfoques automáticos sobre los mismos datos.",
  constraints: "Podemos compartir 400 pedidos anonimizados.",
  consent: true,
};

function issuesOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationFailure) return error.issues.map((issue) => issue.field).sort();
    throw error;
  }
  return [];
}

test("una propuesta válida se normaliza: correo en minúsculas y sin espacios", () => {
  const parsed = parseProposalInput(valid);
  assert.equal(parsed.contactEmail, "mreyes@delta.test");
  assert.equal(parsed.companyName, "Transportes Delta");
});

test("sin consentimiento o con datos incompletos la propuesta no se guarda", () => {
  assert.deepEqual(issuesOf(() => parseProposalInput({ ...valid, consent: false })), ["consent"]);
  assert.deepEqual(
    issuesOf(() => parseProposalInput({ ...valid, contactEmail: "mreyes@", problem: "corto" })),
    ["contactEmail", "problem"],
  );
});

test("el campo trampa detecta a los bots cuando llega con texto", () => {
  assert.equal(isHoneypotFilled({ website: "http://spam.test" }), true);
  assert.equal(isHoneypotFilled({ website: "" }), false);
  assert.equal(isHoneypotFilled({}), false);
});

test("pedir ajustes exige una nota para la empresa", () => {
  assert.deepEqual(issuesOf(() => parseReviewInput({ status: "needs_changes", note: "Corto" })), ["note"]);
  const review = parseReviewInput({ status: "needs_changes", note: "Definan el formato de salida esperado." });
  assert.equal(review.status, "needs_changes");
});

test("aceptar y no priorizar no piden nota; un estado desconocido se rechaza", () => {
  assert.equal(parseReviewInput({ status: "accepted", organizationId: "org-1" }).organizationId, "org-1");
  assert.equal(parseReviewInput({ status: "not_prioritized" }).note, "");
  assert.deepEqual(issuesOf(() => parseReviewInput({ status: "publicada" })), ["status"]);
});

test("los estados de propuesta tienen etiqueta, tono y siguiente paso", () => {
  assert.deepEqual(proposalPresentation("received"), { label: "En revisión", tone: "info" });
  assert.deepEqual(proposalPresentation("needs_changes"), { label: "Requiere ajustes", tone: "advertencia" });
  assert.match(proposalNextStep("received"), /escribirá/);
});
