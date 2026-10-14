import test from "node:test";
import assert from "node:assert/strict";
import {
  experienceLinesOf,
  isInExperienceLine,
  normalizeExperienceMetadata,
  presentExperienceState,
  type ExperienceLine,
} from "../../src/lib/domain/catalog.ts";
import type { Experience } from "../../src/lib/domain/types.ts";

const base: Experience = {
  id: "exp-1",
  title: "Experiencia",
  kind: "challenge_empresarial",
  summary: "Resumen de experiencia",
  status: "published",
  registrationOpensAt: "2026-01-01T00:00:00.000Z",
  registrationClosesAt: "2026-12-31T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("una experiencia legacy deriva su línea desde kind", () => {
  assert.deepEqual(experienceLinesOf(base), ["conecta"]);
  assert.equal(isInExperienceLine(base, "conecta"), true);
  assert.equal(isInExperienceLine(base, "crea"), false);
});

test("una experiencia puede tener línea principal y relación secundaria sin duplicarse", () => {
  const experience = { ...base, primaryLine: "crea" as ExperienceLine, secondaryLines: ["conecta" as ExperienceLine, "crea" as ExperienceLine] };
  assert.deepEqual(experienceLinesOf(experience), ["crea", "conecta"]);
  assert.equal(isInExperienceLine(experience, "crea"), true);
  assert.equal(isInExperienceLine(experience, "conecta"), true);
});

test("los metadatos demo y fuente se normalizan sin inventar valores", () => {
  assert.deepEqual(normalizeExperienceMetadata({ isDemo: true, demoNote: "Propuesta", sourceUrl: "https://c3.com.sv/", sourceLabel: "C3" }), {
    isDemo: true,
    demoNote: "Propuesta",
    sourceUrl: "https://c3.com.sv/",
    sourceLabel: "C3",
  });
  assert.deepEqual(normalizeExperienceMetadata({}), {
    isDemo: false,
    demoNote: null,
    sourceUrl: null,
    sourceLabel: null,
  });
});

test("la experiencia presenta estados administrativos y de ciclo sin confundirlos", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  assert.deepEqual(presentExperienceState("published", { opensAt: "2026-07-01T00:00:00.000Z", closesAt: "2026-08-01T00:00:00.000Z" }, now), { label: "Próximo", tone: "neutro" });
  assert.deepEqual(presentExperienceState("published", { opensAt: "2026-01-01T00:00:00.000Z", closesAt: "2026-08-01T00:00:00.000Z" }, now), { label: "Abierto", tone: "info" });
  assert.deepEqual(presentExperienceState("published", { opensAt: "2026-01-01T00:00:00.000Z", closesAt: "2026-05-01T00:00:00.000Z" }, now), { label: "En desarrollo", tone: "info" });
  assert.deepEqual(presentExperienceState("closed", {}, now), { label: "Concluido", tone: "exito" });
  assert.deepEqual(presentExperienceState("cancelled", {}, now), { label: "Cancelado", tone: "error" });
});
