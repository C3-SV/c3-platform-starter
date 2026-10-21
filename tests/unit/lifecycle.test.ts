import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRegistrationAction,
  changedFields,
  checkChallengeStatusTransition,
  checkStatusTransition,
  countEnrollments,
  editIssues,
  lifecycleOf,
  lockedFields,
  nextActionsOf,
  publishIssues,
  registrationPhase,
  spotsLeft,
  type ExperienceStats,
} from "../../src/lib/domain/lifecycle.ts";
import type { Experience } from "../../src/lib/domain/types.ts";
import { parseExperienceInput, type ExperienceInput } from "../../src/lib/domain/validation.ts";

const now = new Date("2026-10-21T18:00:00.000Z");

const base: Experience = {
  id: "exp-1",
  title: "Taller de programación competitiva",
  kind: "taller",
  summary: "Taller introductorio de programación competitiva para principiantes.",
  status: "draft",
  primaryLine: "compite",
  secondaryLines: [],
  startsAt: "2026-11-10T16:00:00.000Z",
  endsAt: "2026-11-10T20:00:00.000Z",
  modality: "presencial",
  location: "Auditorio ESEN, San Salvador",
  capacity: 30,
  registrationOpensAt: null,
  registrationClosesAt: "2026-11-09T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const noStats: ExperienceStats = { challenges: 0, enrollments: countEnrollments([]) };

function inputFrom(experience: Experience, overrides: Record<string, unknown> = {}): ExperienceInput {
  return parseExperienceInput({ ...experience, ...overrides });
}

test("las inscripciones se cuentan por estado y solo pendientes y aprobadas ocupan cupo", () => {
  const counts = countEnrollments(["pending", "approved", "approved", "rejected", "cancelled", "otro"]);
  assert.deepEqual(counts, { pending: 1, approved: 2, rejected: 1, cancelled: 1, active: 3, total: 5 });
  assert.equal(spotsLeft({ capacity: 5 }, counts), 2);
  assert.equal(spotsLeft({ capacity: 2 }, counts), 0);
  assert.equal(spotsLeft({ capacity: null }, counts), null);
  assert.equal(spotsLeft({}, counts), null);
});

test("la ventana de inscripción sin fechas está abierta y las fechas la acotan", () => {
  assert.equal(registrationPhase({ registrationOpensAt: null, registrationClosesAt: null }, now), "open");
  assert.equal(registrationPhase({ registrationOpensAt: "2026-11-01T00:00:00.000Z", registrationClosesAt: null }, now), "upcoming");
  assert.equal(registrationPhase({ registrationOpensAt: null, registrationClosesAt: "2026-10-01T00:00:00.000Z" }, now), "closed");
});

test("la etapa para Admin distingue inscripciones cerradas de la sesión en desarrollo", () => {
  const published = { ...base, status: "published" as const };
  assert.equal(lifecycleOf(base, now).stage, "borrador");
  assert.equal(lifecycleOf(published, now).stage, "inscripciones_abiertas");
  assert.equal(lifecycleOf({ ...published, registrationOpensAt: "2026-11-01T00:00:00.000Z" }, now).stage, "publicada");
  assert.equal(lifecycleOf({ ...published, registrationClosesAt: "2026-10-20T00:00:00.000Z" }, now).stage, "inscripciones_cerradas");
  assert.equal(
    lifecycleOf({ ...published, registrationClosesAt: "2026-10-20T00:00:00.000Z", startsAt: "2026-10-21T10:00:00.000Z" }, now).stage,
    "en_desarrollo",
  );
  assert.equal(lifecycleOf({ ...published, startsAt: null, registrationClosesAt: "2026-10-20T00:00:00.000Z" }, now).stage, "en_desarrollo");
  assert.equal(lifecycleOf({ ...base, status: "closed" }, now).stage, "concluida");
  assert.equal(lifecycleOf({ ...base, status: "cancelled" }, now).stage, "cancelada");
});

test("transiciones de estado: la concluida es histórica y no se reabre ni se publica", () => {
  assert.equal(checkStatusTransition(base, "published", 0, now).ok, true);
  assert.equal(checkStatusTransition(base, "closed", 0, now).ok, true, "registrar una experiencia histórica sin publicarla");
  assert.equal(checkStatusTransition({ ...base, status: "published" }, "closed", 4, now).ok, true);

  for (const to of ["draft", "published", "cancelled"] as const) {
    const result = checkStatusTransition({ ...base, status: "closed" }, to, 0, now);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "experiencia_historica");
  }
  const restored = checkStatusTransition({ ...base, status: "cancelled" }, "draft", 2, now);
  assert.equal(restored.ok, true, "una cancelada se restaura como borrador");
  const cancelledToPublished = checkStatusTransition({ ...base, status: "cancelled" }, "published", 0, now);
  assert.equal(cancelledToPublished.ok, false);
});

