import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_ORGANIZATION_ID, SEED_RECORDS } from "../../src/lib/seed/seed-data.ts";
import { resettableFrom } from "../../src/lib/seed/demo-reset.ts";

test("el seed trae cuatro challenges demo de la misma empresa, con dominios, paquetes y estados distintos", () => {
  const challenges = SEED_RECORDS.challenges;
  assert.equal(challenges.length, 4);
  assert.ok(challenges.every((record) => record.data.organizationId === DEMO_ORGANIZATION_ID && record.data.demo === true));
  assert.equal(new Set(challenges.map((record) => record.data.title)).size, 4, "títulos distintos");
  assert.ok(new Set(challenges.map((record) => record.data.commercialPackage)).size >= 3, "paquetes distintos");
  assert.deepEqual([...new Set(challenges.map((record) => record.data.status))].sort(), ["closed", "published"]);
});

test("cada challenge demo tiene su experiencia, y su resultado publicado solo existe donde ya evaluaron dos jurados", () => {
  const experienceIds = new Set(SEED_RECORDS.experiences.map((record) => record.id));
  for (const challenge of SEED_RECORDS.challenges) {
    assert.ok(experienceIds.has(String(challenge.data.experienceId)), `${challenge.id} apunta a una experiencia del seed`);
  }
  const published = SEED_RECORDS.results.filter((record) => record.data.status === "published");
  assert.equal(published.length, 2, "el challenge original y el concluido");
  for (const result of published) {
    const judges = new Set(
      SEED_RECORDS.evaluations
        .filter((record) => record.data.challengeId === result.data.challengeId && record.data.status === "finalized")
        .map((record) => record.data.judgeUserId),
    );
    assert.ok(judges.size >= 2, `${result.id}: cada resultado publicado tiene al menos dos jurados distintos`);
  }
});

test("el reset incluye también los challenges demo adicionales", () => {
  const selected = resettableFrom(Object.values(SEED_RECORDS).flat());
  for (const challenge of SEED_RECORDS.challenges) {
    assert.ok(selected.some((record) => record.id === challenge.id), `${challenge.id} se puede restablecer`);
  }
});
