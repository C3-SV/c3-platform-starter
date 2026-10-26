import test from "node:test";
import assert from "node:assert/strict";
import { ValidationFailure } from "../../src/lib/domain/validation.ts";
import {
  DEFAULT_SHOW,
  NO_PUBLIC_PROFILE,
  buildPublicView,
  generateSlug,
  isValidSlug,
  parsePublicProfileInput,
  publicProfilePath,
  settingsFromStored,
  slugBase,
  type PublicProfileSource,
} from "../../src/lib/domain/public-profile.ts";

const source: PublicProfileSource = {
  slug: "lucia-robles-k3x9q2",
  displayName: "  Lucía Robles  ",
  school: "UCA",
  bio: "Me interesan los challenges de backend.",
  github: "https://github.com/lucia",
  linkedin: "",
  show: { school: true, bio: true, links: true, trajectory: true },
  participations: [{ experienceId: "e1", experienceTitle: "Copa", challengeId: "c1", challengeTitle: "Ruteo", line: "compite", concluded: false }],
  recognitions: [{ challengeId: "c1", challengeTitle: "Ruteo", recognition: "Ganador" }],
};

test("por defecto el perfil es privado y el centro de estudio empieza oculto", () => {
  assert.equal(NO_PUBLIC_PROFILE.enabled, false);
  assert.equal(NO_PUBLIC_PROFILE.slug, null);
  assert.equal(DEFAULT_SHOW.school, false);
  assert.deepEqual(settingsFromStored(undefined), NO_PUBLIC_PROFILE);
  assert.deepEqual(settingsFromStored("activo"), NO_PUBLIC_PROFILE);
});

test("sin una dirección válida no hay perfil público, aunque el documento diga «activo»", () => {
  assert.equal(settingsFromStored({ enabled: true, slug: null, show: {} }).enabled, false);
  assert.equal(settingsFromStored({ enabled: true, slug: "../admin", show: {} }).enabled, false);
  assert.equal(settingsFromStored({ enabled: true, slug: "lucia-robles-k3x9q2", show: { bio: true } }).enabled, true);
  // Un valor guardado que no sea exactamente `true` no comparte nada.
  assert.deepEqual(settingsFromStored({ enabled: true, slug: "lucia-robles-k3x9q2", show: { bio: "yes", school: 1 } }).show, { school: false, bio: false, links: false, trajectory: false });
});

test("la entrada de la persona solo acepta booleanos conocidos", () => {
  assert.deepEqual(parsePublicProfileInput({ enabled: true, show: { bio: false } }), { enabled: true, show: { school: false, bio: false, links: true, trajectory: true } });
  assert.deepEqual(parsePublicProfileInput({ enabled: false, show: { school: true }, otro: "x" }), { enabled: false, show: { ...DEFAULT_SHOW, school: true } });
  assert.throws(() => parsePublicProfileInput({}), ValidationFailure);
  assert.throws(() => parsePublicProfileInput({ enabled: "true" }), ValidationFailure);
  assert.throws(() => parsePublicProfileInput({ enabled: true, show: { bio: "sí" } }), ValidationFailure);
  assert.throws(() => parsePublicProfileInput(null), ValidationFailure);
});

test("la dirección legible sale del nombre sin tildes ni símbolos y con sufijo aleatorio", () => {
  assert.equal(slugBase("Lucía Robles de Prueba"), "lucia-robles-de-prueba".slice(0, 24).replace(/-+$/g, ""));
  assert.equal(slugBase("¡¡¡"), "persona");
  assert.equal(slugBase("  Ñandú   Pérez "), "nandu-perez");
  let calls = 0;
  const slug = generateSlug("Ana Pérez", (max) => (calls++) % max);
  assert.match(slug, /^ana-perez-[a-z0-9]{6}$/);
  assert.equal(isValidSlug(slug), true);
  assert.equal(publicProfilePath(slug), `/personas/${slug}`);
});

test("solo son válidas las direcciones con minúsculas, números y guiones", () => {
  for (const bad of ["", "abc", "Lucia-Robles-k3x9q2", "lucia robles", "lucia/robles", "../x", "a".repeat(49), "-lucia-robles", "lucia--robles"]) {
    assert.equal(isValidSlug(bad), false, `debería rechazar ${JSON.stringify(bad)}`);
  }
});

test("la vista pública incluye solo lo que la persona eligió mostrar", () => {
  const all = buildPublicView(source);
  assert.equal(all.displayName, "Lucía Robles");
  assert.equal(all.school, "UCA");
  assert.equal(all.bio, "Me interesan los challenges de backend.");
  assert.deepEqual(all.links, { github: "https://github.com/lucia", linkedin: null });
  assert.equal(all.trajectory?.participations.length, 1);
  assert.equal(all.trajectory?.recognitions[0].recognition, "Ganador");

  const minimal = buildPublicView({ ...source, show: { school: false, bio: false, links: false, trajectory: false } });
  assert.deepEqual(minimal, { slug: source.slug, displayName: "Lucía Robles", school: null, bio: null, links: null, trajectory: null });
});

test("un dato vacío no se muestra aunque esté permitido", () => {
  const view = buildPublicView({ ...source, school: "  ", bio: "", github: "", linkedin: "" });
  assert.equal(view.school, null);
  assert.equal(view.bio, null);
  assert.equal(view.links, null);
});

test("la vista pública nunca contiene correo, identificadores internos ni notas", () => {
  const dirty = { ...source, email: "lucia@correo.test", uid: "uid-secreto", notas: "interno" } as PublicProfileSource;
  const serialized = JSON.stringify(buildPublicView(dirty));
  for (const secret of ["lucia@correo.test", "uid-secreto", "interno", "email", "uid"]) {
    assert.equal(serialized.includes(secret), false, `no debería filtrar ${secret}`);
  }
});