test("no vuelve a borrador una experiencia publicada con inscripciones", () => {
  const published = { ...base, status: "published" as const };
  assert.equal(checkStatusTransition(published, "draft", 0, now).ok, true);
  const blocked = checkStatusTransition(published, "draft", 1, now);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.code, "tiene_inscripciones");
});

test("el mismo estado no es un error ni un cambio", () => {
  assert.equal(checkStatusTransition({ ...base, status: "published" }, "published", 3, now).ok, true);
  assert.equal(checkStatusTransition({ ...base, status: "closed" }, "closed", 3, now).ok, true);
});

test("publicar exige los datos de la sesión para talleres, charlas y encuentros", () => {
  const incomplete = { ...base, modality: null, startsAt: null, location: null };
  const result = checkStatusTransition(incomplete, "published", 0, now);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "no_publicable");
    assert.deepEqual(result.issues?.map((issue) => issue.field).sort(), ["location", "modality", "startsAt"]);
  }
  // Una competencia anterior no necesita esos datos para publicarse.
  assert.equal(checkStatusTransition({ ...incomplete, kind: "competencia" }, "published", 0, now).ok, true);
});

test("publicar rechaza una ventana ya vencida o una sesión que terminó", () => {
  const closedWindow = publishIssues({ ...base, registrationClosesAt: "2026-10-01T00:00:00.000Z" }, now, { checkRegistrationWindow: true });
  assert.deepEqual(closedWindow.map((issue) => issue.field), ["registrationClosesAt"]);
  const ended = publishIssues({ ...base, startsAt: "2026-10-01T10:00:00.000Z", endsAt: "2026-10-01T12:00:00.000Z", registrationClosesAt: null }, now, { checkRegistrationWindow: true });
  assert.deepEqual(ended.map((issue) => issue.field), ["endsAt"]);
  assert.deepEqual(publishIssues({ ...base, registrationClosesAt: "2026-10-01T00:00:00.000Z" }, now, { checkRegistrationWindow: false }), []);
});

test("los retos usan las mismas transiciones y un reto concluido no se reabre", () => {
  assert.equal(checkChallengeStatusTransition("draft", "published").ok, true);
  assert.equal(checkChallengeStatusTransition("draft", "closed").ok, true);
  assert.equal(checkChallengeStatusTransition("published", "closed").ok, true);
  const reopened = checkChallengeStatusTransition("closed", "published");
  assert.equal(reopened.ok, false);
  if (!reopened.ok) assert.equal(reopened.code, "reto_historico");
});

test("abrir inscripciones: fija la apertura ahora y conserva el cierre futuro", () => {
  const upcoming = { ...base, status: "published" as const, registrationOpensAt: "2026-11-01T00:00:00.000Z" };
  const result = applyRegistrationAction(upcoming, { action: "open", registrationClosesAt: null }, now);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.registrationOpensAt, now.toISOString());
    assert.equal(result.registrationClosesAt, "2026-11-09T00:00:00.000Z");
  }
});

