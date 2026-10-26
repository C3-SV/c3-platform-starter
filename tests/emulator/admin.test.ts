import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getAdminDashboard, listAdminDeliveries } from "../../src/lib/server/admin.ts";
import { HttpError } from "../../src/lib/server/errors.ts";
import { admin, clearFirestore, joven, testDb } from "./support.ts";

beforeEach(async () => {
  await clearFirestore();
});

test("las entregas administrativas exigen permisos y muestran contexto autorizado", async () => {
  const db = testDb();
  await assert.rejects(listAdminDeliveries(db, joven), (error) => error instanceof HttpError && error.status === 403);

  await db.collection("experiences").doc("exp-admin").set({
    title: "Experiencia Admin",
    status: "published",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
  await db.collection("challenges").doc("challenge-admin").set({
    experienceId: "exp-admin",
    title: "Challenge Admin",
    status: "published",
    organizationName: "C3",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
  await db.collection("users").doc("joven-1").set({ displayName: "Joven Prueba", email: "joven@correo.test" });
  await db.collection("enrollments").doc("exp-admin__joven-1").set({
    experienceId: "exp-admin",
    challengeId: "challenge-admin",
    userId: "joven-1",
    mode: "individual",
    status: "approved",
  });
  await db.collection("submissions").doc("challenge-admin__joven-1").set({
    challengeId: "challenge-admin",
    participationId: "challenge-admin__joven-1",
    userId: "joven-1",
    mode: "individual",
    status: "submitted",
    text: "Una solución entregada para revisión.",
    links: ["https://github.com/c3/prueba"],
    updatedAt: "2026-10-10T00:00:00.000Z",
    submittedAt: "2026-10-10T00:00:00.000Z",
  });

  const rows = await listAdminDeliveries(db, admin);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].challengeTitle, "Challenge Admin");
  assert.deepEqual(rows[0].participantIds, ["joven-1"]);
  assert.equal(rows[0].authorized, true);
  assert.equal(rows[0].status, "submitted");
});

test("el dashboard administrativo resume colecciones sin exponerlo a jóvenes", async () => {
  const db = testDb();
  await db.collection("experiences").doc("exp-1").set({ status: "draft" });
  // Solo las propuestas recibidas cuentan como pendientes de revisión.
  await db.collection("companyProposals").doc("prop-1").set({ status: "received" });
  await db.collection("companyProposals").doc("prop-2").set({ status: "received" });
  await db.collection("companyProposals").doc("prop-3").set({ status: "accepted" });
  await db.collection("enrollments").doc("enrollment-1").set({ status: "pending" });
  await db.collection("submissions").doc("submission-1").set({ status: "submitted" });
  await db.collection("evaluations").doc("evaluation-1").set({ status: "finalized" });
  await assert.rejects(getAdminDashboard(db, joven), (error) => error instanceof HttpError && error.status === 403);
  const dashboard = await getAdminDashboard(db, admin);
  assert.deepEqual(dashboard, {
    experiences: 1,
    proposals: 3,
    pendingProposals: 2,
    pendingEnrollments: 1,
    submissions: 1,
    evaluations: 1,
  });
});
