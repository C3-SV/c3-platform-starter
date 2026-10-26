import test from "node:test";
import assert from "node:assert/strict";
import { parseChallengeInput, parseExperienceInput, parseRegistrationAction, parseStatusInput, ValidationFailure } from "../../src/lib/domain/validation.ts";

const now = new Date("2026-10-12T12:00:00-06:00");

function fields(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationFailure) return error.issues.map((issue) => issue.field).sort();
    throw error;
  }
  return [];
}

const validChallenge = {
  experienceId: "exp-1",
  title: "Ruteo de última milla",
  summary: "Armar rutas diarias respetando ventanas horarias.",
  problem: "Transportes Delta arma rutas a mano cada mañana y no respeta las ventanas horarias pactadas.",
  deliverables: ["Código con instrucciones", "Demo de 4 minutos"],
  rubric: [{ label: "Calidad del resultado", maxScore: 10 }, { label: "Claridad", maxScore: 10 }],
  organizationName: "Transportes Delta",
  allows: ["individual", "team"],
  teamMinSize: 2,
  teamMaxSize: 4,
  submissionClosesAt: "2026-11-14T23:59:00-06:00",
};

test("experiencia válida se normaliza y conserva fechas en ISO", () => {
  const parsed = parseExperienceInput({
    title: "  Copa de prueba  ",
    kind: "competencia",
    summary: "Competencia anual de programación individual.",
    registrationOpensAt: "2026-10-01T00:00:00-06:00",
    registrationClosesAt: "2026-10-31T23:59:00-06:00",
  });
  assert.equal(parsed.title, "Copa de prueba");
  assert.equal(parsed.registrationOpensAt, "2026-10-01T06:00:00.000Z");
});

test("experiencia rechaza tipo desconocido, cierre anterior a la apertura y datos vacíos", () => {
  assert.deepEqual(fields(() => parseExperienceInput({ title: "", kind: "otro", summary: "corto" })), ["kind", "summary", "title"]);
  assert.deepEqual(
    fields(() => parseExperienceInput({
      title: "Hackathon", kind: "hackathon", summary: "Fin de semana de challenges abiertos.",
      registrationOpensAt: "2026-10-31T00:00:00-06:00", registrationClosesAt: "2026-10-01T00:00:00-06:00",
    })),
    ["registrationClosesAt"],
  );
});

test("challenge válido con equipos de 2 a 4 se acepta", () => {
  const parsed = parseChallengeInput(validChallenge, now);
  assert.deepEqual(parsed.allows, ["individual", "team"]);
  assert.equal(parsed.teamMinSize, 2);
  assert.equal(parsed.teamMaxSize, 4);
  assert.equal(parsed.rubric.length, 2);
});

test("challenge individual descarta tamaños de equipo", () => {
  const parsed = parseChallengeInput({ ...validChallenge, allows: ["individual"], teamMinSize: 3, teamMaxSize: 5 }, now);
  assert.equal(parsed.teamMinSize, null);
  assert.equal(parsed.teamMaxSize, null);
});

test("challenge rechaza cierre pasado, rúbrica fuera de rango y equipo con máximo menor al mínimo", () => {
  assert.deepEqual(fields(() => parseChallengeInput({ ...validChallenge, submissionClosesAt: "2026-10-01T00:00:00-06:00" }, now)), ["submissionClosesAt"]);
  assert.deepEqual(
    fields(() => parseChallengeInput({ ...validChallenge, rubric: [{ label: "Calidad", maxScore: 11 }] }, now)),
    ["rubric"],
  );
  assert.deepEqual(fields(() => parseChallengeInput({ ...validChallenge, teamMinSize: 4, teamMaxSize: 2 }, now)), ["teamMaxSize"]);
});

test("las filas vacías de rúbrica se descartan y no bloquean la validación", () => {
  const parsed = parseChallengeInput({
    ...validChallenge,
    rubric: [{ label: "Calidad", maxScore: 10 }, { label: "", maxScore: Number.NaN }],
  }, now);
  assert.deepEqual(parsed.rubric, [{ label: "Calidad", maxScore: 10 }]);
});

test("challenge sin modalidad o sin entregables se rechaza", () => {
  assert.deepEqual(
    fields(() => parseChallengeInput({ ...validChallenge, allows: [], deliverables: [] }, now)),
    ["allows", "deliverables"],
  );
});

test("cambio de estado solo acepta estados conocidos", () => {
  assert.equal(parseStatusInput({ status: "published" }).status, "published");
  assert.throws(() => parseStatusInput({ status: "publicado" }), ValidationFailure);
});

