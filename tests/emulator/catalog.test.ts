import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createChallenge,
  createExperience,
  getPublicChallenge,
  listAdminCatalog,
  listPublicCatalog,
  setChallengeStatus,
  setExperienceStatus,
} from "../../src/lib/server/catalog.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { admin, clearFirestore, joven, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");

const experienceInput = {
  title: "Hackathon de Turismo Creativo",
  kind: "hackathon",
  summary: "Seis challenges de turismo resueltos por equipos durante un fin de semana.",
  registrationOpensAt: "2026-10-01T00:00:00-06:00",
  registrationClosesAt: "2026-12-31T23:59:00-06:00",
};

const challengeInput = (experienceId: string) => ({
  experienceId,
  title: "Ruteo de última milla con ventanas horarias",
  summary: "Armar rutas diarias respetando ventanas horarias del cliente.",
  problem: "Transportes Delta arma rutas a mano cada mañana y no respeta las ventanas horarias pactadas.",
  deliverables: ["Repositorio con instrucciones", "Demo de 4 minutos"],
  rubric: [{ label: "Calidad del resultado", maxScore: 10 }, { label: "Claridad del enfoque", maxScore: 10 }],
  organizationName: "Transportes Delta",
  allows: ["individual", "team"],
  teamMinSize: 2,
  teamMaxSize: 4,
  submissionClosesAt: "2026-11-14T23:59:00-06:00",
});

beforeEach(async () => {
  await clearFirestore();
});

test("solo administradores crean experiencias; un joven recibe 403 y no queda ningún documento", async () => {
  const db = testDb();
  await assert.rejects(createExperience(db, joven, experienceInput, now), (error) => error instanceof HttpError && error.status === 403);
  const snapshot = await db.collection("experiences").get();
  assert.equal(snapshot.size, 0);
});

test("la experiencia nueva empieza en borrador y no aparece en el catálogo público", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  assert.equal(experience.status, "draft");
  assert.deepEqual(await listPublicCatalog(db, now), []);
});

test("un challenge publicado solo es público si su experiencia también está publicada", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);

  assert.deepEqual(await listPublicCatalog(db, now), []);
  await assert.rejects(getPublicChallenge(db, challenge.id, now), (error) => error instanceof HttpError && error.status === 404);

  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  const catalog = await listPublicCatalog(db, now);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].challenges.length, 1);
  assert.equal(catalog[0].challenges[0].title, challenge.title);

  const detail = await getPublicChallenge(db, challenge.id, now);
  assert.equal(detail.challenge.rubric[0].id, "c1");
  assert.equal(detail.experience.title, experienceInput.title);
});

test("el detalle público no expone campos internos como el autor", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  const detail = await getPublicChallenge(db, challenge.id, now);
  assert.equal("createdByUid" in detail.challenge, false);
  assert.equal("createdByUid" in detail.experience, false);
});

test("un challenge inválido se rechaza con motivos por campo y no se guarda", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  await assert.rejects(
    createChallenge(db, admin, { ...challengeInput(experience.id), allows: [], submissionClosesAt: "2020-01-01T00:00:00Z" }, now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "submissionClosesAt"),
  );
  assert.equal((await db.collection("challenges").get()).size, 0);
});

test("no se puede crear un challenge dentro de una experiencia inexistente", async () => {
  const db = testDb();
  await assert.rejects(
    createChallenge(db, admin, challengeInput("no-existe"), now),
    (error) => error instanceof HttpError && error.status === 404,
  );
});

test("el panel de administración ve borradores y el público no", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  await createChallenge(db, admin, challengeInput(experience.id), now);
  const catalog = await listAdminCatalog(db, admin);
  assert.equal(catalog.experiences.length, 1);
  assert.equal(catalog.challenges.length, 1);
  assert.equal(catalog.challenges[0].status, "draft");
  await assert.rejects(listAdminCatalog(db, joven), (error) => error instanceof HttpError && error.status === 403);
});

test("las experiencias concluidas siguen visibles para consultar su historia, pero no son inscribibles", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "closed" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "closed" }, now);

  const catalog = await listPublicCatalog(db, now);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].state.label, "Concluido");
  const detail = await getPublicChallenge(db, challenge.id, now);
  assert.equal(detail.state.label, "Concluido");
});
