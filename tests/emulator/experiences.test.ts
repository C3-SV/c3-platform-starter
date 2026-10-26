import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createChallenge,
  createExperience,
  getPublicChallenge,
  getPublicExperience,
  listAdminCatalog,
  listPublicCatalog,
  setChallengeStatus,
  setExperienceRegistration,
  setExperienceStatus,
  updateExperience,
} from "../../src/lib/server/catalog.ts";
import {
  cancelMyEnrollment,
  enrollInChallenge,
  enrollInExperience,
  getDelivery,
  listEnrollmentsForChallenge,
  listEnrollmentsForExperience,
  listMyEnrollments,
  reviewEnrollment,
  saveDelivery,
} from "../../src/lib/server/participation.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { admin, clearFirestore, joven, testDb } from "./support.ts";

const now = new Date("2026-10-21T18:00:00.000Z");
const otra = { uid: "joven-2", email: "otra@correo.test", isAdmin: false };
const tercera = { uid: "joven-3", email: "tercera@correo.test", isAdmin: false };

const workshop = {
  title: "Taller de programación competitiva",
  kind: "taller",
  summary: "Taller introductorio con problemas guiados para quienes empiezan.",
  primaryLine: "compite",
  startsAt: "2026-11-10T10:00:00-06:00",
  endsAt: "2026-11-10T14:00:00-06:00",
  modality: "presencial",
  location: "Auditorio ESEN, San Salvador",
  capacity: 2,
  registrationOpensAt: "2026-10-20T00:00:00-06:00",
  registrationClosesAt: "2026-11-09T18:00:00-06:00",
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

const expectHttp = (status: number, code?: string) => (error: unknown) =>
  error instanceof HttpError && error.status === status && (code === undefined || error.code === code);

async function publishedWorkshop(overrides: Record<string, unknown> = {}) {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, ...overrides }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  return { db, id: experience.id };
}

async function auditActions(db: ReturnType<typeof testDb>): Promise<string[]> {
  const snapshot = await db.collection("auditLog").get();
  return snapshot.docs.map((doc) => doc.data()).sort((a, b) => a.at.localeCompare(b.at) || a.action.localeCompare(b.action)).map((entry) => entry.action as string);
}

beforeEach(async () => {
  await clearFirestore();
});

// ------------------------------------------------------------------ crear y editar

test("crear un taller guarda sesión, modalidad, sede y cupos en borrador y lo deja fuera del catálogo público", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, workshop, now);
  assert.equal(experience.status, "draft");
  assert.equal(experience.kind, "taller");
  assert.equal(experience.primaryLine, "compite");
  assert.equal(experience.capacity, 2);
  assert.equal(experience.modality, "presencial");
  assert.equal(experience.startsAt, "2026-11-10T16:00:00.000Z");
  assert.deepEqual(await listPublicCatalog(db, now), []);
  await assert.rejects(getPublicExperience(db, experience.id, now), expectHttp(404));
});

test("solo administradores crean, editan, cambian de estado y abren o cierran inscripciones; el resto recibe 403 sin efectos", async () => {
  const db = testDb();
  const { id } = await publishedWorkshop();
  const before = (await db.collection("experiences").doc(id).get()).data();
  const auditBefore = (await db.collection("auditLog").get()).size;

  await assert.rejects(createExperience(db, joven, workshop, now), expectHttp(403));
  await assert.rejects(updateExperience(db, joven, id, { ...workshop, title: "Otro nombre" }, now), expectHttp(403));
  await assert.rejects(setExperienceStatus(db, joven, id, { status: "closed" }, now), expectHttp(403));
  await assert.rejects(setExperienceRegistration(db, joven, id, { action: "close" }, now), expectHttp(403));

  assert.deepEqual((await db.collection("experiences").doc(id).get()).data(), before);
  assert.equal((await db.collection("experiences").get()).size, 1);
  assert.equal((await db.collection("auditLog").get()).size, auditBefore, "las operaciones rechazadas no dejan bitácora");
});

