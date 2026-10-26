import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createChallenge, createExperience, setChallengeStatus, setExperienceStatus } from "../../src/lib/server/catalog.ts";
import { getCapabilities } from "../../src/lib/server/capabilities.ts";
import { createOrganization, linkRepresentative } from "../../src/lib/server/companies.ts";
import { assignJudge, revokeJudge, assignmentDocId } from "../../src/lib/server/evaluation.ts";
import { ensureProfile, saveDisplayName } from "../../src/lib/server/profile.ts";
import { admin, clearAuth, clearFirestore, createAuthUser, joven, testAuth, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const representante = { uid: "rep-atlas", email: "rep@atlas.test", isAdmin: false };
const jurado = { uid: "jurado-1", email: "jurado@externo.test", isAdmin: false };

async function seedChallenge(db: ReturnType<typeof testDb>, organizationId: string, title = "Conciliación bancaria") {
  const experience = await createExperience(db, admin, {
    title: `Experiencia ${title}`,
    kind: "challenge_empresarial",
    summary: "Challenges que plantean empresas reales para equipos jóvenes.",
    registrationOpensAt: "2026-10-01T00:00:00-06:00",
    registrationClosesAt: "2026-12-31T23:59:00-06:00",
  }, now);
  await setExperienceStatus(db, admin, experience.id, { status: "published" }, now);
  const challenge = await createChallenge(db, admin, {
    experienceId: experience.id,
    organizationId,
    title,
    summary: "Cruzar extractos bancarios con el libro contable.",
    problem: "Cada cierre mensual se concilia a mano entre extractos bancarios y libro contable, y las diferencias llegan tarde.",
    deliverables: ["Repositorio con instrucciones"],
    rubric: [{ label: "Exactitud", maxScore: 10 }],
    organizationName: "Distribuidora Atlas",
    allows: ["individual"],
    teamMinSize: null,
    teamMaxSize: null,
    submissionClosesAt: "2026-11-14T23:59:00-06:00",
  }, now);
  await setChallengeStatus(db, admin, challenge.id, { status: "published" }, now);
  return challenge;
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
});

test("una cuenta sin vínculos no tiene capacidades adicionales", async () => {
  const db = testDb();
  assert.deepEqual(await getCapabilities(db, joven), { admin: false, organizations: [], judge: { challenges: 0 } });
});

test("la administradora lo es por el claim verificado, no por datos de Firestore", async () => {
  const db = testDb();
  assert.equal((await getCapabilities(db, admin)).admin, true);
  // Un documento de usuario que diga «admin» no concede nada: solo cuenta el claim del token.
  await db.collection("users").doc(joven.uid).set({ email: joven.email, isAdmin: true, admin: true, c3Admin: true });
  assert.equal((await getCapabilities(db, joven)).admin, false);
});

test("la representante ve solo las organizaciones a las que C3 la vinculó", async () => {
  const db = testDb();
  const auth = testAuth();
  await createAuthUser(representante.email, representante.uid);
  const atlas = await createOrganization(db, admin, "Distribuidora Atlas", now);
  const meridiano = await createOrganization(db, admin, "Meridiano Seguros", now);
  await linkRepresentative(db, auth, admin, atlas.id, representante.email, now);

  assert.deepEqual((await getCapabilities(db, representante)).organizations, [{ id: atlas.id, name: "Distribuidora Atlas" }]);

  // Otra persona no hereda ni ve el vínculo de la representante.
  assert.deepEqual((await getCapabilities(db, joven)).organizations, []);

  // Cada vínculo nuevo se refleja solo en la cuenta vinculada.
  await linkRepresentative(db, auth, admin, meridiano.id, representante.email, now);
  assert.deepEqual((await getCapabilities(db, representante)).organizations.map((item) => item.name), ["Distribuidora Atlas", "Meridiano Seguros"]);
  assert.deepEqual((await getCapabilities(db, joven)).organizations, []);
});

test("la evaluación se cuenta por asignaciones activas propias y una revocada deja de contar", async () => {
  const db = testDb();
  const auth = testAuth();
  await createAuthUser(jurado.email, jurado.uid);
  const org = await createOrganization(db, admin, "Distribuidora Atlas", now);
  const primero = await seedChallenge(db, org.id, "Conciliación bancaria");
  const segundo = await seedChallenge(db, org.id, "Ruteo de reparto");

  await assignJudge(db, auth, admin, primero.id, jurado.email, "externo", now);
  await assignJudge(db, auth, admin, segundo.id, jurado.email, "externo", now);
  assert.equal((await getCapabilities(db, jurado)).judge.challenges, 2);
  assert.equal((await getCapabilities(db, joven)).judge.challenges, 0);

  await revokeJudge(db, admin, assignmentDocId(primero.id, jurado.uid), now);
  assert.equal((await getCapabilities(db, jurado)).judge.challenges, 1);
});

test("crear el perfil dos veces a la vez no pisa el nombre guardado", async () => {
  const db = testDb();
  const persona = { uid: "persona-1", email: "persona@correo.test", isAdmin: false };
  // `/api/me` (GET) y el guardado del nombre del registro (PUT) llegan casi juntos tras crear la cuenta.
  await Promise.all([
    ensureProfile(db, persona, now),
    saveDisplayName(db, persona, "Lucía Robles", now),
    ensureProfile(db, persona, now),
    ensureProfile(db, persona, now),
  ]);
  const profile = await ensureProfile(db, persona, now);
  assert.equal(profile.displayName, "Lucía Robles");
});
