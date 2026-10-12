import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import {
  cancelMyEnrollment,
  enrollIndividual,
  getDelivery,
  listEnrollmentsForChallenge,
  listMyEnrollments,
  reviewEnrollment,
  saveDelivery,
} from "../../src/lib/server/participation.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { admin, clearFirestore, joven, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const duringDeadline = new Date("2026-11-10T18:00:00.000Z");
const afterDeadline = new Date("2026-11-20T00:00:00.000Z");
const otra = { uid: "joven-2", email: "otra@correo.test", isAdmin: false };

const experienceInput = {
  title: "Hackathon de prueba",
  kind: "hackathon",
  summary: "Retos de prueba para validar inscripciones y entregas.",
  registrationOpensAt: "2026-10-01T00:00:00-06:00",
  registrationClosesAt: "2026-12-31T23:59:00-06:00",
};

function challengeInput(experienceId: string, allows: string[] = ["individual", "team"]) {
  return {
    experienceId,
    title: "Ruteo de última milla",
    summary: "Armar rutas diarias respetando ventanas horarias.",
    problem: "Transportes Delta arma rutas a mano cada mañana y no respeta las ventanas horarias pactadas.",
    deliverables: ["Repositorio con instrucciones", "Demo de 4 minutos"],
    rubric: [{ label: "Calidad del resultado", maxScore: 10 }],
    organizationName: "Transportes Delta",
    allows,
    teamMinSize: allows.includes("team") ? 2 : null,
    teamMaxSize: allows.includes("team") ? 4 : null,
    submissionClosesAt: "2026-11-14T23:59:00-06:00",
  };
}

const validDelivery = {
  text: "Heurística de inserción con penalización por ventana incumplida y mejora local.",
  links: ["https://github.com/equipo/rutas"],
  submit: false,
};

async function publishedChallenge(allows?: string[]) {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id, allows), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  return { db, challengeId: challenge.id };
}

function expectHttp(status: number, code?: string) {
  return (error: unknown) => error instanceof HttpError && error.status === status && (code === undefined || error.code === code);
}

beforeEach(async () => {
  await clearFirestore();
});

test("una persona se inscribe una sola vez por experiencia y queda pendiente", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  assert.equal(enrollment.status, "pending");
  await assert.rejects(enrollIndividual(db, joven, challengeId, now), expectHttp(409, "ya_inscrito"));
  assert.equal((await db.collection("enrollments").get()).size, 1);
});

test("no se inscribe en retos solo por equipo, ni fuera de la ventana de inscripción", async () => {
  const { db, challengeId } = await publishedChallenge(["team"]);
  await assert.rejects(enrollIndividual(db, joven, challengeId, now), expectHttp(409, "solo_equipos"));
  const open = await publishedChallenge();
  await assert.rejects(
    enrollIndividual(open.db, joven, open.challengeId, new Date("2027-01-05T00:00:00Z")),
    expectHttp(409, "inscripcion_cerrada"),
  );
});

test("solo C3 revisa inscripciones; aprobar crea la participación habilitada", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await assert.rejects(reviewEnrollment(db, joven, enrollment.id, "approved", now), expectHttp(403));
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  const participation = await db.collection("participations").doc(`${challengeId}__${joven.uid}`).get();
  assert.equal(participation.exists, true);
  assert.equal(participation.data()?.status, "active");
  await assert.rejects(reviewEnrollment(db, admin, enrollment.id, "rejected", now), expectHttp(409, "ya_revisada"));
});

test("rechazar no crea participación y deja la inscripción rechazada", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await reviewEnrollment(db, admin, enrollment.id, "rejected", now);
  const rows = await listEnrollmentsForChallenge(db, admin, challengeId);
  assert.equal(rows[0].status, "rejected");
  assert.equal((await db.collection("participations").get()).size, 0);
});

