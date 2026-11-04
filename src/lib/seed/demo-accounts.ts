/**
 * Cuentas demo de la plataforma (joven, empresa y administración) para el recorrido del ensayo.
 * La provisión es idempotente: crea las cuentas que faltan, asigna el permiso de administración y vincula la
 * representante a la organización demo. No cambia la contraseña de una cuenta que ya existe.
 * Las contraseñas nuevas se generan aquí y solo salen por `writeCredentials`, antes de crear las cuentas;
 * nunca se devuelven ni se registran. Con `apply: false` no se escribe nada.
 */
import { randomInt } from "node:crypto";
import { relative, resolve, sep, isAbsolute } from "node:path";
import type { Auth, UserRecord } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { ORGANIZATION_MEMBERS } from "../server/companies.ts";
import { USERS } from "../server/ids.ts";

export const DEMO_EMAIL_DOMAIN = "demo.c3.com.sv";
/**
 * Único proyecto remoto donde se admiten cuentas demo. Es el proyecto Firebase que ya existe en la cuenta del
 * responsable; la decisión de usarlo (3-nov-2026) es explícita y está registrada en AGENTS §15.
 */
export const DEMO_PROJECT = "c3-platform-demo";
/** Proyecto que usan los emuladores locales (AGENTS §9). */
export const EMULATOR_PROJECT = "demo-c3-platform";
const PROVISIONED_BY = "c3-demo-provision";

export type DemoRole = "participante" | "representante" | "administracion";

export interface DemoAccount {
  key: "joven" | "empresa" | "admin";
  /** UID fijo: el seed referencia estas cuentas (inscripción, entrega, vínculo) sin depender de un id generado. */
  uid: string;
  email: string;
  displayName: string;
  role: DemoRole;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { key: "joven", uid: "c3-demo-joven", email: `joven@${DEMO_EMAIL_DOMAIN}`, displayName: "Joven demostrativa", role: "participante" },
  { key: "empresa", uid: "c3-demo-empresa", email: `empresa@${DEMO_EMAIL_DOMAIN}`, displayName: "Representante demostrativa", role: "representante" },
  { key: "admin", uid: "c3-demo-admin", email: `admin@${DEMO_EMAIL_DOMAIN}`, displayName: "Administración demostrativa", role: "administracion" },
];

/** Lanza un error con motivo en español si el proyecto no es uno de los permitidos para cuentas demo. */
export function assertDemoProject(project: string | null | undefined, options: { emulator: boolean }): string {
  if (!project) throw new Error("Indicá --project con el ID del proyecto demo.");
  if (options.emulator) {
    if (project !== EMULATOR_PROJECT) throw new Error(`Con emuladores, el proyecto debe ser ${EMULATOR_PROJECT}.`);
    return project;
  }
  if (project !== DEMO_PROJECT) {
    throw new Error(`Solo se admite el proyecto demo ${DEMO_PROJECT}. Cualquier otro requiere una autorización nueva.`);
  }
  return project;
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!#%+-=?@";

function pick(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)];
}

/** Contraseña fuerte y aleatoria: al menos una mayúscula, una minúscula, una cifra y un símbolo. */
export function generateDemoPassword(length = 24): string {
  if (length < 16) throw new Error("La contraseña demo necesita al menos 16 caracteres.");
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) chars.push(pick(all));
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1);
    [chars[index], chars[other]] = [chars[other], chars[index]];
  }
  return chars.join("");
}

