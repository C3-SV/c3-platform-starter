/**
 * Bitácora de operaciones administrativas sensibles (experiencias, challenges y revisión de inscripciones).
 * Cada entrada se escribe en la misma transacción o lote que el cambio, así nunca queda un cambio sin registro
 * ni un registro de un cambio que no ocurrió. Guarda identificadores y valores de calendario, nunca datos
 * personales (correo, nombre).
 */
import type { DocumentData, DocumentReference, Firestore } from "firebase-admin/firestore";
import { requireAdmin, type Actor } from "./auth.ts";
import { AUDIT_LOG } from "./ids.ts";

export interface AuditView {
  id: string;
  action: string;
  actorUid: string;
  targetType: string;
  targetId: string;
  at: string;
  details: Record<string, unknown>;
}

/** Últimas operaciones registradas, de la más reciente a la más antigua. Solo administración C3; no incluye datos personales. */
export async function listAudit(db: Firestore, actor: Actor, limit = 100): Promise<AuditView[]> {
  requireAdmin(actor);
  const snapshot = await db.collection(AUDIT_LOG).orderBy("at", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    action: String(doc.data().action ?? ""),
    actorUid: String(doc.data().actorUid ?? ""),
    targetType: String(doc.data().targetType ?? ""),
    targetId: String(doc.data().targetId ?? ""),
    at: String(doc.data().at ?? ""),
    details: (doc.data().details ?? {}) as Record<string, unknown>,
  }));
}

export type AuditTargetType = "experience" | "challenge" | "enrollment" | "submission" | "contactRequest";

export interface AuditEntry {
  action: string;
  target: { type: AuditTargetType; id: string };
  details?: Record<string, unknown>;
}

/** Lo único que se necesita de una transacción o un lote de escritura. */
interface Writer {
  set(ref: DocumentReference, data: DocumentData): unknown;
}

export function recordAudit(db: Firestore, writer: Writer, actor: Actor, at: Date, entry: AuditEntry): void {
  writer.set(db.collection(AUDIT_LOG).doc(), {
    action: entry.action,
    actorUid: actor.uid,
    targetType: entry.target.type,
    targetId: entry.target.id,
    at: at.toISOString(),
    details: entry.details ?? {},
  });
}
