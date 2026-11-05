import test from "node:test";
import assert from "node:assert/strict";
import { challengeCoverOf, coverOf, coverRemotePatterns, isAllowedCoverUrl } from "../../src/lib/domain/coverImage.ts";
import { changedFields, countEnrollments, editIssues, type ExperienceStats } from "../../src/lib/domain/lifecycle.ts";
import type { Experience } from "../../src/lib/domain/types.ts";
import { parseChallengeInput, parseExperienceInput, ValidationFailure } from "../../src/lib/domain/validation.ts";

const now = new Date("2026-11-04T18:00:00.000Z");
const COPA = "https://copa.c3.com.sv/index/fotoHero.webp";
const ALT = "Equipo de la Copa frente al panel de patrocinadores";

const experience: Experience = {
  id: "exp-1",
  title: "Copa de prueba",
  kind: "competencia",
  summary: "Competencia anual de programación individual.",
  status: "closed",
  primaryLine: "compite",
  secondaryLines: [],
  registrationOpensAt: "2026-10-01T06:00:00.000Z",
  registrationClosesAt: "2026-10-31T06:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const validChallenge = {
  experienceId: "exp-1",
  title: "Ruteo de última milla",
  summary: "Armar rutas diarias respetando ventanas horarias.",
  problem: "Transportes Delta arma rutas a mano cada mañana y no respeta las ventanas horarias pactadas.",
  deliverables: ["Código con instrucciones"],
  rubric: [{ label: "Calidad del resultado", maxScore: 10 }],
  organizationName: "Transportes Delta",
  allows: ["individual"],
  submissionClosesAt: "2026-12-14T23:59:00-06:00",
};

function issueFields(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof ValidationFailure) return error.issues.map((issue) => issue.field).sort();
    throw error;
  }
  return [];
}

test("solo se aceptan enlaces https de c3.com.sv y sus subdominios", () => {
  assert.equal(isAllowedCoverUrl("https://c3.com.sv/og-image.png"), true);
  assert.equal(isAllowedCoverUrl(COPA), true);
  assert.equal(isAllowedCoverUrl("http://copa.c3.com.sv/foto.webp"), false);
  assert.equal(isAllowedCoverUrl("https://images.ejemplo.com/foto.jpg"), false);
  assert.equal(isAllowedCoverUrl("https://evilc3.com.sv/foto.jpg"), false);
  assert.equal(isAllowedCoverUrl("https://c3.com.sv.ejemplo.com/foto.jpg"), false);
  assert.equal(isAllowedCoverUrl("https://c3.com.sv@ejemplo.com/foto.jpg"), false);
  assert.equal(isAllowedCoverUrl("https://c3.com.sv:8443/foto.jpg"), false);
  assert.equal(isAllowedCoverUrl(`https://c3.com.sv/${"a".repeat(500)}.png`), false);
});

test("next/image recibe la misma lista de dominios que acepta la validación", () => {
  assert.deepEqual(coverRemotePatterns().map((pattern) => pattern.hostname), ["c3.com.sv", "**.c3.com.sv"]);
  assert.ok(coverRemotePatterns().every((pattern) => pattern.protocol === "https"));
});

test("la experiencia sin portada guarda ambos campos vacíos aunque llegue una descripción suelta", () => {
  const parsed = parseExperienceInput({ ...experience, coverImageUrl: "  ", coverImageAlt: "Texto que se ignora" });
  assert.equal(parsed.coverImageUrl, null);
  assert.equal(parsed.coverImageAlt, null);
});

test("la portada de una experiencia exige dominio permitido y descripción", () => {
  const parsed = parseExperienceInput({ ...experience, coverImageUrl: ` ${COPA} `, coverImageAlt: ` ${ALT} ` });
  assert.equal(parsed.coverImageUrl, COPA);
  assert.equal(parsed.coverImageAlt, ALT);
  assert.deepEqual(issueFields(() => parseExperienceInput({ ...experience, coverImageUrl: COPA })), ["coverImageAlt"]);
  assert.deepEqual(issueFields(() => parseExperienceInput({ ...experience, coverImageUrl: COPA, coverImageAlt: "x".repeat(161) })), ["coverImageAlt"]);
  assert.deepEqual(
    issueFields(() => parseExperienceInput({ ...experience, coverImageUrl: "https://images.ejemplo.com/foto.jpg", coverImageAlt: ALT })),
    ["coverImageUrl"],
  );
});

test("la portada propia de un challenge sigue las mismas reglas", () => {
  const parsed = parseChallengeInput({ ...validChallenge, coverImageUrl: COPA, coverImageAlt: ALT }, now);
  assert.equal(parsed.coverImageUrl, COPA);
  assert.equal(parsed.coverImageAlt, ALT);
  assert.equal(parseChallengeInput(validChallenge, now).coverImageUrl, null);
  assert.deepEqual(issueFields(() => parseChallengeInput({ ...validChallenge, coverImageUrl: "javascript:alert(1)", coverImageAlt: ALT }, now)), ["coverImageUrl"]);
});

test("la lectura pública descarta portadas guardadas que ya no cumplen las reglas", () => {
  assert.deepEqual(coverOf({ coverImageUrl: COPA, coverImageAlt: ALT }), { url: COPA, alt: ALT });
  assert.equal(coverOf({ coverImageUrl: "https://images.ejemplo.com/foto.jpg", coverImageAlt: ALT }), null);
  assert.equal(coverOf({ coverImageUrl: COPA, coverImageAlt: "" }), null);
  assert.equal(coverOf({}), null);
  assert.equal(coverOf(null), null);
});

test("un challenge sin portada propia usa la de su experiencia", () => {
  const experienceCover = { coverImageUrl: COPA, coverImageAlt: ALT };
  const ownCover = { coverImageUrl: "https://hackathon.c3.com.sv/portada.png", coverImageAlt: "Portada propia del challenge" };
  assert.deepEqual(challengeCoverOf({}, experienceCover), { url: COPA, alt: ALT });
  assert.deepEqual(challengeCoverOf(ownCover, experienceCover)?.url, ownCover.coverImageUrl);
  assert.equal(challengeCoverOf({}, {}), null);
});

test("la portada se puede corregir en una experiencia concluida y queda como cambio auditable", () => {
  const stats: ExperienceStats = { challenges: 1, enrollments: countEnrollments(["approved"]) };
  const input = parseExperienceInput({ ...experience, coverImageUrl: COPA, coverImageAlt: ALT });
  assert.deepEqual(changedFields(experience, input).sort(), ["coverImageAlt", "coverImageUrl"]);
  assert.deepEqual(editIssues(experience, input, stats, now), []);
});
