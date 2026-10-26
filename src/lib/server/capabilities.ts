/**
 * Capacidades de la cuenta autenticada: qué puede hacer además de participar. Sirve a `/api/me` para que la
 * interfaz muestre los accesos que corresponden (espacio de empresa, evaluación, administración).
 *
 * Solo devuelve datos PROPIOS: el uid sale del token verificado, nunca de un parámetro. La interfaz usa esto
 * para decidir qué enlaces mostrar; la autorización de cada ruta sigue haciéndola el servidor al actuar.
 */
import type { Firestore } from "firebase-admin/firestore";
import { NO_CAPABILITIES, type Capabilities, type OrganizationRef } from "../domain/capabilities.ts";
import type { Actor } from "./auth.ts";
import { ORGANIZATIONS } from "./catalog.ts";
import { ORGANIZATION_MEMBERS } from "./companies.ts";
import { JUDGE_ASSIGNMENTS } from "./evaluation.ts";

export async function getCapabilities(db: Firestore, actor: Actor): Promise<Capabilities> {
  const [memberships, assignments] = await Promise.all([
    db.collection(ORGANIZATION_MEMBERS).where("userId", "==", actor.uid).get(),
    db.collection(JUDGE_ASSIGNMENTS).where("userId", "==", actor.uid).get(),
  ]);

  const organizationIds = [...new Set(memberships.docs.map((doc) => doc.data().organizationId as string))];
  const organizations = (await Promise.all(organizationIds.map((id) => db.collection(ORGANIZATIONS).doc(id).get())))
    .flatMap((snapshot): OrganizationRef[] => (snapshot.exists ? [{ id: snapshot.id, name: String(snapshot.data()?.name ?? "") }] : []))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Una asignación revocada no cuenta: ya no da acceso a evaluar.
  const challenges = assignments.docs.filter((doc) => doc.data().status === "active").length;

  return { ...NO_CAPABILITIES, admin: actor.isAdmin, organizations, judge: { challenges } };
}