test("abrir inscripciones tras un cierre exige una nueva fecha de cierre futura y anterior al fin de la sesión", () => {
  const closed = { ...base, status: "published" as const, registrationOpensAt: "2026-10-01T00:00:00.000Z", registrationClosesAt: "2026-10-15T00:00:00.000Z" };
  const missing = applyRegistrationAction(closed, { action: "open", registrationClosesAt: null }, now);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "falta_cierre");

  const past = applyRegistrationAction(closed, { action: "open", registrationClosesAt: "2026-10-20T00:00:00.000Z" }, now);
  assert.equal(past.ok === false && past.code, "cierre_pasado");

  const afterSession = applyRegistrationAction(closed, { action: "open", registrationClosesAt: "2026-11-11T00:00:00.000Z" }, now);
  assert.equal(afterSession.ok === false && afterSession.code, "cierre_posterior_a_sesion");

  const reopened = applyRegistrationAction(closed, { action: "open", registrationClosesAt: "2026-11-09T12:00:00.000Z" }, now);
  assert.equal(reopened.ok, true);
  if (reopened.ok) {
    assert.equal(reopened.registrationOpensAt, "2026-10-01T00:00:00.000Z", "se conserva la apertura original");
    assert.equal(reopened.registrationClosesAt, "2026-11-09T12:00:00.000Z");
  }
});

test("abrir inscripciones se rechaza si ya están abiertas, si no está publicada o si la sesión terminó", () => {
  const open = { ...base, status: "published" as const };
  assert.equal(applyRegistrationAction(open, { action: "open", registrationClosesAt: null }, now).ok === false, true);
  const draft = applyRegistrationAction(base, { action: "open", registrationClosesAt: null }, now);
  assert.equal(draft.ok === false && draft.code, "no_publicada");
  const ended = applyRegistrationAction(
    { ...open, registrationClosesAt: "2026-10-01T00:00:00.000Z", endsAt: "2026-10-05T00:00:00.000Z" },
    { action: "open", registrationClosesAt: "2026-12-01T00:00:00.000Z" },
    now,
  );
  assert.equal(ended.ok === false && ended.code, "sesion_terminada");
});

test("cerrar inscripciones fija el cierre en este momento y solo vale si están abiertas", () => {
  const open = { ...base, status: "published" as const };
  const result = applyRegistrationAction(open, { action: "close", registrationClosesAt: null }, now);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.registrationClosesAt, now.toISOString());
  const closedAlready = applyRegistrationAction({ ...open, registrationClosesAt: "2026-10-01T00:00:00.000Z" }, { action: "close", registrationClosesAt: null }, now);
  assert.equal(closedAlready.ok === false && closedAlready.code, "no_abiertas");
  const upcoming = applyRegistrationAction({ ...open, registrationOpensAt: "2026-11-01T00:00:00.000Z" }, { action: "close", registrationClosesAt: null }, now);
  assert.equal(upcoming.ok === false && upcoming.code, "no_abiertas");
});

test("una experiencia concluida o cancelada bloquea calendario y cupos; con retos o inscripciones, el tipo", () => {
  const closedLocks = lockedFields({ status: "closed" }, noStats);
  assert.deepEqual(Object.keys(closedLocks).sort(), ["capacity", "endsAt", "kind", "modality", "registrationClosesAt", "registrationOpensAt", "startsAt"]);
  assert.deepEqual(Object.keys(lockedFields({ status: "published" }, noStats)), []);
  assert.deepEqual(Object.keys(lockedFields({ status: "published" }, { challenges: 1, enrollments: countEnrollments([]) })), ["kind"]);
  assert.deepEqual(Object.keys(lockedFields({ status: "draft" }, { challenges: 0, enrollments: countEnrollments(["pending"]) })), ["kind"]);
});

test("editar detecta solo los campos que cambian y respeta fechas equivalentes", () => {
  assert.deepEqual(changedFields(base, inputFrom(base)), []);
  const sameInstantOtherOffset = inputFrom(base, { startsAt: "2026-11-10T10:00:00-06:00", endsAt: "2026-11-10T14:00:00-06:00" });
  assert.deepEqual(changedFields(base, sameInstantOtherOffset), []);
  assert.deepEqual(changedFields(base, inputFrom(base, { title: "Taller avanzado", capacity: 40, location: "Sala 2" })).sort(), ["capacity", "location", "title"]);
});