test("editar actualiza solo lo que cambió y conserva estado, autoría y demás datos", async () => {
  const db = testDb();
  const { id } = await publishedWorkshop();
  const later = new Date("2026-10-22T10:00:00.000Z");
  const updated = await updateExperience(db, admin, id, { ...workshop, title: "Taller avanzado de programación competitiva", capacity: 40, location: "Sala 2, UCA" }, later);
  assert.equal(updated.title, "Taller avanzado de programación competitiva");
  assert.equal(updated.capacity, 40);
  assert.equal(updated.location, "Sala 2, UCA");
  assert.equal(updated.status, "published", "editar no cambia el estado");
  assert.equal(updated.updatedAt, later.toISOString());
  assert.equal(updated.createdAt, now.toISOString());
  const raw = (await db.collection("experiences").doc(id).get()).data();
  assert.equal(raw?.createdByUid, admin.uid);
  assert.equal(raw?.summary, workshop.summary);
});

test("editar sin cambios no escribe ni deja bitácora", async () => {
  const db = testDb();
  const { id } = await publishedWorkshop();
  const auditBefore = (await db.collection("auditLog").get()).size;
  const raw = (await db.collection("experiences").doc(id).get()).data();
  await updateExperience(db, admin, id, workshop, new Date("2026-10-22T10:00:00.000Z"));
  assert.deepEqual((await db.collection("experiences").doc(id).get()).data(), raw);
  assert.equal((await db.collection("auditLog").get()).size, auditBefore);
});

test("editar una experiencia inexistente da 404 y una entrada inválida da motivos por campo", async () => {
  const db = testDb();
  await assert.rejects(updateExperience(db, admin, "no-existe", workshop, now), expectHttp(404));
  const { id } = await publishedWorkshop();
  await assert.rejects(
    updateExperience(db, admin, id, { ...workshop, capacity: 0, endsAt: "2026-11-10T08:00:00-06:00" }, now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "capacity") && error.issues.some((issue) => issue.field === "endsAt"),
  );
});

test("editar conserva datos de demostración y de seed que el formulario no controla", async () => {
  const db = testDb();
  await db.collection("experiences").doc("seed_experience_demo").set({
    title: "Evento demo de prueba",
    kind: "competencia",
    primaryLine: "compite",
    summary: "Evento de demostración que no es una experiencia oficial.",
    status: "published",
    isDemo: true,
    demoNote: "Datos de demostración",
    seedVersion: 1,
    managedBy: "c3-seed",
    registrationOpensAt: null,
    registrationClosesAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
  const catalog = await listAdminCatalog(db, admin);
  const demo = catalog.experiences[0];
  await updateExperience(db, admin, demo.id, {
    title: "Evento demo corregido",
    kind: demo.kind,
    summary: demo.summary,
    primaryLine: demo.primaryLine,
    demoNote: demo.demoNote,
    isDemo: false,
  }, now);
  const raw = (await db.collection("experiences").doc(demo.id).get()).data();
  assert.equal(raw?.title, "Evento demo corregido");
  assert.equal(raw?.isDemo, true, "editar no convierte un evento demo en oficial");
  assert.equal(raw?.managedBy, "c3-seed");
  assert.equal(raw?.seedVersion, 1);
});

// ------------------------------------------------------------------ ciclo de vida

test("publicar un taller incompleto se rechaza con los datos faltantes; completo, queda público con su detalle", async () => {
  const db = testDb();
  const draft = await createExperience(db, admin, { ...workshop, modality: "", startsAt: "", endsAt: "", location: "" }, now);
  await assert.rejects(
    setExperienceStatus(db, admin, draft.id, { status: "published" }, now),
    (error) => expectHttp(409, "no_publicable")(error) && /fecha y hora de inicio/.test((error as HttpError).message),
  );
  assert.equal((await db.collection("experiences").doc(draft.id).get()).data()?.status, "draft");

  await updateExperience(db, admin, draft.id, workshop, now);
  await setExperienceStatus(db, admin, draft.id, { status: "published" }, now);
  const detail = await getPublicExperience(db, draft.id, now);
  assert.equal(detail.experience.title, workshop.title);
  assert.equal(detail.state.label, "Abierto");
  assert.deepEqual(detail.registration, { open: true, spotsLeft: 2, full: false, direct: true });
  assert.equal("createdByUid" in detail.experience, false);
  assert.deepEqual(detail.lines, ["compite"]);
});

test("una experiencia concluida es histórica: no se reabre, no se publica y no se le agregan challenges", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, workshop, now);
  await setExperienceStatus(db, admin, experience.id, { status: "closed" }, now);
  for (const status of ["published", "draft", "cancelled"]) {
    await assert.rejects(setExperienceStatus(db, admin, experience.id, { status }, now), expectHttp(409, "experiencia_historica"));
  }
  await assert.rejects(createChallenge(db, admin, challengeInput(experience.id), now), expectHttp(409, "experiencia_cerrada"));
  await assert.rejects(setExperienceRegistration(db, admin, experience.id, { action: "open", registrationClosesAt: "2026-12-01T00:00:00Z" }, now), expectHttp(409, "no_publicada"));
  await assert.rejects(enrollInExperience(db, joven, experience.id, now), expectHttp(404));
  assert.equal((await db.collection("experiences").doc(experience.id).get()).data()?.status, "closed");
});