test("la entrega exige inscripción aprobada", async () => {
  const { db, challengeId } = await publishedChallenge();
  await enrollIndividual(db, joven, challengeId, now);
  await assert.rejects(saveDelivery(db, joven, challengeId, validDelivery, now), expectHttp(403, "no_habilitado"));
});

test("un borrador se guarda y se lee de nuevo; enviar exige texto y al menos un enlace", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);

  const saved = await saveDelivery(db, joven, challengeId, validDelivery, duringDeadline);
  assert.equal(saved.state, "borrador");
  assert.equal(saved.submission?.status, "draft");

  await assert.rejects(
    saveDelivery(db, joven, challengeId, { text: "corto", links: [], submit: true }, duringDeadline),
    (error) => error instanceof ValidationFailure
      && error.issues.some((issue) => issue.field === "text")
      && error.issues.some((issue) => issue.field === "links"),
  );

  const reread = await getDelivery(db, joven, challengeId, duringDeadline);
  assert.equal(reread.submission?.text, validDelivery.text);
});

test("enviar deja la entrega estable; editar sigue permitido hasta el cierre y después no", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);

  const submitted = await saveDelivery(db, joven, challengeId, { ...validDelivery, submit: true }, duringDeadline);
  assert.equal(submitted.state, "entregada");

  const edited = await saveDelivery(
    db,
    joven,
    challengeId,
    { ...validDelivery, text: "Versión mejorada con pruebas de regresión.", submit: false },
    duringDeadline,
  );
  assert.equal(edited.submission?.status, "submitted", "guardar después de enviar no la devuelve a borrador");

  await assert.rejects(
    saveDelivery(db, joven, challengeId, { ...validDelivery, text: "Intento tardío de cambiar la entrega." }, afterDeadline),
    expectHttp(409, "plazo_cerrado"),
  );
  const stable = await getDelivery(db, joven, challengeId, afterDeadline);
  assert.equal(stable.state, "entregada");
  assert.equal(stable.canEdit, false);
});

test("sin entrega o con borrador, el cierre muestra Fuera de plazo", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  assert.equal((await getDelivery(db, joven, challengeId, duringDeadline)).state, "sin_entrega");
  await saveDelivery(db, joven, challengeId, validDelivery, duringDeadline);
  assert.equal((await getDelivery(db, joven, challengeId, afterDeadline)).state, "fuera_de_plazo");
});

test("cada persona ve solo sus inscripciones y su propia entrega", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  await saveDelivery(db, joven, challengeId, { ...validDelivery, submit: true }, duringDeadline);

  assert.equal((await listMyEnrollments(db, otra, now)).length, 0);
  const otherDelivery = await getDelivery(db, otra, challengeId, duringDeadline);
  assert.equal(otherDelivery.enrollmentStatus, null);
  assert.equal(otherDelivery.submission, null);
  assert.equal((await listMyEnrollments(db, joven, now))[0].delivery?.state, "entregada");
});

test("cancelar es posible antes del cierre y no después de enviar", async () => {
  const { db, challengeId } = await publishedChallenge();
  const enrollment = await enrollIndividual(db, joven, challengeId, now);
  await assert.rejects(cancelMyEnrollment(db, otra, enrollment.id, now), expectHttp(404));
  await cancelMyEnrollment(db, joven, enrollment.id, now);
  assert.equal((await listMyEnrollments(db, joven, now))[0].status, "cancelled");

  const second = await publishedChallenge(["individual"]);
  const again = await enrollIndividual(second.db, { ...joven, uid: "joven-3" }, second.challengeId, now);
  await reviewEnrollment(second.db, admin, again.id, "approved", now);
  await saveDelivery(second.db, { ...joven, uid: "joven-3" }, second.challengeId, { ...validDelivery, submit: true }, duringDeadline);
  await assert.rejects(
    cancelMyEnrollment(second.db, { ...joven, uid: "joven-3" }, again.id, duringDeadline),
    expectHttp(409, "entrega_enviada"),
  );
});
