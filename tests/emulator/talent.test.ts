import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { createOrganization, linkRepresentative } from "../../src/lib/server/companies.ts";
import { enrollInChallenge, reviewEnrollment, saveDelivery } from "../../src/lib/server/participation.ts";
import {
  addCheckpoint,
  addToShortlist,
  advanceContactRequest,
  answerContactRequest,
  getMyDefense,
  getMyFeedback,
  getTalentBoard,
  listMyCheckpoints,
  saveFeedback,
  listMyContactRequests,
  removeFromShortlist,
  requestContact,
  saveDefense,
} from "../../src/lib/server/talent.ts";
import { contactRequestDocId, talentRowTokenOf } from "../../src/lib/server/ids.ts";
import { createTeam, joinTeamByCode } from "../../src/lib/server/teams.ts";
import { admin, clearAuth, clearFirestore, createAuthUser, joven, testAuth, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const duringDeadline = new Date("2026-11-10T18:00:00.000Z");
const otra = { uid: "joven-2", email: "otra@correo.test", isAdmin: false };
const representante = { uid: "rep-atlas", email: "rep@atlas.test", isAdmin: false };
const representanteOtra = { uid: "rep-meridiano", email: "rep@meridiano.test", isAdmin: false };

const experienceInput = {
  title: "Experiencia de empresas",
  kind: "challenge_empresarial",
  summary: "Challenges que plantean empresas reales para equipos jóvenes.",
  registrationOpensAt: "2026-10-01T00:00:00-06:00",
  registrationClosesAt: "2026-12-31T23:59:00-06:00",
};

function challengeFor(experienceId: string, organizationId: string) {
  return {
    experienceId,
    organizationId,
    title: "Optimización de rutas para una operación de entregas",
    summary: "Prototipar una herramienta que proponga rutas de reparto.",
    problem: "Una empresa de logística ficticia distribuye pedidos y quiere comparar rutas para reducir kilómetros innecesarios.",
    deliverables: ["Repositorio y README"],
    rubric: [{ label: "Comprensión del problema", maxScore: 10 }],
    organizationName: "Distribuidora Atlas",
    commercialPackage: "completo",
    allows: ["individual"],
    teamMinSize: null,
    teamMaxSize: null,
    submissionClosesAt: "2026-11-14T23:59:00-06:00",
  };
}

const defenseInput = {
  videoUrl: "https://video.example.test/defensa-atlas",
  summary: "Construí una heurística de inserción con ventanas horarias y la comparé contra una búsqueda exhaustiva.",
  decisions: "Elegí inserción secuencial porque el tiempo de respuesta importa más que la optimalidad exacta.",
  testing: "",
  tradeoffs: "Pierde calidad en instancias grandes; lo declaro como limitación.",
  aiUse: "Usé un asistente para generar casos de prueba y revisé cada uno a mano.",
};

function expectHttp(status: number, code?: string) {
  return (error: unknown) => error instanceof HttpError && error.status === status && (code === undefined || error.code === code);
}

/** Organización con representante vinculada, challenge publicado y una entrega individual enviada por la joven. */
async function scenario() {
  const db = testDb();
  await createAuthUser(representante.email, representante.uid);
  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  await linkRepresentative(db, testAuth(), admin, org.id, representante.email, now);

  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeFor(experience.id, org.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);

  const enrollment = await enrollInChallenge(db, joven, challenge.id, "individual", now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  await saveDelivery(db, joven, challenge.id, {
    text: "Heurística de inserción con ventanas horarias y comparación contra búsqueda exhaustiva.",
    links: ["https://github.com/equipo/rutas-atlas"],
    submit: true,
  }, duringDeadline);
  // Las escrituras reciben el token de la fila del tablero, nunca el id interno de la entrega.
  return { db, org, experience, challenge, submissionId: talentRowTokenOf(`${challenge.id}__${joven.uid}`) };
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("el tablero de talento lo ve solo la empresa del challenge; otra empresa y la joven reciben 403", async () => {
  const { db, challenge } = await scenario();
  const board = await getTalentBoard(db, representante, challenge.id);
  assert.equal(board.rows.length, 1, "solo entregas enviadas");
  assert.equal(board.rows[0].mode, "individual");
  assert.equal(board.rows[0].canRequestContact, false, "sin lista corta no se puede pedir contacto");

  await createAuthUser(representanteOtra.email, representanteOtra.uid);
  const otraOrg = await createOrganization(db, admin, "Meridiano Seguros", now);
  await linkRepresentative(db, testAuth(), admin, otraOrg.id, representanteOtra.email, now);
  await assert.rejects(getTalentBoard(db, representanteOtra, challenge.id), expectHttp(403));
  await assert.rejects(getTalentBoard(db, joven, challenge.id), expectHttp(403));
});

test("un challenge en borrador no existe para la empresa", async () => {
  const { db, org, experience } = await scenario();
  const draft = await createChallenge(db, admin, challengeFor(experience.id, org.id), now);
  await assert.rejects(getTalentBoard(db, representante, draft.id), expectHttp(404));
});

test("la lista corta exige un motivo cualitativo y una entrega enviada del challenge", async () => {
  const { db, challenge, submissionId } = await scenario();
  await assert.rejects(
    addToShortlist(db, representante, challenge.id, { submissionId, reason: "corto" }, duringDeadline),
    ValidationFailure,
  );
  await assert.rejects(
    addToShortlist(db, representante, challenge.id, { submissionId: "no-existe", reason: "Explica bien los trade-offs." }, duringDeadline),
    expectHttp(404),
  );

  await addToShortlist(db, representante, challenge.id, {
    submissionId,
    reason: "Explica los trade-offs con datos y reconoce sus límites.",
  }, duringDeadline);
  const board = await getTalentBoard(db, representante, challenge.id);
  assert.equal(board.rows[0].shortlist?.reason, "Explica los trade-offs con datos y reconoce sus límites.");

  await removeFromShortlist(db, representante, challenge.id, submissionId, duringDeadline);
  assert.equal((await getTalentBoard(db, representante, challenge.id)).rows[0].shortlist, null);
});

test("solicitar contacto exige lista corta, no duplica solicitudes activas y no se quita con una activa", async () => {
  const { db, challenge, submissionId } = await scenario();
  await assert.rejects(
    requestContact(db, representante, challenge.id, { submissionId }, duringDeadline),
    expectHttp(409, "contacto_no_disponible"),
  );

  await addToShortlist(db, representante, challenge.id, {
    submissionId,
    reason: "Explica los trade-offs con datos y reconoce sus límites.",
  }, duringDeadline);
  const contact = await requestContact(db, representante, challenge.id, {
    submissionId,
    message: "Nos gustaría conversar sobre la prueba de carga.",
  }, duringDeadline);
  assert.equal(contact.status, "esperando_consentimiento");
  assert.equal(contact.state.label, "Esperando consentimiento");

  await assert.rejects(
    requestContact(db, representante, challenge.id, { submissionId }, duringDeadline),
    expectHttp(409, "contacto_no_disponible"),
  );
  await assert.rejects(
    removeFromShortlist(db, representante, challenge.id, submissionId, duringDeadline),
    expectHttp(409, "solicitud_activa"),
  );
});

test("la persona decide: solo la destinataria responde, la empresa no avanza antes de la aceptación", async () => {
  const { db, challenge, submissionId } = await scenario();
  await addToShortlist(db, representante, challenge.id, {
    submissionId,
    reason: "Explica los trade-offs con datos y reconoce sus límites.",
  }, duringDeadline);
  const contact = await requestContact(db, representante, challenge.id, { submissionId }, duringDeadline);

  const mine = await listMyContactRequests(db, joven);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].organizationName, "Distribuidora Atlas");
  assert.deepEqual(mine[0].actions, ["aceptado", "declinado"]);
  assert.equal(mine[0].state.label, "Te pidieron contacto");
  assert.equal((await listMyContactRequests(db, otra)).length, 0, "otra persona no ve la solicitud");

  await assert.rejects(answerContactRequest(db, otra, contact.id, { to: "aceptado" }, duringDeadline), expectHttp(404));
  await assert.rejects(advanceContactRequest(db, representante, contact.id, { to: "contactado" }, duringDeadline));

  const accepted = await answerContactRequest(db, joven, contact.id, { to: "aceptado" }, duringDeadline);
  assert.equal(accepted.status, "aceptado");
  const contacted = await advanceContactRequest(db, representante, contact.id, { to: "contactado" }, duringDeadline);
  assert.equal(contacted.state.label, "Contactado");
  await advanceContactRequest(db, representante, contact.id, { to: "seguimiento" }, duringDeadline);

  const revoked = await answerContactRequest(db, joven, contact.id, { to: "revocado" }, duringDeadline);
  assert.equal(revoked.status, "revocado");
  await assert.rejects(advanceContactRequest(db, representante, contact.id, { to: "seguimiento" }, duringDeadline));
});

test("la defensa exige una entrega enviada, enlace https y la registra la autora", async () => {
  const { db, challenge } = await scenario();
  assert.equal(await getMyDefense(db, otra, challenge.id), null, "sin inscripción no hay defensa propia");

  await assert.rejects(
    saveDefense(db, joven, challenge.id, { ...defenseInput, videoUrl: "http://video.example.test/x" }, duringDeadline),
    ValidationFailure,
  );

  const saved = await saveDefense(db, joven, challenge.id, defenseInput, duringDeadline);
  assert.equal(saved.summary, defenseInput.summary);
  assert.equal(saved.testing, null, "el campo vacío queda como ausente");
  assert.equal((await getMyDefense(db, joven, challenge.id))?.videoUrl, defenseInput.videoUrl);

  const board = await getTalentBoard(db, representante, challenge.id);
  assert.equal(board.rows[0].defense?.decisions, defenseInput.decisions);
});

test("sin inscripción aprobada no se registra defensa y una entrega sin enviar tampoco", async () => {
  const { db, challenge } = await scenario();
  await assert.rejects(saveDefense(db, otra, challenge.id, defenseInput, duringDeadline), expectHttp(403));

  const enrollment = await enrollInChallenge(db, otra, challenge.id, "individual", now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  await assert.rejects(saveDefense(db, otra, challenge.id, defenseInput, duringDeadline), expectHttp(409, "entrega_no_enviada"));
});

test("una solicitud declinada es final: la empresa no vuelve a pedir contacto ni reemplaza la respuesta", async () => {
  const { db, challenge, submissionId } = await scenario();
  await addToShortlist(db, representante, challenge.id, {
    submissionId,
    reason: "Explica los trade-offs con datos y reconoce sus límites.",
  }, duringDeadline);
  const contact = await requestContact(db, representante, challenge.id, { submissionId }, duringDeadline);
  await answerContactRequest(db, joven, contact.id, { to: "declinado" }, duringDeadline);

  await assert.rejects(
    requestContact(db, representante, challenge.id, { submissionId }, duringDeadline),
    expectHttp(409, "contacto_cerrado"),
  );
  const row = (await getTalentBoard(db, representante, challenge.id)).rows[0];
  assert.equal(row.contact?.status, "declinado", "la respuesta de la persona se conserva");
  assert.equal(row.canRequestContact, false, "el tablero no ofrece volver a pedir contacto");
});

test("la bitácora la escribe solo la persona inscrita; la retroalimentación solo llega publicada", async () => {
  const { db, challenge, submissionId } = await scenario();
  const checkpoint = await addCheckpoint(db, joven, challenge.id, {
    text: "Probé la heurística con 40 instancias y comparé kilómetros contra la búsqueda exacta.",
    link: "https://example.test/rama-heuristica",
  }, duringDeadline);
  assert.equal(checkpoint.link, "https://example.test/rama-heuristica");
  assert.equal((await listMyCheckpoints(db, joven, challenge.id)).length, 1);
  await assert.rejects(addCheckpoint(db, otra, challenge.id, { text: "Intento de escribir sin inscripción." }, duringDeadline), expectHttp(403));
  await assert.rejects(addCheckpoint(db, joven, challenge.id, { text: "corto" }, duringDeadline), ValidationFailure);
  await assert.rejects(addCheckpoint(db, joven, challenge.id, { text: "Avance con enlace inseguro.", link: "http://example.test" }, duringDeadline), ValidationFailure);
  assert.equal((await listMyCheckpoints(db, otra, challenge.id)).length, 0, "otra persona no ve la bitácora ajena");

  const feedbackText = "Buena comparación con la búsqueda exacta. Falta medir el costo de cambiar de ruta.";
  await assert.rejects(saveFeedback(db, joven, challenge.id, { submissionId, text: feedbackText, publish: true }, duringDeadline), expectHttp(403));
  await saveFeedback(db, representante, challenge.id, { submissionId, text: feedbackText, publish: false }, duringDeadline);
  assert.equal(await getMyFeedback(db, joven, challenge.id), null, "un borrador no llega a la persona");
  const draftRow = (await getTalentBoard(db, representante, challenge.id)).rows[0];
  assert.equal(draftRow.feedback?.text, feedbackText, "la empresa ve su borrador");
  assert.equal(draftRow.checkpoints.length, 1);

  await saveFeedback(db, representante, challenge.id, { submissionId, text: feedbackText, publish: true }, duringDeadline);
  assert.equal((await getMyFeedback(db, joven, challenge.id))?.text, feedbackText, "publicada, la persona la ve");
  assert.equal(await getMyFeedback(db, otra, challenge.id), null, "otra persona no ve la retroalimentación");
});

test("la inscripción a un challenge no habilita entregar en otro challenge de la misma experiencia", async () => {
  const { db, org, experience, challenge } = await scenario();
  const otro = await createChallenge(db, admin, { ...challengeFor(experience.id, org.id), title: "Segundo challenge de la misma experiencia" }, now);
  await setChallengeStatus(db, admin, otro.id, { status: "published" }, now);

  await assert.rejects(
    saveDelivery(db, joven, otro.id, {
      text: "Heurística de inserción con ventanas horarias y comparación contra búsqueda exhaustiva.",
      links: ["https://github.com/equipo/rutas-atlas"],
      submit: true,
    }, duringDeadline),
    expectHttp(403),
  );
  assert.equal((await db.collection("submissions").doc(`${otro.id}__${joven.uid}`).get()).exists, false, "la entrega ajena no se guarda");
  assert.equal((await getTalentBoard(db, representante, otro.id)).rows.length, 0, "el segundo challenge no recibe la entrega");
  assert.equal((await getTalentBoard(db, representante, challenge.id)).rows.length, 1, "el primero conserva solo su entrega");
});

test("el tablero y las solicitudes no muestran el uid de la persona", async () => {
  const { db, challenge, submissionId } = await scenario();
  await addToShortlist(db, representante, challenge.id, {
    submissionId,
    reason: "Explica los trade-offs con datos y reconoce sus límites.",
  }, duringDeadline);
  const contact = await requestContact(db, representante, challenge.id, { submissionId }, duringDeadline);
  const row = (await getTalentBoard(db, representante, challenge.id)).rows[0];
  assert.equal("userId" in row, false, "la fila del tablero no expone el identificador de la persona");
  assert.equal(contact.id.includes(joven.uid), false, "el id de la solicitud no contiene el uid");
  assert.equal((await listMyContactRequests(db, joven)).some((item) => item.id === contact.id), true, "la persona sí localiza su solicitud");
});

test("una solicitud de otra empresa responde como inexistente al avanzarla", async () => {
  const { db, challenge, submissionId } = await scenario();
  await addToShortlist(db, representante, challenge.id, {
    submissionId,
    reason: "Explica los trade-offs con datos y reconoce sus límites.",
  }, duringDeadline);
  const contact = await requestContact(db, representante, challenge.id, { submissionId }, duringDeadline);
  await answerContactRequest(db, joven, contact.id, { to: "aceptado" }, duringDeadline);

  await createAuthUser(representanteOtra.email, representanteOtra.uid);
  const otraOrg = await createOrganization(db, admin, "Meridiano Seguros", now);
  await linkRepresentative(db, testAuth(), admin, otraOrg.id, representanteOtra.email, now);
  await assert.rejects(advanceContactRequest(db, representanteOtra, contact.id, { to: "contactado" }, duringDeadline), expectHttp(404));
  await assert.rejects(advanceContactRequest(db, representanteOtra, `${challenge.id}__inventado`, { to: "contactado" }, duringDeadline), expectHttp(404));
  const advanced = await advanceContactRequest(db, representante, contact.id, { to: "contactado" }, duringDeadline);
  assert.equal(advanced.status, "contactado", "la empresa dueña sí puede registrar el contacto");
});

test("con el challenge concluido la persona sigue viendo su retroalimentación publicada, pero no se registran cambios", async () => {
  const { db, challenge, submissionId } = await scenario();
  await saveFeedback(db, representante, challenge.id, { submissionId, text: "Retroalimentación publicada antes del cierre.", publish: true }, duringDeadline);
  await db.collection("challenges").doc(challenge.id).update({ status: "closed" });

  assert.equal((await getMyFeedback(db, joven, challenge.id))?.text, "Retroalimentación publicada antes del cierre.");
  assert.equal((await listMyCheckpoints(db, joven, challenge.id)).length, 0);
  await assert.rejects(addCheckpoint(db, joven, challenge.id, { text: "Avance que llega después del cierre." }, duringDeadline), expectHttp(409, "reto_concluido"));
  await assert.rejects(saveDefense(db, joven, challenge.id, defenseInput, duringDeadline), expectHttp(409, "reto_concluido"));
  await assert.rejects(saveFeedback(db, representante, challenge.id, { submissionId, text: "Un cambio después del cierre.", publish: true }, duringDeadline), expectHttp(409, "reto_concluido"));
});

test("el tablero entrega un token por fila: ni el uid ni el id interno aparecen, y el id interno no sirve para escribir", async () => {
  const { db, challenge } = await scenario();
  const board = await getTalentBoard(db, representante, challenge.id);
  const serialized = JSON.stringify(board);
  assert.equal(serialized.includes(joven.uid), false, "ningún campo del tablero lleva el uid");
  assert.equal(serialized.includes(`${challenge.id}__${joven.uid}`), false, "tampoco aparece el id interno de la entrega");
  await assert.rejects(
    addToShortlist(db, representante, challenge.id, { submissionId: `${challenge.id}__${joven.uid}`, reason: "Explica bien los trade-offs." }, duringDeadline),
    expectHttp(404),
  );
});

test("la defensa se congela al cerrar el plazo de entregas, aunque el challenge siga publicado", async () => {
  const { db, challenge } = await scenario();
  await assert.rejects(
    saveDefense(db, joven, challenge.id, defenseInput, new Date("2026-11-20T00:00:00.000Z")),
    expectHttp(409, "plazo_cerrado"),
  );
});

test("el contacto con un equipo se pide a su líder y sigue el mismo consentimiento", async () => {
  const db = testDb();
  await createAuthUser(representante.email, representante.uid);
  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  await linkRepresentative(db, testAuth(), admin, org.id, representante.email, now);
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, { ...challengeFor(experience.id, org.id), allows: ["team"], teamMinSize: 2, teamMaxSize: 4 }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);

  const leaderEnrollment = await enrollInChallenge(db, joven, challenge.id, "team", now);
  await reviewEnrollment(db, admin, leaderEnrollment.id, "approved", now);
  const team = await createTeam(db, joven, challenge.id, "Equipo Rutas", now);
  const memberEnrollment = await enrollInChallenge(db, otra, challenge.id, "team", now);
  await reviewEnrollment(db, admin, memberEnrollment.id, "approved", now);
  await joinTeamByCode(db, otra, team.code, now);
  await saveDelivery(db, joven, challenge.id, {
    text: "Heurística de inserción con ventanas horarias y comparación contra búsqueda exhaustiva.",
    links: ["https://github.com/equipo/rutas-atlas"],
    submit: true,
  }, duringDeadline);

  const [row] = (await getTalentBoard(db, representante, challenge.id)).rows;
  assert.equal(row.mode, "team");
  await addToShortlist(db, representante, challenge.id, { submissionId: row.submissionId, reason: "Trabajo sólido en equipo." }, duringDeadline);
  const contact = await requestContact(db, representante, challenge.id, { submissionId: row.submissionId }, duringDeadline);
  assert.equal(contact.id, contactRequestDocId(challenge.id, joven.uid), "la solicitud va a la líder del equipo");
  assert.equal(contact.status, "esperando_consentimiento");
});