test("registrar una experiencia histórica como concluida desde borrador nunca abre inscripciones", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, registrationOpensAt: "", registrationClosesAt: "" }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "closed" }, now);
  const detail = await getPublicExperience(db, experience.id, now);
  assert.equal(detail.state.label, "Concluido");
  assert.equal(detail.registration.open, false);
  await assert.rejects(enrollInExperience(db, joven, experience.id, now), expectHttp(404));
});

test("publicar con el cierre de inscripciones vencido se rechaza", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, registrationOpensAt: "2026-09-01T00:00:00Z", registrationClosesAt: "2026-10-01T00:00:00Z" }, now);
  await assert.rejects(setExperienceStatus(db, admin, experience.id, { status: "published" }, now), expectHttp(409, "no_publicable"));
});

test("una publicada con inscripciones no vuelve a borrador; cancelarla la saca del catálogo y se restaura como borrador", async () => {
  const { db, id } = await publishedWorkshop();
  const enrollment = await enrollInExperience(db, joven, id, now);
  await assert.rejects(setExperienceStatus(db, admin, id, { status: "draft" }, now), expectHttp(409, "tiene_inscripciones"));

  await setExperienceStatus(db, admin, id, { status: "cancelled" }, now);
  assert.deepEqual(await listPublicCatalog(db, now), []);
  await assert.rejects(getPublicExperience(db, id, now), expectHttp(404));
  assert.equal((await db.collection("enrollments").doc(enrollment.id).get()).data()?.status, "pending", "las inscripciones se conservan");
  await assert.rejects(reviewEnrollment(db, admin, enrollment.id, "approved", now), expectHttp(409, "experiencia_cerrada"));

  await setExperienceStatus(db, admin, id, { status: "draft" }, now);
  assert.equal((await db.collection("experiences").doc(id).get()).data()?.status, "draft");
});

test("abrir y cerrar inscripciones ajusta la ventana y el taller deja de aceptar inscripciones", async () => {
  const { db, id } = await publishedWorkshop({ registrationOpensAt: "2026-10-30T00:00:00-06:00" });
  assert.equal((await getPublicExperience(db, id, now)).state.label, "Próximo");
  await assert.rejects(enrollInExperience(db, joven, id, now), expectHttp(409, "inscripcion_cerrada"));

  const opened = await setExperienceRegistration(db, admin, id, { action: "open" }, now);
  assert.equal(opened.registrationOpensAt, now.toISOString());
  assert.equal(opened.registrationClosesAt, "2026-11-10T00:00:00.000Z", "se conserva el cierre original");
  assert.equal((await enrollInExperience(db, joven, id, now)).status, "pending");
  await assert.rejects(setExperienceRegistration(db, admin, id, { action: "open" }, now), expectHttp(409, "ya_abiertas"));

  const closed = await setExperienceRegistration(db, admin, id, { action: "close" }, now);
  assert.equal(closed.registrationClosesAt, now.toISOString());
  assert.equal((await getPublicExperience(db, id, now)).state.label, "En desarrollo");
  await assert.rejects(enrollInExperience(db, otra, id, now), expectHttp(409, "inscripcion_cerrada"));
  await assert.rejects(setExperienceRegistration(db, admin, id, { action: "close" }, now), expectHttp(409, "no_abiertas"));

  const later = new Date("2026-10-21T19:00:00.000Z");
  await assert.rejects(
    setExperienceRegistration(db, admin, id, { action: "open" }, later),
    (error) => expectHttp(409, "falta_cierre")(error),
  );
  const reopened = await setExperienceRegistration(db, admin, id, { action: "open", registrationClosesAt: "2026-11-09T12:00:00-06:00" }, later);
  assert.equal(reopened.registrationClosesAt, "2026-11-09T18:00:00.000Z");
  assert.equal((await enrollInExperience(db, otra, id, later)).status, "pending");
});

