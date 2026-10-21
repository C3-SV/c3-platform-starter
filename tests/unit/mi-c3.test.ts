import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAssignment,
  classifyEnrollment,
  organizeParticipation,
  overviewMessage,
  type AssignmentFacts,
  type EnrollmentFacts,
} from "../../src/lib/domain/mi-c3.ts";

const now = new Date("2026-10-21T12:00:00.000Z");
const future = "2026-11-12T05:59:00.000Z";
const past = "2026-10-01T05:59:00.000Z";

function enrollment(overrides: Partial<EnrollmentFacts> = {}): EnrollmentFacts {
  return { status: "approved", mode: "individual", submissionClosesAt: future, team: null, delivery: { state: "sin_entrega", canEdit: true }, result: null, ...overrides };
}

test("una inscripción pendiente está en espera de C3, no es una tarea de la persona", () => {
  assert.deepEqual(classifyEnrollment(enrollment({ status: "pending", delivery: null }), now), { group: "espera", reason: "revision_c3" });
});

test("rechazadas y canceladas quedan finalizadas", () => {
  assert.deepEqual(classifyEnrollment(enrollment({ status: "rejected", delivery: null }), now), { group: "finalizada", reason: "rechazada" });
  assert.deepEqual(classifyEnrollment(enrollment({ status: "cancelled", delivery: null }), now), { group: "finalizada", reason: "cancelada" });
});

test("una inscripción aprobada sin entrega requiere atención; con borrador también", () => {
  assert.deepEqual(classifyEnrollment(enrollment(), now), { group: "atencion", reason: "entrega_pendiente" });
  assert.deepEqual(classifyEnrollment(enrollment({ delivery: { state: "borrador", canEdit: true } }), now), { group: "atencion", reason: "entrega_borrador" });
});

test("una entrega enviada sigue en curso hasta que se publica el resultado", () => {
  const delivered = enrollment({ delivery: { state: "entregada", canEdit: false } });
  assert.deepEqual(classifyEnrollment(delivered, now), { group: "en_curso", reason: "entregada" });
  assert.deepEqual(classifyEnrollment({ ...delivered, result: { average: 8 } }, now), { group: "finalizada", reason: "resultado" });
});

test("con el plazo vencido y sin entrega enviada ya no hay nada que hacer", () => {
  assert.deepEqual(classifyEnrollment(enrollment({ delivery: { state: "fuera_de_plazo", canEdit: false } }), now), { group: "finalizada", reason: "sin_entrega" });
  assert.deepEqual(classifyEnrollment(enrollment({ mode: "team", submissionClosesAt: past, delivery: null }), now), { group: "finalizada", reason: "sin_entrega" });
});

test("por equipo: sin equipo o con equipo incompleto requiere atención mientras el plazo está abierto", () => {
  assert.deepEqual(classifyEnrollment(enrollment({ mode: "team", delivery: null }), now), { group: "atencion", reason: "sin_equipo" });
  const incomplete = { status: "incompleto", role: "lider" } as const;
  assert.deepEqual(classifyEnrollment(enrollment({ mode: "team", team: incomplete, delivery: null }), now), { group: "atencion", reason: "equipo_incompleto" });
});

test("por equipo: solo la líder envía; un integrante queda en curso", () => {
  const enabledMember = { status: "habilitado", role: "integrante" } as const;
  const enabledLeader = { status: "habilitado", role: "lider" } as const;
  assert.deepEqual(
    classifyEnrollment(enrollment({ mode: "team", team: enabledMember, delivery: { state: "sin_entrega", canEdit: false } }), now),
    { group: "en_curso", reason: "entrega_del_equipo" },
  );
  assert.deepEqual(
    classifyEnrollment(enrollment({ mode: "team", team: enabledLeader, delivery: { state: "sin_entrega", canEdit: true } }), now),
    { group: "atencion", reason: "entrega_pendiente" },
  );
});

