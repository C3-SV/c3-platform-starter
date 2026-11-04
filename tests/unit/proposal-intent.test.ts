import test from "node:test";
import assert from "node:assert/strict";
import { parseProposalInput, PROPOSAL_INTENTS } from "../../src/lib/domain/proposals.ts";

const base = {
  companyName: "Transportes Delta",
  contactName: "Marcela Reyes, jefa de operaciones",
  contactEmail: "mreyes@delta.test",
  problem: "Armamos las rutas de reparto a mano cada mañana y no respetan las ventanas horarias del cliente.",
  consent: true,
};

test("la intención es una sola selección opcional entre tres opciones", () => {
  assert.deepEqual([...PROPOSAL_INTENTS], ["talento", "solucion", "ambos"]);
  assert.equal(parseProposalInput({ ...base, intent: "talento" }).intent, "talento");
  assert.equal(parseProposalInput({ ...base, intent: "ambos" }).intent, "ambos");
});

test("sin intención o con un valor fuera de la lista, la propuesta se guarda sin intención", () => {
  assert.equal(parseProposalInput(base).intent, null);
  assert.equal(parseProposalInput({ ...base, intent: "" }).intent, null);
  assert.equal(parseProposalInput({ ...base, intent: "contratar" }).intent, null);
});
