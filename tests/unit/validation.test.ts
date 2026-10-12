import test from "node:test";
import assert from "node:assert/strict";
import { parseChallengeInput, parseExperienceInput, parseStatusInput, ValidationFailure } from "../../src/lib/domain/validation.ts";

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
      title: "Hackathon", kind: "hackathon", summary: "Fin de semana de retos abiertos.",
      registrationOpensAt: "2026-10-31T00:00:00-06:00", registrationClosesAt: "2026-10-01T00:00:00-06:00",
    })),
    ["registrationClosesAt"],
  );
});

test("reto válido con equipos de 2 a 4 se acepta", () => {
  const parsed = parseChallengeInput(validChallenge, now);
  assert.deepEqual(parsed.allows, ["individual", "team"]);
  assert.equal(parsed.teamMinSize, 2);
  assert.equal(parsed.teamMaxSize, 4);
  assert.equal(parsed.rubric.length, 2);
});

test("reto individual descarta tamaños de equipo", () => {
  const parsed = parseChallengeInput({ ...validChallenge, allows: ["individual"], teamMinSize: 3, teamMaxSize: 5 }, now);
  assert.equal(parsed.teamMinSize, null);
  assert.equal(parsed.teamMaxSize, null);
});

test("reto rechaza cierre pasado, rúbrica fuera de rango y equipo con máximo menor al mínimo", () => {
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

test("reto sin modalidad o sin entregables se rechaza", () => {
  assert.deepEqual(
    fields(() => parseChallengeInput({ ...validChallenge, allows: [], deliverables: [] }, now)),
    ["allows", "deliverables"],
  );
});

test("cambio de estado solo acepta estados conocidos", () => {
  assert.equal(parseStatusInput({ status: "published" }).status, "published");
  assert.throws(() => parseStatusInput({ status: "publicado" }), ValidationFailure);
});
