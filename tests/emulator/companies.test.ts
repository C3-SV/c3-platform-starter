import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import {
  createOrganization,
  getCompanySpace,
  linkRepresentative,
  listOrganizations,
} from "../../src/lib/server/companies.ts";
import { enrollInChallenge, reviewEnrollment, saveDelivery } from "../../src/lib/server/participation.ts";
import { listProposals, RATE_LIMIT_MAX, reviewProposal, submitProposal } from "../../src/lib/server/proposals.ts";
import { admin, clearAuth, clearFirestore, createAuthUser, joven, testAuth, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const duringDeadline = new Date("2026-11-10T18:00:00.000Z");
const otra = { uid: "joven-2", email: "otra@correo.test", isAdmin: false };
const representante = { uid: "rep-atlas", email: "rep@atlas.test", isAdmin: false };
const representanteOtra = { uid: "rep-meridiano", email: "rep@meridiano.test", isAdmin: false };

const proposal = {
  companyName: "Distribuidora Atlas",
  contactName: "Sofía Guzmán, gerencia",
  contactEmail: "sguzman@atlas.test",
  problem: "Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, con diferencias tardías.",
  desiredOutcome: "Ver enfoques automáticos para cruzar extractos.",
  constraints: "Podemos compartir extractos anonimizados.",
  consent: true,
};

const experienceInput = {
  title: "Experiencia de empresas",
  kind: "challenge_empresarial",
  summary: "Retos que plantean empresas reales para equipos jóvenes.",
  registrationOpensAt: "2026-10-01T00:00:00-06:00",
  registrationClosesAt: "2026-12-31T23:59:00-06:00",
};

function challengeFor(experienceId: string, organizationId: string) {
  return {
    experienceId,
    organizationId,
    title: "Conciliación bancaria automática",
    summary: "Cruzar extractos bancarios con el libro contable.",
    problem: "Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, y las diferencias llegan tarde.",
    deliverables: ["Repositorio con instrucciones"],
    rubric: [{ label: "Exactitud", maxScore: 10 }],
    organizationName: "Distribuidora Atlas",
    allows: ["individual"],
    teamMinSize: null,
    teamMaxSize: null,
    submissionClosesAt: "2026-11-14T23:59:00-06:00",
  };
}

function expectHttp(status: number, code?: string) {
  return (error: unknown) => error instanceof HttpError && error.status === status && (code === undefined || error.code === code);
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("una propuesta válida se guarda con su referencia; el campo trampa no escribe nada", async () => {
  const db = testDb();
  const saved = await submitProposal(db, proposal, "conexion-a", now);
  assert.equal(saved.stored, true);
  assert.equal(saved.reference.length, 6);
  const trap = await submitProposal(db, { ...proposal, website: "http://spam.test" }, "conexion-b", now);
  assert.equal(trap.stored, false);
  assert.equal((await db.collection("companyProposals").get()).size, 1);
});

test("una propuesta inválida se rechaza con motivos y no se guarda", async () => {
  const db = testDb();
  await assert.rejects(
    submitProposal(db, { ...proposal, contactEmail: "sguzman@", consent: false }, "conexion-a", now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "consent"),
  );
  assert.equal((await db.collection("companyProposals").get()).size, 0);
});

test("una conexión envía hasta cinco propuestas por hora y la sexta recibe 429", async () => {
  const db = testDb();
  for (let index = 0; index < RATE_LIMIT_MAX; index += 1) {
    await submitProposal(db, proposal, "conexion-a", now);
  }
  await assert.rejects(submitProposal(db, proposal, "conexion-a", now), expectHttp(429, "demasiados_intentos"));
  await submitProposal(db, proposal, "conexion-b", now);
  const later = new Date(now.getTime() + 61 * 60 * 1000);
  await submitProposal(db, proposal, "conexion-a", later);
  assert.equal((await db.collection("rateLimits").doc("conexion-a").get()).data()?.count, 1);
});

test("solo C3 revisa propuestas; pedir ajustes guarda la nota y aceptar vincula la organización", async () => {
  const db = testDb();
  const saved = await submitProposal(db, proposal, "conexion-a", now);
  assert.equal((await listProposals(db, admin)).length, 1);
  await assert.rejects(listProposals(db, otra), expectHttp(403));

  const id = (await db.collection("companyProposals").get()).docs[0].id;
  assert.equal(id.slice(0, 6).toUpperCase(), saved.reference);
  await assert.rejects(reviewProposal(db, admin, id, { status: "needs_changes", note: "corto" }, now), (error) => error instanceof ValidationFailure);
  const adjusted = await reviewProposal(db, admin, id, { status: "needs_changes", note: "Definan el formato de salida esperado." }, now);
  assert.equal(adjusted.status, "needs_changes");
  assert.equal(adjusted.reviewNote, "Definan el formato de salida esperado.");

  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  const accepted = await reviewProposal(db, admin, id, { status: "accepted", organizationId: org.id }, now);
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.organizationId, org.id);
});

test("solo C3 crea organizaciones y vincula representantes por correo de una cuenta existente", async () => {
  const db = testDb();
  const auth = testAuth();
  await createAuthUser(representante.email, representante.uid);
  await assert.rejects(createOrganization(db, joven, "Atlas", now), expectHttp(403));
  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  assert.deepEqual((await listOrganizations(db, admin)).map((item) => item.name), ["Distribuidora Atlas"]);

  await assert.rejects(linkRepresentative(db, auth, joven, org.id, representante.email, now), expectHttp(403));
  await assert.rejects(linkRepresentative(db, auth, admin, org.id, "nadie@atlas.test", now), expectHttp(404));
  await linkRepresentative(db, auth, admin, org.id, representante.email, now);
  assert.equal((await db.collection("organizationMembers").get()).size, 1);
});

test("el representante ve sus retos publicados y solo las soluciones enviadas; nunca borradores", async () => {
  const db = testDb();
  const auth = testAuth();
  await createAuthUser(representante.email, representante.uid);
  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  await linkRepresentative(db, auth, admin, org.id, representante.email, now);

  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeFor(experience.id, org.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);

  const enrollment = await enrollInChallenge(db, joven, challenge.id, "individual", now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  await saveDelivery(db, joven, challenge.id, { text: "Borrador privado que nadie más debe ver aún.", links: [], submit: false }, duringDeadline);

  const beforeSubmit = await getCompanySpace(db, representante, duringDeadline);
  assert.equal(beforeSubmit.challenges.length, 1);
  assert.equal(beforeSubmit.challenges[0].submissions.length, 0, "el borrador no es visible para la empresa");

  await saveDelivery(db, joven, challenge.id, {
    text: "Conciliación automática con reglas de tolerancia y revisión manual de diferencias.",
    links: ["https://github.com/equipo/conciliacion"],
    submit: true,
  }, duringDeadline);
  const afterSubmit = await getCompanySpace(db, representante, duringDeadline);
  assert.equal(afterSubmit.challenges[0].submissions.length, 1);
  assert.equal(afterSubmit.challenges[0].submissions[0].name, null, "sin perfil de usuario no hay nombre que mostrar");
  assert.equal(afterSubmit.challenges[0].submissions[0].mode, "individual");
});

test("una persona de otra organización o sin vínculo no ve retos ajenos", async () => {
  const db = testDb();
  const auth = testAuth();
  await createAuthUser(representante.email, representante.uid);
  await createAuthUser(representanteOtra.email, representanteOtra.uid);
  const atlas = await createOrganization(db, admin, "Distribuidora Atlas", now);
  const meridiano = await createOrganization(db, admin, "Grupo Meridiano", now);
  await linkRepresentative(db, auth, admin, atlas.id, representante.email, now);
  await linkRepresentative(db, auth, admin, meridiano.id, representanteOtra.email, now);

  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeFor(experience.id, atlas.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);

  assert.equal((await getCompanySpace(db, representanteOtra, now)).challenges.length, 0);
  const empty = await getCompanySpace(db, otra, now);
  assert.deepEqual(empty, { organizations: [], challenges: [], proposals: [] });
});

test("el espacio de empresa incluye las propuestas aceptadas y vinculadas a la organización", async () => {
  const db = testDb();
  const auth = testAuth();
  await createAuthUser(representante.email, representante.uid);
  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  await linkRepresentative(db, auth, admin, org.id, representante.email, now);
  await submitProposal(db, proposal, "conexion-a", now);
  const id = (await db.collection("companyProposals").get()).docs[0].id;
  await reviewProposal(db, admin, id, { status: "accepted", organizationId: org.id }, now);

  const space = await getCompanySpace(db, representante, now);
  assert.equal(space.organizations[0].name, "Distribuidora Atlas");
  assert.equal(space.proposals.length, 1);
  assert.equal(space.proposals[0].status, "accepted");
});
