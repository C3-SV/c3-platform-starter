/**
 * Propuestas de empresa (Corte 4). Entrada pública sin cuenta, con validación en servidor,
 * campo trampa y límite por conexión. C3 revisa; la empresa solo ve sus propias propuestas vinculadas.
 */
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { isHoneypotFilled, parseProposalInput, parseReviewInput, type ProposalStatus } from "../domain/proposals.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { ORGANIZATIONS } from "./catalog.ts";
import { HttpError, notFound } from "./errors.ts";

export const PROPOSALS = "companyProposals";
export const RATE_LIMITS = "rateLimits";
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export interface ProposalView {
  id: string;
  reference: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  problem: string;
  desiredOutcome: string;
  constraints: string;
  status: ProposalStatus;
  reviewNote: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function referenceOf(id: string): string {
  return id.slice(0, 6).toUpperCase();
}

export function toProposalView(id: string, data: DocumentData): ProposalView {
  return {
    id,
    reference: referenceOf(id),
    companyName: data.companyName,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    problem: data.problem,
    desiredOutcome: data.desiredOutcome ?? "",
    constraints: data.constraints ?? "",
    status: data.status,
    reviewNote: data.reviewNote ?? null,
    organizationId: data.organizationId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Recibe una propuesta pública. Si el campo trampa tiene texto, responde como si la hubiera guardado
 * pero no escribe nada. El límite por conexión usa solo la clave recibida (un hash, nunca la IP en claro).
 */
export async function submitProposal(db: Firestore, rawInput: unknown, clientKey: string, now: Date): Promise<{ reference: string; stored: boolean }> {
  const raw = typeof rawInput === "object" && rawInput !== null ? (rawInput as Record<string, unknown>) : {};
  if (isHoneypotFilled(raw)) return { reference: "", stored: false };

  const input = parseProposalInput(raw);
  const bucket = db.collection(RATE_LIMITS).doc(clientKey);
  const ref = db.collection(PROPOSALS).doc();
  const stamp = now.toISOString();

  await db.runTransaction(async (transaction) => {
    const current = (await transaction.get(bucket)).data();
    const expired = !current || now.getTime() - Date.parse(current.windowStart) >= RATE_LIMIT_WINDOW_MS;
    const count = expired ? 0 : (current?.count ?? 0);
    if (count >= RATE_LIMIT_MAX) {
      throw new HttpError(429, "demasiados_intentos", "Recibimos varias propuestas desde tu conexión. Esperá un rato e intentá de nuevo.");
    }
    transaction.set(bucket, { count: count + 1, windowStart: expired ? stamp : current?.windowStart });
    transaction.set(ref, {
      ...input,
      status: "received" as ProposalStatus,
      reviewNote: null,
      organizationId: null,
      createdAt: stamp,
      updatedAt: stamp,
    });
  });
  return { reference: referenceOf(ref.id), stored: true };
}

/** Propuestas para la revisión de C3, de la más reciente a la más antigua. */
export async function listProposals(db: Firestore, actor: Actor): Promise<ProposalView[]> {
  requireAdmin(actor);
  const snapshot = await db.collection(PROPOSALS).get();
  return snapshot.docs
    .map((doc) => toProposalView(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** C3 pide ajustes, acepta o no prioriza. Aceptar puede vincular la organización. Solo administradores. */
export async function reviewProposal(db: Firestore, actor: Actor, id: string, rawInput: unknown, now: Date): Promise<ProposalView> {
  requireAdmin(actor);
  const review = parseReviewInput(rawInput);
  const ref = db.collection(PROPOSALS).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw notFound("La propuesta no existe.");
  if (review.organizationId) {
    const organization = await db.collection(ORGANIZATIONS).doc(review.organizationId).get();
    if (!organization.exists) throw notFound("La organización no existe.");
  }
  const organizationId = review.organizationId ?? snapshot.data()?.organizationId ?? null;
  await ref.update({
    status: review.status,
    reviewNote: review.note || null,
    organizationId,
    updatedAt: now.toISOString(),
  });
  return toProposalView(id, (await ref.get()).data() ?? {});
}