/** Verdadero si `candidate` no está dentro de `directory`. Sirve para impedir que las credenciales caigan en el repositorio. */
export function isOutsideDirectory(directory: string, candidate: string): boolean {
  const rel = relative(resolve(directory), resolve(candidate));
  if (rel === "") return false;
  return isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`);
}

export interface DemoAccountPlan {
  account: DemoAccount;
  action: "crear" | "existente";
}

export function planDemoAccounts(existingEmails: ReadonlySet<string>): DemoAccountPlan[] {
  return DEMO_ACCOUNTS.map((account) => ({ account, action: existingEmails.has(account.email) ? "existente" : "crear" }));
}

async function userByEmail(auth: Auth, email: string): Promise<UserRecord | null> {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if ((error as { code?: string })?.code === "auth/user-not-found") return null;
    throw error;
  }
}

export interface ProvisionOptions {
  db: Firestore;
  auth: Auth;
  organizationId: string;
  apply: boolean;
  now: Date;
  /** Recibe las contraseñas de las cuentas que se van a crear, antes de crearlas. Nunca se llama en dry-run. */
  writeCredentials: (credentials: { email: string; password: string }[]) => void;
  /** Solo para emulador: contraseña fija de prueba. En remoto se omite y la contraseña se genera al azar. */
  passwordFor?: () => string;
}

export interface ProvisionSummary {
  dryRun: boolean;
  plan: { email: string; action: "crear" | "existente"; uid: string | null; linked: boolean; claimPending: boolean }[];
  created: number;
}

/** Provisiona las cuentas demo. Es idempotente: una segunda ejecución no crea ni recambia nada. */
export async function provisionDemoAccounts(options: ProvisionOptions): Promise<ProvisionSummary> {
  const organization = await options.db.collection("organizations").doc(options.organizationId).get();
  if (!organization.exists) {
    throw new Error("Falta la organización demo: aplicá primero el seed (npm run seed:apply) y repetí la provisión.");
  }

  const existing = new Map<string, UserRecord>();
  for (const account of DEMO_ACCOUNTS) {
    const user = await userByEmail(options.auth, account.email);
    if (user) existing.set(account.email, user);
  }
  // Una cuenta con correo demo que no tiene el UID fijo no fue creada por esta provisión: no se le asigna nada.
  for (const [email, user] of existing) {
    const account = DEMO_ACCOUNTS.find((item) => item.email === email);
    if (account && user.uid !== account.uid) {
      throw new Error(`La cuenta ${email} existe con otro identificador. No se asigna a la demo: revisala en Auth antes de provisionar.`);
    }
  }
  const plan = planDemoAccounts(new Set(existing.keys()));

  const uids = new Map<string, string>();
  for (const [email, user] of existing) uids.set(email, user.uid);

  if (options.apply) {
    const toCreate = plan.filter((item) => item.action === "crear");
    const credentials = toCreate.map((item) => ({
      email: item.account.email,
      password: options.passwordFor ? options.passwordFor() : generateDemoPassword(),
    }));
    if (credentials.length > 0) options.writeCredentials(credentials);
    for (const credential of credentials) {
      const account = DEMO_ACCOUNTS.find((item) => item.email === credential.email);
      const user = await options.auth.createUser({
        uid: account?.uid,
        email: credential.email,
        password: credential.password,
        displayName: account?.displayName,
      });
      uids.set(credential.email, user.uid);
    }

    for (const { account, action } of plan) {
      const uid = uids.get(account.email);
      if (!uid) throw new Error(`No se obtuvo el identificador de ${account.key}.`);
      await options.db.collection(USERS).doc(uid).set({
        email: account.email,
        displayName: account.displayName,
        demo: true,
        updatedAt: options.now.toISOString(),
        ...(action === "crear" ? { createdAt: options.now.toISOString() } : {}),
      }, { merge: true });

      if (account.role === "administracion") {
        const current = (await options.auth.getUser(uid)).customClaims ?? {};
        if (current.c3Admin !== true) await options.auth.setCustomUserClaims(uid, { ...current, c3Admin: true });
      }
      if (account.role === "representante") {
        await options.db.collection(ORGANIZATION_MEMBERS).doc(`${options.organizationId}__${uid}`).set({
          organizationId: options.organizationId,
          userId: uid,
          email: account.email,
          role: "representante",
          createdAt: options.now.toISOString(),
          createdByUid: PROVISIONED_BY,
        }, { merge: true });
      }
    }
  }

  const summary: ProvisionSummary = {
    dryRun: !options.apply,
    plan: plan.map(({ account, action }) => {
      const user = existing.get(account.email);
      return {
        email: account.email,
        action,
        uid: uids.get(account.email) ?? null,
        linked: account.role === "representante",
        // En dry-run: el permiso de administración quedaría por asignar (cuenta nueva o sin claim).
        claimPending: !options.apply && account.role === "administracion" && (action === "crear" || user?.customClaims?.c3Admin !== true),
      };
    }),
    created: plan.filter((item) => item.action === "crear").length,
  };
  return summary;
}