const validSession = {
  title: "Taller de programación competitiva",
  kind: "taller",
  summary: "Taller introductorio con problemas guiados para quienes empiezan.",
  primaryLine: "compite",
  startsAt: "2026-11-10T10:00:00-06:00",
  endsAt: "2026-11-10T14:00:00-06:00",
  modality: "presencial",
  location: "Auditorio ESEN, San Salvador",
  capacity: "30",
  registrationOpensAt: "2026-10-25T00:00:00-06:00",
  registrationClosesAt: "2026-11-09T18:00:00-06:00",
};

test("experiencia de tipo taller con sesión, modalidad, sede y cupos se normaliza", () => {
  const parsed = parseExperienceInput(validSession);
  assert.equal(parsed.kind, "taller");
  assert.equal(parsed.primaryLine, "compite");
  assert.equal(parsed.startsAt, "2026-11-10T16:00:00.000Z");
  assert.equal(parsed.endsAt, "2026-11-10T20:00:00.000Z");
  assert.equal(parsed.modality, "presencial");
  assert.equal(parsed.location, "Auditorio ESEN, San Salvador");
  assert.equal(parsed.capacity, 30, "los cupos llegan como texto desde el formulario");
  assert.deepEqual(parsed.secondaryLines, []);
});

test("las charlas y los encuentros son tipos válidos y, sin línea elegida, toman la del tipo", () => {
  const charla = parseExperienceInput({ title: "Charla de carreras", kind: "charla", summary: "Conversación abierta sobre carreras técnicas." });
  assert.equal(charla.primaryLine, "conecta");
  assert.equal(charla.startsAt, null);
  assert.equal(charla.capacity, null);
  assert.equal(parseExperienceInput({ title: "Encuentro mensual", kind: "encuentro", summary: "Encuentro de la comunidad C3." }).primaryLine, "conecta");
});

test("la línea secundaria no repite la principal y descarta valores desconocidos", () => {
  const parsed = parseExperienceInput({ ...validSession, secondaryLines: ["compite", "crea", "crea", "otra"] });
  assert.deepEqual(parsed.secondaryLines, ["crea"]);
});

test("sesión: el fin exige inicio, es posterior a él y las inscripciones cierran antes de que termine", () => {
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, startsAt: "", endsAt: "2026-11-10T14:00:00-06:00" })), ["startsAt"]);
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, endsAt: "2026-11-10T09:00:00-06:00", registrationClosesAt: null })), ["endsAt"]);
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, registrationClosesAt: "2026-11-11T00:00:00-06:00" })), ["registrationClosesAt"]);
});

test("cupos, modalidad y enlace virtual se validan", () => {
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, capacity: 0 })), ["capacity"]);
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, capacity: "diez" })), ["capacity"]);
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, capacity: 5001 })), ["capacity"]);
  assert.equal(parseExperienceInput({ ...validSession, capacity: "" }).capacity, null);
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, modality: "remota" })), ["modality"]);
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, modality: "virtual", location: "Zoom, pedí el enlace" })), ["location"]);
  assert.equal(parseExperienceInput({ ...validSession, modality: "virtual", location: "https://meet.example.org/c3-taller" }).modality, "virtual");
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, location: "x".repeat(201) })), ["location"]);
});

test("la fuente exige un enlace https y las notas largas se rechazan en vez de recortarse en silencio", () => {
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, sourceUrl: "http://inseguro.test" })), ["sourceUrl"]);
  assert.equal(parseExperienceInput({ ...validSession, sourceUrl: "https://c3.com.sv/taller", sourceLabel: "C3" }).sourceUrl, "https://c3.com.sv/taller");
  assert.deepEqual(fields(() => parseExperienceInput({ ...validSession, demoNote: "n".repeat(241) })), ["demoNote"]);
});

test("abrir o cerrar inscripciones valida la acción y la fecha de cierre", () => {
  assert.deepEqual(parseRegistrationAction({ action: "close" }), { action: "close", registrationClosesAt: null });
  assert.equal(parseRegistrationAction({ action: "open", registrationClosesAt: "2026-11-09T12:00:00-06:00" }).registrationClosesAt, "2026-11-09T18:00:00.000Z");
  assert.throws(() => parseRegistrationAction({ action: "borrar" }), ValidationFailure);
  assert.deepEqual(fields(() => parseRegistrationAction({ action: "open", registrationClosesAt: "pronto" })), ["registrationClosesAt"]);
});
