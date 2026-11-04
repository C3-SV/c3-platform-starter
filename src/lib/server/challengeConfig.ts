/**
 * Configuración del challenge por quien lo administra (E3). Puede editarla la representante vinculada a la empresa del
 * challenge y C3. Hoy no se distingue un rol de jurado: una representante que además es jurado también puede (decisión
 * del responsable, 4-nov-2026, pendiente de afinar). Solo con el challenge publicado y antes del cierre de entregas.
 * La rúbrica se bloquea cuando ya hay entregas: cambiarla alteraría lo que las personas ya entregaron.
 */
import type { Firestore } from "firebase-admin/firestore";
import type { RubricCriterion } from "../domain/types.ts";
import { parseChallengeInput } from "../domain/validation.ts";
import { recordAudit } from "./audit.ts";
import type { Actor } from "./auth.ts";
import { CHALLENGES, loadChallenge } from "./catalog.ts";
import { HttpError } from "./errors.ts";
import { SUBMISSIONS } from "./ids.ts";
import { requireCompanyChallenge } from "./talent.ts";

export interface ChallengeConfigView {
  id: string;
  title: string;
  summary: string;
  problem: string;
  deliverables: string[];
  rubric: RubricCriterion[];
  submissionClosesAt: string | null;
  /** La rúbrica ya no se puede cambiar porque hay entregas. */
  rubricLocked: boolean;
}

async function hasSubmissions(db: Firestore, challengeId: string): Promise<boolean> {
  return !(await db.collection(SUBMISSIONS).where("challengeId", "==", challengeId).limit(1).get()).empty;
}

function viewOf(challenge: Awaited<ReturnType<typeof loadChallenge>>, rubricLocked: boolean): ChallengeConfigView {
  return {
    id: challenge.id,
    title: challenge.title,
    summary: challenge.summary,
    problem: challenge.problem,
    deliverables: challenge.deliverables,
    rubric: challenge.rubric,
    submissionClosesAt: challenge.submissionClosesAt,
    rubricLocked,
  };
}

/** Forma comparable de una rúbrica: etiqueta, máximo y peso. Sirve para saber si una edición la cambia. */
function plainRubric(value: unknown): string {
  const items = Array.isArray(value) ? value : [];
  return JSON.stringify(items.map((item) => {
    const row = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const weight = row.weight === undefined || row.weight === null || row.weight === "" ? null : Number(row.weight);
    return { label: typeof row.label === "string" ? row.label.trim() : "", maxScore: Number(row.maxScore), weight };
  }));
}

export async function getChallengeConfig(db: Firestore, actor: Actor, challengeId: string): Promise<ChallengeConfigView> {
  const challenge = await requireCompanyChallenge(db, actor, challengeId);
  return viewOf(challenge, await hasSubmissions(db, challengeId));
}

export async function updateChallengeConfig(db: Firestore, actor: Actor, challengeId: string, rawBody: unknown, now: Date): Promise<ChallengeConfigView> {
  const challenge = await requireCompanyChallenge(db, actor, challengeId);
  if (challenge.status !== "published") {
    throw new HttpError(409, "reto_concluido", "El challenge ya concluyó: su configuración ya no se puede modificar.");
  }
  if (challenge.submissionClosesAt && Date.parse(challenge.submissionClosesAt) <= now.getTime()) {
    throw new HttpError(409, "plazo_cerrado", "Las entregas ya cerraron: la configuración ya no se puede modificar.");
  }
  const body = (typeof rawBody === "object" && rawBody !== null ? rawBody : {}) as Record<string, unknown>;
  const current = challenge.rubric.map((criterion) => ({ label: criterion.label, maxScore: criterion.maxScore, weight: criterion.weight ?? null }));
  const locked = await hasSubmissions(db, challengeId);
  if (locked && body.rubric !== undefined && plainRubric(body.rubric) !== plainRubric(current)) {
    throw new HttpError(409, "rubrica_bloqueada", "La rúbrica ya no se puede cambiar: hay entregas enviadas o en borrador.");
  }

  // Se valida con las mismas reglas que la creación del challenge; lo que no se edita se conserva.
  const input = parseChallengeInput({
    experienceId: challenge.experienceId,
    organizationId: challenge.organizationId,
    title: challenge.title,
    organizationName: challenge.organizationName,
    commercialPackage: challenge.commercialPackage ?? null,
    allows: challenge.allows,
    teamMinSize: challenge.teamMinSize,
    teamMaxSize: challenge.teamMaxSize,
    summary: body.summary ?? challenge.summary,
    problem: body.problem ?? challenge.problem,
    deliverables: body.deliverables ?? challenge.deliverables,
    rubric: body.rubric ?? current,
    submissionClosesAt: body.submissionClosesAt ?? challenge.submissionClosesAt,
  }, now);

  const batch = db.batch();
  batch.update(db.collection(CHALLENGES).doc(challengeId), {
    summary: input.summary,
    problem: input.problem,
    deliverables: input.deliverables,
    rubric: input.rubric.map((criterion, index) => ({
      id: `c${index + 1}`,
      label: criterion.label,
      maxScore: criterion.maxScore,
      ...(criterion.weight === null ? {} : { weight: criterion.weight }),
    })),
    submissionClosesAt: input.submissionClosesAt,
    updatedAt: now.toISOString(),
  });
  recordAudit(db, batch, actor, now, {
    action: "challenge.configurar",
    target: { type: "challenge", id: challengeId },
    details: { campos: Object.keys(body).filter((key) => ["summary", "problem", "deliverables", "rubric", "submissionClosesAt"].includes(key)) },
  });
  await batch.commit();
  return viewOf(await loadChallenge(db, challengeId), locked);
}