test("una experiencia anterior sin los campos nuevos se compara sin diferencias falsas", () => {
  const legacy: Experience = {
    id: "legacy",
    title: "Hackathon anterior",
    kind: "hackathon",
    summary: "Experiencia creada antes de los campos de sesión.",
    status: "published",
    registrationOpensAt: "2026-10-01T00:00:00.000Z",
    registrationClosesAt: "2026-12-31T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  const input = parseExperienceInput({ ...legacy });
  assert.deepEqual(changedFields(legacy, input), []);
  assert.equal(input.primaryLine, "crea", "sin línea guardada, la del tipo");
});

test("la edición se rechaza campo por campo cuando contradice bloqueos o cupos ocupados", () => {
  const published = { ...base, status: "published" as const };
  const stats: ExperienceStats = { challenges: 0, enrollments: countEnrollments(["pending", "approved", "approved", "rejected"]) };

  const lowCapacity = editIssues(published, inputFrom(published, { capacity: 2 }), stats, now);
  assert.deepEqual(lowCapacity.map((issue) => issue.field), ["capacity"]);
  assert.deepEqual(editIssues(published, inputFrom(published, { capacity: 3 }), stats, now), []);
  assert.deepEqual(editIssues(published, inputFrom(published, { capacity: null }), stats, now), []);

  const changedKind = editIssues(published, inputFrom(published, { kind: "charla" }), stats, now);
  assert.deepEqual(changedKind.map((issue) => issue.field), ["kind"]);

  const historical = { ...base, status: "closed" as const };
  const historicalIssues = editIssues(historical, inputFrom(historical, { capacity: 99, startsAt: "2026-12-10T16:00:00.000Z", endsAt: "2026-12-10T18:00:00.000Z", title: "Nombre corregido" }), noStats, now);
  assert.deepEqual(historicalIssues.map((issue) => issue.field).sort(), ["capacity", "endsAt", "startsAt"]);
});

test("una experiencia publicada no puede quedar sin los datos de la sesión, pero sí cerrar su ventana", () => {
  const published = { ...base, status: "published" as const };
  const issues = editIssues(published, inputFrom(published, { location: "" }), noStats, now);
  assert.deepEqual(issues.map((issue) => issue.field), ["location"]);
  const pastClose = editIssues(published, inputFrom(published, { registrationClosesAt: "2026-10-01T00:00:00.000Z" }), noStats, now);
  assert.deepEqual(pastClose, []);
  // Un borrador sí puede guardarse incompleto.
  assert.deepEqual(editIssues(base, inputFrom(base, { location: "" }), noStats, now), []);
});

test("las próximas acciones salen del estado, las pendientes y los cupos", () => {
  const incomplete = nextActionsOf({ ...base, location: null }, noStats, now);
  assert.equal(incomplete[0].tone, "advertencia");
  assert.match(incomplete[0].text, /sede o el enlace/);

  assert.match(nextActionsOf(base, noStats, now)[0].text, /publicala/);

  const published = { ...base, status: "published" as const };
  const busy = nextActionsOf(published, { challenges: 0, enrollments: countEnrollments(["pending", "pending", "approved"]) }, now);
  assert.ok(busy.some((action) => /2 inscripciones pendientes/.test(action.text)));

  const full = nextActionsOf({ ...published, capacity: 1 }, { challenges: 0, enrollments: countEnrollments(["approved"]) }, now);
  assert.ok(full.some((action) => /Cupos completos/.test(action.text)));

  const ended = nextActionsOf({ ...published, startsAt: "2026-10-01T10:00:00.000Z", endsAt: "2026-10-01T12:00:00.000Z" }, noStats, now);
  assert.match(ended[0].text, /concluida/);

  const hackathonWithoutChallenges = nextActionsOf({ ...published, kind: "hackathon" }, noStats, now);
  assert.ok(hackathonWithoutChallenges.some((action) => /al menos un reto/.test(action.text)));

  assert.deepEqual(nextActionsOf({ ...base, status: "closed" }, noStats, now), []);
  assert.deepEqual(nextActionsOf(published, noStats, now), []);
});
