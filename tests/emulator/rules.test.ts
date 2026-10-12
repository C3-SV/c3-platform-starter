import test, { after, before, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { PROJECT_ID } from "./support.ts";

let env: RulesTestEnvironment;

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host, port: Number(port), rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

after(async () => {
  await env.cleanup();
});

const collections = ["experiences", "challenges", "users", "enrollments", "submissions", "evaluations"];

test("visitante sin sesión no lee ninguna colección directa", async () => {
  const db = env.unauthenticatedContext().firestore();
  for (const name of collections) {
    await assertFails(db.collection(name).doc("x").get());
    await assertFails(db.collection(name).get());
  }
});

test("visitante sin sesión no escribe en ninguna colección", async () => {
  const db = env.unauthenticatedContext().firestore();
  for (const name of collections) {
    await assertFails(db.collection(name).doc("x").set({ title: "intento" }));
  }
});

test("usuario autenticado no lee ni escribe ni siquiera su propio perfil directamente", async () => {
  const db = env.authenticatedContext("joven-1", { email: "joven@correo.test" }).firestore();
  await assertFails(db.collection("users").doc("joven-1").get());
  await assertFails(db.collection("users").doc("joven-1").set({ displayName: "Cambio" }));
});

test("administrador con claim c3Admin tampoco escribe directo: pasa por el servidor", async () => {
  const db = env.authenticatedContext("admin-1", { c3Admin: true }).firestore();
  await assertFails(db.collection("experiences").doc("x").set({ status: "published" }));
  await assertFails(db.collection("challenges").doc("x").set({ status: "published" }));
});
