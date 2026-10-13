import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { enrollInChallenge, getDelivery, reviewEnrollment, saveDelivery } from "../../src/lib/server/participation.ts";
import {
  assignJudge,
  companyResults,
  evaluationWorkspace,
  listJudges,
  myAssignments,
  publicWinners,
  publishResults,
  resultForSubmission,
  resultsBoard,
  revokeJudge,
  saveEvaluation,
  setRecognition,
} from "../../src/lib/server/evaluation.ts";
import { admin, clearAuth, clearFirestore, createAuthUser, joven, testAuth, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const duringDeadline = new Date("2026-11-10T18:00:00.000Z");
const afterDeadline = new Date("2026-11-20T00:00:00.000Z");
const otra = { uid: "joven-2", email: "otra@correo.test", isAdmin: false };
const juez1 = { uid: "juez-1", email: "juez1@atlas.test", isAdmin: false };
const juez2 = { uid: "juez-2", email: "juez2@c3.test", isAdmin: false };
const noJuez = { uid: "sin-juez", email: "sin@correo.test", isAdmin: false };
const delivery = {
  text: "Conciliación automática con reglas de tolerancia y revisión manual de diferencias.",
  links: ["https://github.com/equipo/conciliacion"],
  submit: true,
};

const experienceInput = {
  title: "Experiencia de evaluación",
  kind: "challenge_empresarial",
  summary: "Retos para validar la evaluación y la publicación.",
  registrationOpensAt: "2026-10-01T00:00:00-06:00",
  registrationClosesAt: "2026-12-31T23:59:00-06:00",
};

const challengeInput = (experienceId: string) => ({
  experienceId,
  title: "Conciliación para evaluar",
  summary: "Cruzar extractos bancarios con el libro contable.",
  problem: "Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, y las diferencias llegan tarde.",
  deliverables: ["Repositorio con instrucciones"],
  rubric: [
    { label: "Calidad del resultado", maxScore: 10 },
    { label: "Claridad del enfoque", maxScore: 10 },
  ],
  organizationName: "Distribuidora Atlas",
  allows: ["individual"],
  teamMinSize: null,
  teamMaxSize: null,
  submissionClosesAt: "2026-11-14T23:59:00-06:00",
});

function expectHttp(status: number, code?: string) {
  return (error: unknown) => error instanceof HttpError && error.status === status && (code === undefined || error.code === code);
}

/** Dos soluciones enviadas en un reto publicado, listo para evaluar. */
async function scenario() {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  for (const person of [joven, otra]) {
    const enrollment = await enrollInChallenge(db, person, challenge.id, "individual", now);
    await reviewEnrollment(db, admin, enrollment.id, "approved", now);
    await saveDelivery(db, person, challenge.id, delivery, duringDeadline);
  }
  return { db, challengeId: challenge.id };
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("solo C3 asigna jurados por correo; una cuenta inexistente o un tipo inválido se rechaza", async () => {
  const { db, challengeId } = await scenario();
  const auth = testAuth();
  await createAuthUser(juez1.email, juez1.uid);
  await assert.rejects(assignJudge(db, auth, joven, challengeId, juez1.email, "externo", now), expectHttp(403));
  await assert.rejects(assignJudge(db, auth, admin, challengeId, "nadie@c3.test", "externo", now), expectHttp(404));
  await assert.rejects(assignJudge(db, auth, admin, challengeId, juez1.email, "auto", now), (error) => error instanceof ValidationFailure);
  await assignJudge(db, auth, admin, challengeId, juez1.email, "empresa", now);
  const judges = await listJudges(db, admin, challengeId);
  assert.equal(judges.length, 1);
  assert.equal(judges[0].kind, "empresa");
});

test("una persona sin asignación no ve el espacio de evaluación; antes del cierre no se puede evaluar", async () => {
  const { db, challengeId } = await scenario();
  const auth = testAuth();
  await createAuthUser(juez1.email, juez1.uid);
  await assignJudge(db, auth, admin, challengeId, juez1.email, "externo", now);
  await assert.rejects(evaluationWorkspace(db, noJuez, challengeId, afterDeadline), expectHttp(403, "sin_asignacion"));
  const beforeClose = await evaluationWorkspace(db, juez1, challengeId, duringDeadline);
  assert.equal(beforeClose.canEvaluate, false);
  const [solution] = beforeClose.solutions;
  await assert.rejects(saveEvaluation(db, juez1, challengeId, solution.id, { scores: { c1: 5, c2: 5 } }, duringDeadline), expectHttp(409, "entregas_abiertas"));
});

test("después del cierre el jurado ve soluciones anónimas, guarda borradores y finaliza una sola vez", async () => {
  const { db, challengeId } = await scenario();
  const auth = testAuth();
  await createAuthUser(juez1.email, juez1.uid);
  await assignJudge(db, auth, admin, challengeId, juez1.email, "externo", now);
  const workspace = await evaluationWorkspace(db, juez1, challengeId, afterDeadline);
  assert.equal(workspace.canEvaluate, true);
  assert.deepEqual(workspace.solutions.map((item) => item.label), ["Solución 1", "Solución 2"]);
  assert.equal(JSON.stringify(workspace).includes(joven.uid), false, "la evaluación no muestra quién entregó");
  assert.deepEqual(workspace.solutions.map((item) => item.id), ["s1", "s2"]);

  const [first, second] = workspace.solutions;
  await assert.rejects(saveEvaluation(db, juez1, challengeId, first.id, { scores: { c1: 11, c2: 5 } }, afterDeadline), (error) => error instanceof ValidationFailure);
  await saveEvaluation(db, juez1, challengeId, first.id, { scores: { c1: 8, c2: 7 } }, afterDeadline);
  const draft = (await evaluationWorkspace(db, juez1, challengeId, afterDeadline)).solutions[0].mine;
  assert.equal(draft?.status, "draft");
  await saveEvaluation(db, juez1, challengeId, first.id, { scores: { c1: 8, c2: 7 }, finalize: true }, afterDeadline);
  await assert.rejects(saveEvaluation(db, juez1, challengeId, first.id, { scores: { c1: 1, c2: 1 } }, afterDeadline), expectHttp(409, "ya_finalizada"));
  await saveEvaluation(db, juez1, challengeId, second.id, { scores: { c1: 6, c2: 6 }, finalize: true }, afterDeadline);
});

test("la publicación queda bloqueada hasta que cada solución tenga dos evaluaciones finalizadas", async () => {
  const { db, challengeId } = await scenario();
  const auth = testAuth();
  await createAuthUser(juez1.email, juez1.uid);
  await createAuthUser(juez2.email, juez2.uid);
  await assignJudge(db, auth, admin, challengeId, juez1.email, "empresa", now);
  await assignJudge(db, auth, admin, challengeId, juez2.email, "externo", now);
  const workspace = await evaluationWorkspace(db, juez1, challengeId, afterDeadline);
  const [first, second] = workspace.solutions;

  for (const judge of [juez1, juez2]) {
    await saveEvaluation(db, judge, challengeId, first.id, { scores: { c1: 8, c2: judge.uid === juez1.uid ? 7 : 9 }, finalize: true }, afterDeadline);
  }
  let board = await resultsBoard(db, admin, challengeId);
  assert.equal(board.canPublish, false);
  assert.match(board.blockedReason ?? "", /Solo 1 de 2/, "la primera solución ya está lista con dos jurados");
  await assert.rejects(publishResults(db, admin, challengeId, {}, afterDeadline), expectHttp(409, "publicacion_bloqueada"));

  await saveEvaluation(db, juez1, challengeId, second.id, { scores: { c1: 6, c2: 6 }, finalize: true }, afterDeadline);
  board = await resultsBoard(db, admin, challengeId);
  assert.match(board.blockedReason ?? "", /Solo 1 de 2/);
  await saveEvaluation(db, juez2, challengeId, second.id, { scores: { c1: 7, c2: 7 }, finalize: true }, afterDeadline);
  board = await resultsBoard(db, admin, challengeId);
  assert.equal(board.canPublish, true);
  assert.equal(board.rows[0].average, 16, "promedio de 15 y 17 con dos jurados");
});

test("C3 asigna ganador y publica; el participante ve su resultado solo después de publicar", async () => {
  const { db, challengeId } = await scenario();
  const auth = testAuth();
  await createAuthUser(juez1.email, juez1.uid);
  await createAuthUser(juez2.email, juez2.uid);
  await assignJudge(db, auth, admin, challengeId, juez1.email, "externo", now);
  await assignJudge(db, auth, admin, challengeId, juez2.email, "externo", now);
  const [first, second] = (await evaluationWorkspace(db, juez1, challengeId, afterDeadline)).solutions;
  for (const judge of [juez1, juez2]) {
    await saveEvaluation(db, judge, challengeId, first.id, { scores: { c1: 9, c2: 9 }, finalize: true }, afterDeadline);
    await saveEvaluation(db, judge, challengeId, second.id, { scores: { c1: 4, c2: 5 }, finalize: true }, afterDeadline);
  }

  const participantSolution = (await db.collection("submissions").where("userId", "==", joven.uid).get()).docs[0].id;
  const otraSolution = (await db.collection("submissions").where("userId", "==", otra.uid).get()).docs[0].id;
  assert.equal(await resultForSubmission(db, challengeId, participantSolution), null, "sin publicar no hay resultado");
  // Los reconocimientos y resultados usan el id real de la solución, que solo C3 ve en el tablero.
  const board = await resultsBoard(db, admin, challengeId);
  const winnerSolution = board.rows[0].submissionId;
  await setRecognition(db, admin, challengeId, winnerSolution, "ganador");
  await assert.rejects(setRecognition(db, joven, challengeId, winnerSolution, "finalista"), expectHttp(403));
  await publishResults(db, admin, challengeId, { showWinners: true, showScores: false }, afterDeadline);

  // La solución ganadora es la primera del espacio de evaluación; la otra no recibe reconocimiento.
  const loserSolution = winnerSolution === participantSolution ? otraSolution : participantSolution;
  assert.equal((await resultForSubmission(db, challengeId, winnerSolution))?.recognition, "Ganador");
  const hidden = await resultForSubmission(db, challengeId, loserSolution);
  assert.ok(hidden);
  assert.equal(hidden.recognition, null);
  assert.equal(hidden.average, null, "sin autorización de promedios no se muestran");
  assert.equal(hidden.place, null);
  await assert.rejects(setRecognition(db, admin, challengeId, board.rows[1].submissionId, "mencion"), expectHttp(409, "ya_publicado"));
  await assert.rejects(publishResults(db, admin, challengeId, {}, afterDeadline), expectHttp(409, "ya_publicado"));

  const winners = await publicWinners(db, challengeId);
  assert.equal(winners.length, 1);
  assert.equal(winners[0].recognition, "Ganador");
  assert.deepEqual(await companyResults(db, challengeId).then((item) => item?.rows.map((row) => row.average)), [null, null]);
});

test("revocar a un jurado le quita el acceso y conserva sus evaluaciones finalizadas", async () => {
  const { db, challengeId } = await scenario();
  const auth = testAuth();
  await createAuthUser(juez1.email, juez1.uid);
  await assignJudge(db, auth, admin, challengeId, juez1.email, "externo", now);
  const [first] = (await evaluationWorkspace(db, juez1, challengeId, afterDeadline)).solutions;
  await saveEvaluation(db, juez1, challengeId, first.id, { scores: { c1: 3, c2: 3 }, finalize: true }, afterDeadline);
  const [assignment] = await listJudges(db, admin, challengeId);
  await revokeJudge(db, admin, assignment.id, afterDeadline);
  await assert.rejects(evaluationWorkspace(db, juez1, challengeId, afterDeadline), expectHttp(403));
  assert.deepEqual(await myAssignments(db, juez1, afterDeadline), []);
  const kept = await db.collection("evaluations").where("judgeUserId", "==", juez1.uid).get();
  assert.equal(kept.size, 1);
});

test("la entrega del participante sigue visible y sin cambios tras la publicación", async () => {
  const { db, challengeId } = await scenario();
  const view = await getDelivery(db, joven, challengeId, afterDeadline);
  assert.equal(view.state, "entregada");
  assert.equal(view.canEdit, false);
});