test("abrir inscripciones de un borrador se rechaza", async () => {
  const db = testDb();
  const draft = await createExperience(db, admin, workshop, now);
  await assert.rejects(setExperienceRegistration(db, admin, draft.id, { action: "open" }, now), expectHttp(409, "no_publicada"));
  await assert.rejects(setExperienceRegistration(db, admin, draft.id, { action: "pausar" }, now), (error) => error instanceof ValidationFailure);
});

test("los challenges tampoco se reabren una vez concluidos", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, kind: "hackathon", modality: "", startsAt: "", endsAt: "", location: "" }, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setChallengeStatus(db, admin, challenge.id, { status: "closed" }, now);
  await assert.rejects(setChallengeStatus(db, admin, challenge.id, { status: "published" }, now), expectHttp(409, "reto_historico"));
  assert.equal((await db.collection("challenges").doc(challenge.id).get()).data()?.status, "closed");
});

// ------------------------------------------------------------------ edición con inscripciones

test("con inscripciones, el tipo se bloquea y los cupos no bajan de las inscripciones activas", async () => {
  const { db, id } = await publishedWorkshop({ capacity: 5 });
  await enrollInExperience(db, joven, id, now);
  await enrollInExperience(db, otra, id, now);

  await assert.rejects(
    updateExperience(db, admin, id, { ...workshop, capacity: 1 }, now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "capacity"),
  );
  await assert.rejects(
    updateExperience(db, admin, id, { ...workshop, capacity: 5, kind: "charla" }, now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "kind"),
  );
  assert.equal((await db.collection("experiences").doc(id).get()).data()?.capacity, 5);

  const updated = await updateExperience(db, admin, id, { ...workshop, capacity: 2, location: "Sala 3, UCA" }, now);
  assert.equal(updated.capacity, 2);
});

test("una concluida conserva su calendario y cupos, pero admite corregir textos", async () => {
  const { db, id } = await publishedWorkshop();
  await setExperienceStatus(db, admin, id, { status: "closed" }, now);
  await assert.rejects(
    updateExperience(db, admin, id, { ...workshop, startsAt: "2026-12-10T10:00:00-06:00", endsAt: "2026-12-10T12:00:00-06:00" }, now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "startsAt"),
  );
  const fixed = await updateExperience(db, admin, id, { ...workshop, title: "Taller de programación competitiva (corregido)" }, now);
  assert.equal(fixed.title, "Taller de programación competitiva (corregido)");
  assert.equal(fixed.status, "closed");
});

test("una publicada no puede quedar sin sede ni fecha", async () => {
  const { db, id } = await publishedWorkshop();
  await assert.rejects(
    updateExperience(db, admin, id, { ...workshop, location: "" }, now),
    (error) => error instanceof ValidationFailure && error.issues.some((issue) => issue.field === "location"),
  );
});

// ------------------------------------------------------------------ inscripción sin challenge