test("una persona sin equipo que no puede editar no recibe un texto sobre su líder", () => {
  assert.deepEqual(classifyEnrollment(enrollment({ delivery: { state: "sin_entrega", canEdit: false } }), now), { group: "en_curso", reason: "aprobada" });
});

test("jurado: evaluar solo cuando cerró el plazo y quedan soluciones por finalizar", () => {
  const base: AssignmentFacts = { canEvaluate: true, solutions: 4, finalized: 1 };
  assert.deepEqual(classifyAssignment({ ...base, canEvaluate: false }), { group: "espera", reason: "esperando_cierre" });
  assert.deepEqual(classifyAssignment(base), { group: "atencion", reason: "evaluar" });
  assert.deepEqual(classifyAssignment({ ...base, finalized: 4 }), { group: "finalizada", reason: "completa" });
  assert.deepEqual(classifyAssignment({ ...base, solutions: 0, finalized: 0 }), { group: "finalizada", reason: "sin_soluciones" });
});

test("organizar: cada elemento cae en un solo grupo y los conteos coinciden", () => {
  const overview = organizeParticipation(
    [
      enrollment({ status: "pending", delivery: null }),
      enrollment({ submissionClosesAt: "2026-12-01T00:00:00.000Z" }),
      enrollment({ submissionClosesAt: future }),
      enrollment({ delivery: { state: "entregada", canEdit: false } }),
      enrollment({ status: "cancelled", delivery: null }),
    ],
    [{ canEvaluate: false, solutions: 0, finalized: 0 }],
    now,
  );
  assert.deepEqual(overview.counts, { atencion: 2, espera: 2, en_curso: 1, finalizada: 1 });
  assert.equal(overview.total, 6);
  assert.equal(overview.awaitingC3, 1);
});

test("organizar: lo que cierra antes va primero y define el próximo cierre", () => {
  const later = enrollment({ submissionClosesAt: "2026-12-01T00:00:00.000Z" });
  const sooner = enrollment({ submissionClosesAt: future });
  const overview = organizeParticipation([later, sooner], [], now);
  assert.equal(overview.groups.atencion[0].item, sooner);
  assert.equal(overview.nextDeadline?.item, sooner);
  assert.equal(organizeParticipation([], [], now).nextDeadline, null);
});

test("el mensaje no dice que no hay nada pendiente cuando falta una acción ni mezcla la espera de C3 con una tarea", () => {
  const withAction = organizeParticipation([enrollment(), enrollment({ status: "pending", delivery: null })], [], now);
  const message = overviewMessage(withAction);
  assert.equal(message, "Tenés 1 acción que requiere tu atención y 1 inscripción en espera de la respuesta de C3.");
  assert.doesNotMatch(message, /nada pendiente|al día/i);

  const onlyWaiting = organizeParticipation([enrollment({ status: "pending", delivery: null })], [], now);
  assert.equal(overviewMessage(onlyWaiting), "No tenés acciones pendientes. Estás esperando la respuesta de C3 sobre 1 inscripción.");
});

test("el mensaje cubre los casos sin inscripciones, en curso y varias acciones", () => {
  assert.equal(overviewMessage(organizeParticipation([], [], now)), "Todavía no participás en ninguna experiencia.");
  const active = organizeParticipation([enrollment({ delivery: { state: "entregada", canEdit: false } })], [], now);
  assert.equal(overviewMessage(active), "No tenés acciones pendientes. Tenés 1 participación en curso.");
  const several = organizeParticipation([enrollment(), enrollment()], [{ canEvaluate: true, solutions: 2, finalized: 0 }], now);
  assert.equal(overviewMessage(several), "Tenés 3 acciones que requieren tu atención.");
  const finished = organizeParticipation([enrollment({ status: "cancelled", delivery: null })], [], now);
  assert.equal(overviewMessage(finished), "No tenés acciones pendientes.");
});
