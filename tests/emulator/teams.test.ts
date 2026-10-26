import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { enrollInChallenge, getDelivery, reviewEnrollment, saveDelivery } from "../../src/lib/server/participation.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { createTeam, getMyTeamState, joinTeamByCode, manageTeam } from "../../src/lib/server/teams.ts";
import { admin, clearFirestore, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const duringDeadline = new Date("2026-11-10T18:00:00.000Z");
const afterRegistration = new Date("2027-01-05T00:00:00.000Z");
const ana = { uid: "ana-1", email: "ana@correo.test", isAdmin: false };
const luis = { uid: "luis-1", email: "luis@correo.test", isAdmin: false };
const sofia = { uid: "sofia-1", email: "sofia@correo.test", isAdmin: false };
const marco = { uid: "marco-1", email: "marco@correo.test", isAdmin: false };

const experienceInput = {
  title: "Hackathon de equipos",
  kind: "hackathon",
  summary: "Challenges por equipo para validar la conformación y la entrega grupal.",
  registrationOpensAt: "2026-10-01T00:00:00-06:00",
  registrationClosesAt: "2026-12-31T23:59:00-06:00",
};

const challengeInput = (experienceId: string) => ({
  experienceId,
  title: "Conciliación por equipos",
  summary: "Conciliar extractos bancarios y libro contable en equipo.",
  problem: "Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, y las diferencias llegan tarde.",
  deliverables: ["Repositorio con instrucciones", "Demo de 4 minutos"],
  rubric: [{ label: "Exactitud", maxScore: 10 }],
  organizationName: "Distribuidora Atlas",
  allows: ["team"],
  teamMinSize: 2,
  teamMaxSize: 3,
  submissionClosesAt: "2026-11-14T23:59:00-06:00",
});

const delivery = {
  text: "Conciliación automática con reglas de tolerancia y revisión manual de diferencias.",
  links: ["https://github.com/equipo/conciliacion"],
  submit: false,
};

async function teamChallenge() {
  const db = testDb();
  const experience = await createExperience(db, admin, experienceInput, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  return { db, challengeId: challenge.id };
}

/** Inscribe por equipo y aprueba: deja a la persona lista para crear o unirse a un equipo. */
async function approvedTeamMember(db: ReturnType<typeof testDb>, challengeId: string, actor: typeof ana) {
  const enrollment = await enrollInChallenge(db, actor, challengeId, "team", now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
}

function expectHttp(status: number, code?: string) {
  return (error: unknown) => error instanceof HttpError && error.status === status && (code === undefined || error.code === code);
}

beforeEach(async () => {
  await clearFirestore();
});

test("crear equipo exige inscripción por equipo aprobada; una inscripción individual no basta", async () => {
  const { db, challengeId } = await teamChallenge();
  const individual = await enrollInChallenge(db, luis, challengeId, "team", now);
  assert.equal(individual.mode, "team");
  await assert.rejects(createTeam(db, ana, challengeId, "Rutas", now), expectHttp(403, "sin_inscripcion_equipo"));
});

test("crear equipo deja a la líder con código C3-XXXX y el equipo incompleto hasta el mínimo", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  const team = await createTeam(db, ana, challengeId, "Rutas en caliente", now);
  assert.match(team.code, /^C3-[23456789A-HJ-KMNP-Z]{4}$/);
  assert.equal(team.status, "incompleto");
  assert.equal(team.myRole, "lider");
  assert.equal(team.members.length, 1);
  const participation = await db.collection("participations").doc(`${challengeId}__team__${team.id}`).get();
  assert.equal(participation.data()?.status, "incomplete");
});

test("unirse con código habilita el equipo al llegar al mínimo y actualiza la participación", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  const team = await createTeam(db, ana, challengeId, "Rutas en caliente", now);

  const joined = await joinTeamByCode(db, luis, team.code.toLowerCase(), now);
  assert.equal(joined.status, "habilitado");
  assert.equal(joined.members.length, 2);
  assert.equal((await db.collection("participations").doc(`${challengeId}__team__${team.id}`).get()).data()?.status, "active");
});

test("una persona no puede estar en dos equipos de la misma experiencia", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  await createTeam(db, ana, challengeId, "Rutas en caliente", now);
  await assert.rejects(createTeam(db, ana, challengeId, "Otro equipo", now), expectHttp(409, "ya_en_equipo"));
  const other = await createTeam(db, luis, challengeId, "Equipo de Luis", now);
  await assert.rejects(joinTeamByCode(db, ana, other.code, now), expectHttp(409, "ya_en_equipo"));
});