test("una persona se inscribe a un taller sin challenge, queda pendiente y no puede repetir", async () => {
  const { db, id } = await publishedWorkshop();
  const enrollment = await enrollInExperience(db, joven, id, now);
  assert.equal(enrollment.status, "pending");
  assert.equal(enrollment.challengeId, null);
  assert.equal(enrollment.experienceTitle, workshop.title);
  assert.equal(enrollment.mode, "individual");
  await assert.rejects(enrollInExperience(db, joven, id, now), expectHttp(409, "ya_inscrito"));

  const stored = (await db.collection("enrollments").doc(enrollment.id).get()).data();
  assert.equal(stored?.experienceId, id);
  assert.equal(stored?.challengeId, null);
  assert.equal((await db.collection("enrollments").get()).size, 1);
});

test("los borradores y las experiencias inexistentes no se inscriben", async () => {
  const db = testDb();
  const draft = await createExperience(db, admin, workshop, now);
  await assert.rejects(enrollInExperience(db, joven, draft.id, now), expectHttp(404));
  await assert.rejects(enrollInExperience(db, joven, "no-existe", now), expectHttp(404));
});

test("los cupos se respetan: al llenarse se rechaza, y rechazar o cancelar libera el lugar", async () => {
  const { db, id } = await publishedWorkshop({ capacity: 2 });
  const first = await enrollInExperience(db, joven, id, now);
  await enrollInExperience(db, otra, id, now);
  await assert.rejects(enrollInExperience(db, tercera, id, now), expectHttp(409, "sin_cupos"));
  const full = await getPublicExperience(db, id, now);
  assert.deepEqual(full.registration, { open: false, spotsLeft: 0, full: true, direct: true });

  await reviewEnrollment(db, admin, first.id, "rejected", now);
  assert.equal((await enrollInExperience(db, tercera, id, now)).status, "pending");
  await assert.rejects(enrollInExperience(db, { uid: "joven-4", email: "cuarta@correo.test", isAdmin: false }, id, now), expectHttp(409, "sin_cupos"));

  const mine = (await listMyEnrollments(db, otra, now))[0];
  await cancelMyEnrollment(db, otra, mine.id, now);
  assert.equal((await getPublicExperience(db, id, now)).registration.spotsLeft, 1);
});

test("inscripciones simultáneas no superan los cupos", async () => {
  const { db, id } = await publishedWorkshop({ capacity: 3 });
  const people = Array.from({ length: 8 }, (_, index) => ({ uid: `carrera-${index}`, email: `c${index}@correo.test`, isAdmin: false }));
  const results = await Promise.allSettled(people.map((person) => enrollInExperience(db, person, id, now)));
  const accepted = results.filter((result) => result.status === "fulfilled").length;
  const refused = results.filter((result) => result.status === "rejected" && expectHttp(409, "sin_cupos")(result.reason)).length;
  assert.equal(accepted, 3);
  assert.equal(refused, 5);
  const active = (await db.collection("enrollments").where("experienceId", "==", id).get()).docs.filter((doc) => ["pending", "approved"].includes(doc.data().status));
  assert.equal(active.length, 3);
});

test("sin cupo definido no hay límite", async () => {
  const { db, id } = await publishedWorkshop({ capacity: "" });
  for (const person of [joven, otra, tercera]) await enrollInExperience(db, person, id, now);
  const detail = await getPublicExperience(db, id, now);
  assert.equal(detail.registration.spotsLeft, null);
  assert.equal(detail.registration.open, true);
});

test("C3 revisa la inscripción de un taller: aprobar no crea participación ni entrega", async () => {
  const { db, id } = await publishedWorkshop();
  const enrollment = await enrollInExperience(db, joven, id, now);
  await assert.rejects(reviewEnrollment(db, joven, enrollment.id, "approved", now), expectHttp(403));
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  assert.equal((await db.collection("enrollments").doc(enrollment.id).get()).data()?.status, "approved");
  assert.equal((await db.collection("participations").get()).size, 0);
  await assert.rejects(reviewEnrollment(db, admin, enrollment.id, "rejected", now), expectHttp(409, "ya_revisada"));
});

