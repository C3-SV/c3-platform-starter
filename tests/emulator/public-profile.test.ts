import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import { publicWinners } from "../../src/lib/server/evaluation.ts";
import { ensureProfile, saveDisplayName, saveProfileDetails } from "../../src/lib/server/profile.ts";
import {
  getMyPublicProfile,
  getPublicProfileBySlug,
  publicSlugOf,
  rotatePublicProfileLink,
  savePublicProfile,
} from "../../src/lib/server/publicProfiles.ts";
import { clearFirestore, joven, testDb } from "./support.ts";

const now = new Date("2026-10-12T18:00:00.000Z");
const otra = { uid: "joven-2", email: "otra@correo.test", isAdmin: false };

async function personWithProfile(actor = joven, name = "Lucía Robles") {
  const db = testDb();
  await ensureProfile(db, actor, now);
  await saveDisplayName(db, actor, name, now);
  await saveProfileDetails(db, actor, {
    displayName: name,
    school: "Colegio Santa Ana",
    bio: "Me interesan los challenges de backend.",
    github: "https://github.com/lucia",
    linkedin: "https://www.linkedin.com/in/lucia",
  }, now);
  return db;
}

/** Experiencia con un challenge, ambos con el estado indicado, y una inscripción de la persona. */
async function seedParticipation(
  db: ReturnType<typeof testDb>,
  uid: string,
  options: { experience?: string; challenge?: string; enrollment?: string; key?: string; title?: string } = {},
) {
  const key = options.key ?? "a";
  const experienceId = `exp-${key}`;
  const challengeId = `chal-${key}`;
  await db.collection("experiences").doc(experienceId).set({
    title: options.title ?? `Experiencia ${key}`,
    kind: "competencia",
    status: options.experience ?? "published",
    summary: "Resumen",
    registrationOpensAt: null,
    registrationClosesAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  await db.collection("challenges").doc(challengeId).set({
    experienceId,
    title: `Challenge ${key}`,
    status: options.challenge ?? "published",
    organizationName: "Org",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  await db.collection("enrollments").doc(`${experienceId}__${uid}`).set({
    experienceId,
    challengeId,
    userId: uid,
    mode: "individual",
    status: options.enrollment ?? "approved",
  });
  return { experienceId, challengeId };
}

beforeEach(async () => {
  await clearFirestore();
});

test("por defecto el perfil es privado: sin dirección y sin vista pública", async () => {
  const db = await personWithProfile();
  assert.deepEqual(await getMyPublicProfile(db, joven), { enabled: false, slug: null, path: null, show: { school: false, bio: true, links: true, trajectory: true } });
  assert.equal(await getPublicProfileBySlug(db, "lucia-robles-aaaaaa"), null);
  assert.equal(await publicSlugOf(db, joven.uid), null);
});

test("activar exige un nombre y crea una dirección propia", async () => {
  const db = testDb();
  await ensureProfile(db, joven, now);
  await assert.rejects(savePublicProfile(db, joven, { enabled: true }, now), ValidationFailure);
  assert.equal((await getMyPublicProfile(db, joven)).slug, null, "una activación rechazada no deja dirección");

  await saveDisplayName(db, joven, "Lucía Robles", now);
  const mine = await savePublicProfile(db, joven, { enabled: true }, now);
  assert.equal(mine.enabled, true);
  assert.match(mine.slug ?? "", /^lucia-robles-[a-z0-9]{6}$/);
  assert.equal(mine.path, `/personas/${mine.slug}`);
  assert.equal((await db.collection("publicProfiles").doc(mine.slug as string).get()).data()?.userId, joven.uid);
});

test("la vista pública muestra solo lo que la persona eligió y nunca datos privados", async () => {
  const db = await personWithProfile();
  const mine = await savePublicProfile(db, joven, { enabled: true, show: { school: false, bio: true, links: true, trajectory: true } }, now);
  const view = await getPublicProfileBySlug(db, mine.slug as string);
  assert.ok(view);
  assert.equal(view.displayName, "Lucía Robles");
  assert.equal(view.school, null, "el centro de estudio empieza oculto");
  assert.equal(view.bio, "Me interesan los challenges de backend.");
  assert.deepEqual(view.links, { github: "https://github.com/lucia", linkedin: "https://www.linkedin.com/in/lucia" });

  const raw = JSON.stringify(view);
  for (const secret of [joven.email, joven.uid, "Colegio Santa Ana", "isAdmin", "createdAt"]) {
    assert.equal(raw.includes(secret), false, `la vista pública no debe contener ${secret}`);
  }

  const shared = await savePublicProfile(db, joven, { enabled: true, show: { school: true, bio: false, links: false, trajectory: false } }, now);
  const second = await getPublicProfileBySlug(db, shared.slug as string);
  assert.equal(second?.school, "Colegio Santa Ana");
  assert.equal(second?.bio, null);
  assert.equal(second?.links, null);
  assert.equal(second?.trajectory, null);
  assert.equal(shared.slug, mine.slug, "ajustar lo que se comparte no cambia la dirección");
});

test("desactivar equivale a no existir y reactivar recupera la misma dirección", async () => {
  const db = await personWithProfile();
  const mine = await savePublicProfile(db, joven, { enabled: true }, now);
  assert.ok(await getPublicProfileBySlug(db, mine.slug as string));

  const off = await savePublicProfile(db, joven, { enabled: false }, now);
  assert.equal(off.enabled, false);
  assert.equal(await getPublicProfileBySlug(db, mine.slug as string), null);
  assert.equal(await publicSlugOf(db, joven.uid), null);

  const again = await savePublicProfile(db, joven, { enabled: true }, now);
  assert.equal(again.slug, mine.slug);
  assert.ok(await getPublicProfileBySlug(db, mine.slug as string));
});

test("cambiar la dirección invalida la anterior", async () => {
  const db = await personWithProfile();
  const first = await savePublicProfile(db, joven, { enabled: true }, now);
  const rotated = await rotatePublicProfileLink(db, joven, now);
  assert.notEqual(rotated.slug, first.slug);
  assert.equal(rotated.enabled, true);
  assert.equal(await getPublicProfileBySlug(db, first.slug as string), null);
  assert.equal((await db.collection("publicProfiles").doc(first.slug as string).get()).exists, false);
  assert.ok(await getPublicProfileBySlug(db, rotated.slug as string));
});

test("una persona no puede tocar ni ver el perfil de otra", async () => {
  const db = await personWithProfile();
  await personWithProfile(otra, "Otra Persona");
  const mine = await savePublicProfile(db, joven, { enabled: true }, now);
  await savePublicProfile(db, otra, { enabled: true }, now);
  await savePublicProfile(db, otra, { enabled: false }, now);

  // Lo que la otra persona hace no afecta a la primera.
  assert.ok(await getPublicProfileBySlug(db, mine.slug as string));
  assert.equal((await getMyPublicProfile(db, otra)).enabled, false);
  assert.equal((await getMyPublicProfile(db, joven)).enabled, true);
  // La dirección de una no resuelve a la otra.
  assert.equal((await getPublicProfileBySlug(db, mine.slug as string))?.displayName, "Lucía Robles");
});

test("las direcciones inválidas se tratan como inexistentes", async () => {
  const db = await personWithProfile();
  for (const slug of ["", "x", "../users/joven-1", "LUCIA-ROBLES-K3X9Q2", "lucia robles", "a".repeat(80)]) {
    assert.equal(await getPublicProfileBySlug(db, slug), null, `debería ser null: ${JSON.stringify(slug)}`);
  }
});

test("la trayectoria pública incluye solo inscripciones aprobadas en lo publicado o concluido", async () => {
  const db = await personWithProfile();
  await seedParticipation(db, joven.uid, { key: "ok", title: "Copa Publicada" });
  await seedParticipation(db, joven.uid, { key: "hist", title: "Copa Histórica", experience: "closed", challenge: "closed" });
  await seedParticipation(db, joven.uid, { key: "pend", title: "Copa Pendiente", enrollment: "pending" });
  await seedParticipation(db, joven.uid, { key: "rech", title: "Copa Rechazada", enrollment: "rejected" });
  await seedParticipation(db, joven.uid, { key: "canc", title: "Copa Cancelada", enrollment: "cancelled" });
  await seedParticipation(db, joven.uid, { key: "borr", title: "Copa Borrador", experience: "draft" });
  await seedParticipation(db, joven.uid, { key: "ret", title: "Copa Reto Borrador", challenge: "draft" });
  // La participación de otra persona no aparece.
  await seedParticipation(db, otra.uid, { key: "otra", title: "Copa de Otra" });

  const mine = await savePublicProfile(db, joven, { enabled: true }, now);
  const view = await getPublicProfileBySlug(db, mine.slug as string);
  assert.deepEqual(view?.trajectory?.participations.map((item) => item.experienceTitle), ["Copa Histórica", "Copa Publicada"]);
  assert.equal(view?.trajectory?.participations.find((item) => item.experienceTitle === "Copa Histórica")?.concluded, true);
  assert.equal(JSON.stringify(view).includes("Copa de Otra"), false);
});

test("los reconocimientos aparecen solo si C3 publicó y autorizó mostrar ganadores", async () => {
  const db = await personWithProfile();
  const ok = await seedParticipation(db, joven.uid, { key: "uno" });
  const hidden = await seedParticipation(db, joven.uid, { key: "dos" });
  const draft = await seedParticipation(db, joven.uid, { key: "tres" });
  const submission = (challengeId: string) =>
    db.collection("submissions").doc(`${challengeId}__${joven.uid}`).set({ challengeId, userId: joven.uid, mode: "individual", status: "submitted", text: "x", links: [] });
  for (const item of [ok, hidden, draft]) await submission(item.challengeId);
  await db.collection("results").doc(ok.challengeId).set({ status: "published", showWinners: true, recognitions: { [`${ok.challengeId}__${joven.uid}`]: "ganador" } });
  await db.collection("results").doc(hidden.challengeId).set({ status: "published", showWinners: false, recognitions: { [`${hidden.challengeId}__${joven.uid}`]: "ganador" } });
  await db.collection("results").doc(draft.challengeId).set({ status: "draft", showWinners: true, recognitions: { [`${draft.challengeId}__${joven.uid}`]: "ganador" } });

  const mine = await savePublicProfile(db, joven, { enabled: true }, now);
  const view = await getPublicProfileBySlug(db, mine.slug as string);
  assert.deepEqual(view?.trajectory?.recognitions, [{ challengeId: ok.challengeId, challengeTitle: "Challenge uno", recognition: "Ganador" }]);
  // Nunca se publican promedios ni puestos.
  assert.equal(JSON.stringify(view).includes("average"), false);
});

test("quien no comparte su trayectoria no la expone aunque tenga participaciones", async () => {
  const db = await personWithProfile();
  await seedParticipation(db, joven.uid, { key: "uno" });
  const mine = await savePublicProfile(db, joven, { enabled: true, show: { trajectory: false } }, now);
  const view = await getPublicProfileBySlug(db, mine.slug as string);
  assert.equal(view?.trajectory, null);
  assert.equal(JSON.stringify(view).includes("Experiencia uno"), false);
});

test("el nombre de una persona ganadora enlaza a su perfil solo si lo activó", async () => {
  const db = await personWithProfile();
  await personWithProfile(otra, "Otra Persona");
  const { challengeId } = await seedParticipation(db, joven.uid, { key: "uno" });
  const submissions = db.collection("submissions");
  await submissions.doc(`${challengeId}__${joven.uid}`).set({ challengeId, userId: joven.uid, mode: "individual", status: "submitted", text: "x", links: [] });
  await submissions.doc(`${challengeId}__${otra.uid}`).set({ challengeId, userId: otra.uid, mode: "individual", status: "submitted", text: "x", links: [] });
  await submissions.doc(`${challengeId}__team__t1`).set({ challengeId, userId: joven.uid, mode: "team", status: "submitted", text: "x", links: [] });
  await db.collection("teams").doc("t1").set({ name: "Equipo Delta", memberIds: [joven.uid], experienceId: "exp-uno" });
  await db.collection("results").doc(challengeId).set({
    status: "published",
    showWinners: true,
    recognitions: { [`${challengeId}__${joven.uid}`]: "ganador", [`${challengeId}__${otra.uid}`]: "finalista", [`${challengeId}__team__t1`]: "mencion" },
  });

  const mine = await savePublicProfile(db, joven, { enabled: true }, now);
  const winners = await publicWinners(db, challengeId);
  const byName = Object.fromEntries(winners.map((winner) => [winner.name, winner.profileSlug]));
  assert.equal(byName["Lucía Robles"], mine.slug, "quien activó su perfil tiene enlace");
  assert.equal(byName["Otra Persona"], null, "quien no activó su perfil no tiene enlace");
  assert.equal(byName["Equipo Delta"], null, "un equipo nunca enlaza a un perfil personal");

  await savePublicProfile(db, joven, { enabled: false }, now);
  assert.equal((await publicWinners(db, challengeId)).find((winner) => winner.name === "Lucía Robles")?.profileSlug, null);
});
