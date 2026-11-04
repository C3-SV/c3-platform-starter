import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createExperience, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { listAudit } from "../../src/lib/server/audit.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { admin, clearAuth, clearFirestore, joven, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("solo administración lee la auditoría y las operaciones sensibles quedan registradas sin datos personales", async () => {
  const db = testDb();
  await assert.rejects(listAudit(db, joven), (error) => error instanceof HttpError && error.status === 403);

  const experience = await createExperience(db, admin, {
    title: "Experiencia de auditoría",
    kind: "challenge_empresarial",
    summary: "Experiencia para comprobar que la auditoría registra las operaciones.",
    registrationOpensAt: "2026-10-01T00:00:00-06:00",
    registrationClosesAt: "2026-12-31T23:59:00-06:00",
  }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);

  const entries = await listAudit(db, admin);
  assert.ok(entries.length >= 1, "la operación quedó registrada");
  assert.equal(JSON.stringify(entries).includes("@"), false, "la auditoría no guarda correos");
});