test("Mi C3 muestra la inscripción sin challenge y permite cancelarla mientras la experiencia está publicada", async () => {
  const { db, id } = await publishedWorkshop();
  const enrollment = await enrollInExperience(db, joven, id, now);
  const mine = await listMyEnrollments(db, joven, now);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].challengeId, null);
  assert.equal(mine[0].challengeTitle, null);
  assert.equal(mine[0].experienceTitle, workshop.title);
  assert.equal(mine[0].location, workshop.location);
  assert.equal(mine[0].delivery, null);

  await assert.rejects(cancelMyEnrollment(db, otra, enrollment.id, now), expectHttp(404), "nadie cancela la inscripción de otra persona");
  await cancelMyEnrollment(db, joven, enrollment.id, now);
  assert.equal((await listMyEnrollments(db, joven, now))[0].status, "cancelled");
  await assert.rejects(cancelMyEnrollment(db, joven, enrollment.id, now), expectHttp(409, "no_cancelable"));
});

test("no se cancela una inscripción de una experiencia concluida", async () => {
  const { db, id } = await publishedWorkshop();
  const enrollment = await enrollInExperience(db, joven, id, now);
  await setExperienceStatus(db, admin, id, { status: "closed" }, now);
  await assert.rejects(cancelMyEnrollment(db, joven, enrollment.id, now), expectHttp(409, "plazo_cerrado"));
});

test("el administrador consulta todas las inscripciones y los cupos de la experiencia", async () => {
  const { db, id } = await publishedWorkshop({ capacity: 5 });
  const first = await enrollInExperience(db, joven, id, now);
  await enrollInExperience(db, otra, id, new Date("2026-10-21T18:05:00.000Z"));
  await reviewEnrollment(db, admin, first.id, "approved", now);

  await assert.rejects(listEnrollmentsForExperience(db, joven, id), expectHttp(403));
  const result = await listEnrollmentsForExperience(db, admin, id);
  assert.equal(result.enrollments.length, 2);
  assert.deepEqual(result.enrollments.map((row) => row.status), ["approved", "pending"]);
  assert.equal(result.enrollments[0].challengeId, null);
  assert.deepEqual(result.summary, {
    capacity: 5,
    spotsLeft: 3,
    counts: { pending: 1, approved: 1, rejected: 0, cancelled: 0, active: 2, total: 2 },
  });
  await assert.rejects(listEnrollmentsForExperience(db, admin, "no-existe"), expectHttp(404));
});

test("el catálogo de Admin trae los challenges y las inscripciones de cada experiencia", async () => {
  const { db, id } = await publishedWorkshop({ capacity: 5 });
  await enrollInExperience(db, joven, id, now);
  const other = await createExperience(db, admin, { ...workshop, title: "Otra charla abierta", kind: "charla" }, now);
  const catalog = await listAdminCatalog(db, admin);
  assert.equal(catalog.stats[id].enrollments.pending, 1);
  assert.equal(catalog.stats[id].enrollments.active, 1);
  assert.equal(catalog.stats[id].challenges, 0);
  assert.equal(catalog.stats[other.id].enrollments.total, 0);
  await assert.rejects(listAdminCatalog(db, joven), expectHttp(403));
});

// ------------------------------------------------------------------ challenges y experiencias conviven

test("una experiencia con challenges publicados se inscribe desde el challenge, no directamente, y nunca se duplica la inscripción", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, kind: "hackathon", capacity: "" }, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);

  // Con el challenge aún en borrador, la experiencia se inscribe directamente.
  const detailDraftChallenge = await getPublicExperience(db, experience.id, now);
  assert.equal(detailDraftChallenge.registration.direct, true);

  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  const detail = await getPublicExperience(db, experience.id, now);
  assert.equal(detail.registration.direct, false);
  assert.equal(detail.challenges.length, 1);
  await assert.rejects(enrollInExperience(db, joven, experience.id, now), expectHttp(409, "inscripcion_por_reto"));

  const enrollment = await enrollInChallenge(db, joven, challenge.id, "individual", now);
  assert.equal(enrollment.challengeId, challenge.id);
  await assert.rejects(enrollInExperience(db, joven, experience.id, now), expectHttp(409, "inscripcion_por_reto"));
  await assert.rejects(enrollInChallenge(db, joven, challenge.id, "individual", now), expectHttp(409, "ya_inscrito"));
  assert.equal((await db.collection("enrollments").get()).size, 1);

  const byExperience = await listEnrollmentsForExperience(db, admin, experience.id);
  const byChallenge = await listEnrollmentsForChallenge(db, admin, challenge.id);
  assert.deepEqual(byExperience.enrollments.map((row) => row.id), byChallenge.map((row) => row.id));
  assert.equal(byChallenge[0].challengeId, challenge.id);
});