test("códigos mal escritos, inexistentes o de equipos llenos se rechazan con motivo claro", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  await approvedTeamMember(db, challengeId, sofia);
  await approvedTeamMember(db, challengeId, marco);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);
  await assert.rejects(joinTeamByCode(db, luis, "7KQ4", now), (error) => error instanceof ValidationFailure);
  await assert.rejects(joinTeamByCode(db, luis, "C3-ZZZZ", now), expectHttp(404));
  await joinTeamByCode(db, luis, team.code, now);
  await joinTeamByCode(db, sofia, team.code, now);
  await assert.rejects(joinTeamByCode(db, marco, team.code, now), expectHttp(409, "equipo_completo"));
});

test("sin inscripción por equipo aprobada no se puede unirse", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);
  await enrollInChallenge(db, marco, challengeId, "team", now);
  await assert.rejects(joinTeamByCode(db, marco, team.code, now), expectHttp(403, "sin_inscripcion_equipo"));
});

test("la líder no sale del equipo; una integrante sale; la líder quita y transfiere liderazgo", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  await approvedTeamMember(db, challengeId, sofia);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);
  await joinTeamByCode(db, luis, team.code, now);
  await joinTeamByCode(db, sofia, team.code, now);

  await assert.rejects(manageTeam(db, ana, team.id, "salir", undefined, now), expectHttp(409, "lider_no_puede_salir"));
  await assert.rejects(manageTeam(db, luis, team.id, "quitar", sofia.uid, now), expectHttp(403, "solo_lider"));
  await manageTeam(db, ana, team.id, "quitar", sofia.uid, now);
  await manageTeam(db, ana, team.id, "transferir", luis.uid, now);
  await manageTeam(db, ana, team.id, "salir", undefined, now);

  const state = await getMyTeamState(db, luis, challengeId, now);
  assert.equal(state.team?.myRole, "lider");
  assert.equal(state.team?.members.length, 1);
  assert.equal((await getMyTeamState(db, ana, challengeId, now)).team, null);
});

test("disolver el equipo solo cuando queda la líder sola", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);
  await joinTeamByCode(db, luis, team.code, now);
  await assert.rejects(manageTeam(db, ana, team.id, "disolver", undefined, now), expectHttp(409, "equipo_con_integrantes"));
  await manageTeam(db, ana, team.id, "quitar", luis.uid, now);
  await manageTeam(db, ana, team.id, "disolver", undefined, now);
  assert.equal((await db.collection("teams").doc(team.id).get()).exists, false);
  assert.equal((await db.collection("teamCodes").doc(team.code).get()).exists, false);
});

test("cambiar el equipo queda cerrado cuando cierra la inscripción", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);
  await assert.rejects(joinTeamByCode(db, luis, team.code, afterRegistration), expectHttp(409, "inscripcion_cerrada"));
  await assert.rejects(manageTeam(db, ana, team.id, "transferir", luis.uid, afterRegistration), expectHttp(409, "inscripcion_cerrada"));
});

test("la entrega del equipo la envía solo la líder y la lee cada integrante", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);

  await assert.rejects(saveDelivery(db, ana, challengeId, delivery, duringDeadline), expectHttp(403, "equipo_incompleto"));
  await joinTeamByCode(db, luis, team.code, now);

  await assert.rejects(saveDelivery(db, luis, challengeId, delivery, duringDeadline), expectHttp(403, "solo_lider"));
  await saveDelivery(db, ana, challengeId, { ...delivery, submit: true }, duringDeadline);

  const asMember = await getDelivery(db, luis, challengeId, duringDeadline);
  assert.equal(asMember.state, "entregada");
  assert.equal(asMember.canEdit, false);
  assert.equal(asMember.team?.role, "integrante");
  assert.equal(asMember.submission?.text, delivery.text);
});

test("un equipo sin inscripción aprobada de otra persona no ve datos ajenos", async () => {
  const { db, challengeId } = await teamChallenge();
  await approvedTeamMember(db, challengeId, ana);
  await approvedTeamMember(db, challengeId, luis);
  const team = await createTeam(db, ana, challengeId, "Rutas", now);
  await joinTeamByCode(db, luis, team.code, now);
  const outsider = await getMyTeamState(db, marco, challengeId, now);
  assert.equal(outsider.team, null);
  await assert.rejects(manageTeam(db, marco, team.id, "salir", undefined, now), expectHttp(403, "no_integrante"));
});
