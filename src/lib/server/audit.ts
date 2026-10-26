/**
 * Bitácora de operaciones administrativas sensibles (experiencias, challenges y revisión de inscripciones).
 * Cada entrada se escribe en la misma transacción o lote que el cambio, así nunca queda un cambio sin registro
 * ni un registro de un cambio que no ocurrió. Guarda identificadores y valores de calendario, nunca datos
 * personales (correo, nombre).
 */
import type { DocumentData, DocumentReference, Firestore } from "firebase-admin/firestore";
import type { Actor } from "./auth.ts";
import { AUDIT_LOG } from "./ids.ts";

export type AuditTargetType = "experience" | "challenge" | "enrollment";

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