test("el cupo de la experiencia también limita la inscripción por challenge", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, kind: "hackathon", capacity: 1 }, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id, ["individual"]), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  await enrollInChallenge(db, joven, challenge.id, "individual", now);
  await assert.rejects(enrollInChallenge(db, otra, challenge.id, "individual", now), expectHttp(409, "sin_cupos"));
});

test("asociar un challenge después de inscribir al taller: el flujo del challenge sigue funcionando para quien se inscribió a la experiencia", async () => {
  const { db, id } = await publishedWorkshop({ capacity: "", registrationClosesAt: "2026-11-09T18:00:00-06:00" });
  const enrollment = await enrollInExperience(db, joven, id, now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);

  const challenge = await createChallenge(db, admin, challengeInput(id, ["individual"]), now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  assert.equal((await getPublicChallenge(db, challenge.id, now)).challenge.id, challenge.id);

  const during = new Date("2026-11-10T18:00:00.000Z");
  const delivery = await getDelivery(db, joven, challenge.id, during);
  assert.equal(delivery.eligible, true, "la inscripción aprobada a la experiencia habilita el challenge individual");
  const saved = await saveDelivery(db, joven, challenge.id, {
    text: "Heurística de inserción con penalización por ventana incumplida y mejora local.",
    links: ["https://github.com/equipo/rutas"],
    submit: false,
  }, during);
  assert.equal(saved.submission?.status, "draft");
  assert.equal((await listEnrollmentsForChallenge(db, admin, challenge.id)).length, 0, "la inscripción no se duplicó en el challenge");
});

test("una inscripción a la experiencia no habilita un challenge que se juega solo por equipo", async () => {
  const { db, id } = await publishedWorkshop({ capacity: "" });
  const enrollment = await enrollInExperience(db, joven, id, now);
  await reviewEnrollment(db, admin, enrollment.id, "approved", now);
  const challenge = await createChallenge(db, admin, challengeInput(id, ["team"]), now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  const during = new Date("2026-11-10T18:00:00.000Z");
  assert.equal((await getDelivery(db, joven, challenge.id, during)).eligible, false);
  await assert.rejects(
    saveDelivery(db, joven, challenge.id, { text: "Solución de prueba con suficiente detalle.", links: ["https://github.com/x/y"], submit: false }, during),
    expectHttp(403),
  );
});

// ------------------------------------------------------------------ compatibilidad

test("una experiencia anterior, sin los campos nuevos, se lee, se lista y se edita sin romperse", async () => {
  const db = testDb();
  await db.collection("experiences").doc("anterior").set({
    title: "Hackathon anterior",
    kind: "hackathon",
    summary: "Experiencia creada antes de los campos de sesión y cupos.",
    status: "published",
    registrationOpensAt: "2026-10-01T00:00:00.000Z",
    registrationClosesAt: "2027-12-31T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    createdByUid: "admin-viejo",
  });
  const catalog = await listPublicCatalog(db, now);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].experience.capacity, null);
  assert.equal(catalog[0].experience.startsAt, null);
  assert.deepEqual(catalog[0].lines, ["crea"]);

  const detail = await getPublicExperience(db, "anterior", now);
  assert.deepEqual(detail.registration, { open: true, spotsLeft: null, full: false, direct: true });

  const adminCatalog = await listAdminCatalog(db, admin);
  assert.equal(adminCatalog.stats.anterior.enrollments.total, 0);

  const edited = await updateExperience(db, admin, "anterior", {
    title: "Hackathon anterior (corregido)",
    kind: "hackathon",
    summary: "Experiencia creada antes de los campos de sesión y cupos.",
    registrationOpensAt: "2026-10-01T00:00:00.000Z",
    registrationClosesAt: "2027-12-31T00:00:00.000Z",
  }, now);
  assert.equal(edited.title, "Hackathon anterior (corregido)");
  assert.equal(edited.status, "published");
  const raw = (await db.collection("experiences").doc("anterior").get()).data();
  assert.equal(raw?.createdByUid, "admin-viejo");
  assert.equal("primaryLine" in (raw ?? {}), false, "no se escriben campos que no cambiaron");
});

