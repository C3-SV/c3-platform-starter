import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { getChallengeConfig, updateChallengeConfig } from "../../src/lib/server/challengeConfig.ts";
import { createOrganization, linkRepresentative } from "../../src/lib/server/companies.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { enrollInChallenge, reviewEnrollment, saveDelivery } from "../../src/lib/server/participation.ts";
import { admin, clearAuth, clearFirestore, createAuthUser, joven, testAuth, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const duringDeadline = new Date("2026-11-10T18:00:00.000Z");
const afterDeadline = new Date("2026-11-20T00:00:00.000Z");
const representante = { uid: "rep-config", email: "rep@config.test", isAdmin: false };
const otraRepresentante = { uid: "rep-ajena", email: "rep@ajena.test", isAdmin: false };

function expectHttp(status: number, code?: string) {
  return (error: unknown) => error instanceof HttpError && error.status === status && (code === undefined || error.code === code);
}

async function scenario() {
  const db = testDb();
  await createAuthUser(representante.email, representante.uid);
  await createAuthUser(otraRepresentante.email, otraRepresentante.uid);
  const org = await createOrganization(db, admin, "Empresa de configuración", now);
  const other = await createOrganization(db, admin, "Empresa ajena", now);
  await linkRepresentative(db, testAuth(), admin, org.id, representante.email, now);
  await linkRepresentative(db, testAuth(), admin, other.id, otraRepresentante.email, now);
  const experience = await createExperience(db, admin, {
    title: "Experiencia de configuración",
    kind: "challenge_empresarial",
    summary: "Experiencia para comprobar que la empresa configura su challenge.",
    registrationOpensAt: "2026-10-01T00:00:00-06:00",
    registrationClosesAt: "2026-12-31T23:59:00-06:00",
  }, now);
  const challenge = await createChallenge(db, admin, {
    experienceId: experience.id,
    organizationId: org.id,
    title: "Challenge configurable",
    summary: "Resumen inicial del challenge configurable.",
    problem: "Problema inicial: una empresa ficticia necesita ordenar sus pedidos con criterios claros y explicables.",
    deliverables: ["Repositorio con instrucciones"],
    rubric: [{ label: "Calidad del resultado", maxScore: 10 }, { label: "Claridad del enfoque", maxScore: 10 }],
    organizationName: "Empresa de configuración",
    allows: ["individual"],
    teamMinSize: null,
    teamMaxSize: null,
    submissionClosesAt: "2026-11-14T23:59:00-06:00",
  }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  return { db, challengeId: challenge.id };
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("quien administra el challenge lo configura; otra empresa y una persona participante no", async () => {
  const { db, challengeId } = await scenario();
  const updated = await updateChallengeConfig(db, representante, challengeId, {
    summary: "Resumen actualizado por la empresa del challenge.",
    deliverables: ["Repositorio con instrucciones", "Video de dos minutos"],
  }, now);
  assert.equal(updated.summary, "Resumen actualizado por la empresa del challenge.");
  assert.deepEqual(updated.deliverables, ["Repositorio con instrucciones", "Video de dos minutos"]);
  assert.equal(updated.rubric.length, 2, "lo que no se edita se conserva");

  await assert.rejects(updateChallengeConfig(db, otraRepresentante, challengeId, { summary: "Intento de otra empresa por entrar." }, now), expectHttp(403));
  await assert.rejects(getChallengeConfig(db, joven, challengeId), expectHttp(403));
  assert.equal((await updateChallengeConfig(db, admin, challengeId, { summary: "Resumen ajustado por C3 para el challenge." }, now)).summary, "Resumen ajustado por C3 para el challenge.");
});

test("la configuración se valida y se cierra con el plazo de entregas", async () => {
  const { db, challengeId } = await scenario();
  await assert.rejects(updateChallengeConfig(db, representante, challengeId, { summary: "corto" }, now), (error) => error instanceof ValidationFailure);
  await assert.rejects(
    updateChallengeConfig(db, representante, challengeId, { rubric: [{ label: "Calidad", maxScore: 10, weight: 60 }, { label: "Claridad", maxScore: 10, weight: 30 }] }, now),
    (error) => error instanceof ValidationFailure,
  );
  await assert.rejects(updateChallengeConfig(db, representante, challengeId, { summary: "Resumen cambiado después del cierre." }, afterDeadline), expectHttp(409, "plazo_cerrado"));
});

test("la rúbrica se bloquea cuando ya hay entregas, pero el resto se sigue editando", async () => {
  const { db, challengeId } = await scenario();
  const enrollment = await enrollInChallenge(db, joven, challengeId, "individual", now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  await saveDelivery(db, joven, challengeId, { text: "Entrega en borrador para bloquear la rúbrica de este challenge.", links: [], submit: false }, duringDeadline);

  assert.equal((await getChallengeConfig(db, representante, challengeId)).rubricLocked, true);
  await assert.rejects(
    updateChallengeConfig(db, representante, challengeId, { rubric: [{ label: "Otro criterio nuevo", maxScore: 5 }] }, duringDeadline),
    expectHttp(409, "rubrica_bloqueada"),
  );
  const same = await updateChallengeConfig(db, representante, challengeId, {
    summary: "Resumen editado con entregas ya recibidas.",
    rubric: [{ label: "Calidad del resultado", maxScore: 10 }, { label: "Claridad del enfoque", maxScore: 10 }],
  }, duringDeadline);
  assert.equal(same.summary, "Resumen editado con entregas ya recibidas.");
});