test("una inscripción anterior por challenge sigue apareciendo igual en Mi C3 y en la revisión del challenge", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, kind: "hackathon", capacity: "" }, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id, ["individual"]), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  // Documento con la forma que tenían las inscripciones antes de este cambio.
  await db.collection("enrollments").doc(`${experience.id}__${joven.uid}`).set({
    experienceId: experience.id,
    challengeId: challenge.id,
    userId: joven.uid,
    mode: "individual",
    status: "pending",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  const mine = await listMyEnrollments(db, joven, now);
  assert.equal(mine[0].challengeId, challenge.id);
  assert.equal(mine[0].challengeTitle, challenge.title);
  await reviewEnrollment(db, admin, mine[0].id, "approved", now);
  assert.equal((await db.collection("participations").doc(`${challenge.id}__${joven.uid}`).get()).exists, true);
});

// ------------------------------------------------------------------ bitácora

test("las operaciones sensibles quedan en la bitácora con quién y qué cambió, sin datos personales", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, workshop, now);
  await updateExperience(db, admin, experience.id, { ...workshop, capacity: 10 }, new Date("2026-10-21T18:01:00.000Z"));
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, new Date("2026-10-21T18:02:00.000Z"));
  const enrollment = await enrollInExperience(db, joven, experience.id, new Date("2026-10-21T18:03:00.000Z"));
  await reviewEnrollment(db, admin, enrollment.id, "approved", new Date("2026-10-21T18:04:00.000Z"));
  await setExperienceRegistration(db, admin, experience.id, { action: "close" }, new Date("2026-10-21T18:05:00.000Z"));

  assert.deepEqual(await auditActions(db), [
    "experience.create",
    "experience.update",
    "experience.status",
    "enrollment.review",
    "experience.registration.close",
  ]);
  const entries = (await db.collection("auditLog").get()).docs.map((doc) => doc.data());
  assert.ok(entries.every((entry) => entry.actorUid === admin.uid));
  const update = entries.find((entry) => entry.action === "experience.update");
  assert.deepEqual(update?.details.changed, ["capacity"]);
  assert.deepEqual(update?.details.changes, { capacity: { from: 2, to: 10 } });
  const status = entries.find((entry) => entry.action === "experience.status");
  assert.deepEqual(status?.details, { from: "draft", to: "published" });
  const serialized = JSON.stringify(entries);
  assert.equal(serialized.includes("@"), false, "la bitácora no guarda correos");
});

// ------------------------------------------------------------------ resultados publicados

test("con resultados publicados, la experiencia y el challenge no vuelven a borrador ni se cancelan; sí se concluyen", async () => {
  const db = testDb();
  const experience = await createExperience(db, admin, { ...workshop, kind: "hackathon", capacity: "" }, now);
  const challenge = await createChallenge(db, admin, challengeInput(experience.id), now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  await db.collection("results").doc(challenge.id).set({ challengeId: challenge.id, publishedAt: now.toISOString(), visibility: "public" });

  for (const status of ["draft", "cancelled"]) {
    await assert.rejects(setExperienceStatus(db, admin, experience.id, { status }, now), expectHttp(409, "resultados_publicados"));
    await assert.rejects(setChallengeStatus(db, admin, challenge.id, { status }, now), expectHttp(409, "resultados_publicados"));
  }
  assert.equal((await db.collection("experiences").doc(experience.id).get()).data()?.status, "published");
  await setChallengeStatus(db, admin, challenge.id, { status: "closed" }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "closed" }, now);
  assert.equal((await db.collection("experiences").doc(experience.id).get()).data()?.status, "closed");
});
