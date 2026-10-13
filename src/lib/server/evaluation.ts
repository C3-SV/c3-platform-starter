/**
 * Jurados, evaluaciones, consolidación y publicación oficial (Corte 5).
 * Un jurado —externo o representante autorizado por C3— evalúa solo las soluciones de sus retos asignados,
 * sin ver quién las entregó y solo cuando cierran las entregas. C3 publica; nada se publica solo.
 */
import type { Auth } from "firebase-admin/auth";
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import {
  consolidatedAverage,
  maxTotal,
  parseRecognition,
  parseScores,
  RECOGNITION_LABEL,
  solutionReady,
  totalOf,
  type Recognition,
} from "../domain/evaluation.ts";
import { ValidationFailure } from "../domain/validation.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { loadChallenge } from "./catalog.ts";
import { HttpError, notFound } from "./errors.ts";
import { SUBMISSIONS, TEAMS, USERS } from "./ids.ts";

export const JUDGE_ASSIGNMENTS = "judgeAssignments";
export const EVALUATIONS = "evaluations";
export const RESULTS = "results";
export const JUDGE_KINDS = ["empresa", "externo"] as const;
export type JudgeKind = (typeof JUDGE_KINDS)[number];

export function assignmentDocId(challengeId: string, userId: string): string {
  return `${challengeId}__${userId}`;
}

export function evaluationDocId(submissionId: string, judgeUid: string): string {
  return `${submissionId}__${judgeUid}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubmissionRow {
  id: string;
  challengeId: string;
  text: string;
  links: string[];
  submittedAt: string | null;
  mode: "individual" | "team";
  userId: string;
}

async function submittedSubmissions(db: Firestore, challengeId: string): Promise<SubmissionRow[]> {
  const snapshot = await db.collection(SUBMISSIONS).where("challengeId", "==", challengeId).where("status", "==", "submitted").get();
  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        challengeId,
        text: data.text ?? "",
        links: data.links ?? [],
        submittedAt: data.submittedAt ?? null,
        mode: data.mode === "team" ? "team" : "individual",
        userId: data.userId,
      } satisfies SubmissionRow;
    })
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "") || a.id.localeCompare(b.id));
}

/** Nombre real de la solución (equipo o persona). Solo lo ven C3 y, en la publicación, quien corresponda. */
async function nameOf(db: Firestore, submission: SubmissionRow): Promise<string | null> {
  if (submission.mode === "team") {
    const teamId = submission.id.split("__team__")[1];
    return ((await db.collection(TEAMS).doc(teamId).get()).data()?.name as string | undefined) ?? null;
  }
  return ((await db.collection(USERS).doc(submission.userId).get()).data()?.displayName as string | undefined) ?? null;
}

async function activeAssignment(db: Firestore, challengeId: string, uid: string): Promise<DocumentData | null> {
  const snapshot = await db.collection(JUDGE_ASSIGNMENTS).doc(assignmentDocId(challengeId, uid)).get();
  const data = snapshot.data();
  return data && data.status === "active" ? data : null;
}

/** Asigna un jurado a un reto por correo. La cuenta debe existir. Solo C3. */
export async function assignJudge(db: Firestore, auth: Auth, actor: Actor, challengeId: string, rawEmail: unknown, rawKind: unknown, now: Date): Promise<void> {
  requireAdmin(actor);
  const challenge = await loadChallenge(db, challengeId);
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) throw new ValidationFailure([{ field: "email", message: "Revisá el formato del correo." }]);
  if (!(JUDGE_KINDS as readonly unknown[]).includes(rawKind)) {
    throw new ValidationFailure([{ field: "kind", message: "Elegí si el jurado es externo o representante de la empresa." }]);
  }
  const user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) throw notFound("No encontramos una cuenta con ese correo. La persona debe registrarse primero.");
  await db.collection(JUDGE_ASSIGNMENTS).doc(assignmentDocId(challenge.id, user.uid)).set({
    challengeId: challenge.id,
    experienceId: challenge.experienceId,
    userId: user.uid,
    email,
    kind: rawKind,
    status: "active",
    assignedAt: now.toISOString(),
    assignedByUid: actor.uid,
    revokedAt: null,
  });
}

export interface JudgeRow {
  id: string;
  userId: string;
  email: string | null;
  kind: JudgeKind;
  status: "active" | "revoked";
}

export async function listJudges(db: Firestore, actor: Actor, challengeId: string): Promise<JudgeRow[]> {
  requireAdmin(actor);
  const snapshot = await db.collection(JUDGE_ASSIGNMENTS).where("challengeId", "==", challengeId).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    userId: doc.data().userId,
    email: doc.data().email ?? null,
    kind: doc.data().kind,
    status: doc.data().status,
  }));
}

/** Revoca el acceso de un jurado. Sus evaluaciones ya finalizadas se conservan. */
export async function revokeJudge(db: Firestore, actor: Actor, assignmentId: string, now: Date): Promise<void> {
  requireAdmin(actor);
  const ref = db.collection(JUDGE_ASSIGNMENTS).doc(assignmentId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw notFound("La asignación no existe.");
  await ref.update({ status: "revoked", revokedAt: now.toISOString() });
}

/** Retos asignados a la persona autenticada, con su avance de evaluación. */
export async function myAssignments(db: Firestore, actor: Actor, now: Date) {
  const snapshot = await db.collection(JUDGE_ASSIGNMENTS).where("userId", "==", actor.uid).get();
  const active = snapshot.docs.filter((doc) => doc.data().status === "active");
  return Promise.all(active.map(async (doc) => {
    const data = doc.data();
    const challenge = await loadChallenge(db, data.challengeId).catch(() => null);
    const solutions = challenge ? await submittedSubmissions(db, challenge.id) : [];
    const evaluations = await db.collection(EVALUATIONS).where("challengeId", "==", data.challengeId).where("judgeUserId", "==", actor.uid).get();
    const finalized = evaluations.docs.filter((item) => item.data().status === "finalized").length;
    return {
      challengeId: data.challengeId,
      title: challenge?.title ?? "Reto",
      kind: data.kind as JudgeKind,
      canEvaluate: challenge ? now.getTime() >= Date.parse(challenge.submissionClosesAt ?? "9999-01-01") : false,
      solutions: solutions.length,
      finalized,
    };
  }));
}

/** Espacio de evaluación: soluciones anónimas del reto, rúbrica y mis evaluaciones. Solo jurados asignados. */
export async function evaluationWorkspace(db: Firestore, actor: Actor, challengeId: string, now: Date) {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published") throw notFound();
  const assignment = await activeAssignment(db, challengeId, actor.uid);
  if (!assignment) throw new HttpError(403, "sin_asignacion", "No tenés asignado este reto como jurado.");
  const canEvaluate = challenge.submissionClosesAt !== null && now.getTime() >= Date.parse(challenge.submissionClosesAt);
  const solutions = await submittedSubmissions(db, challengeId);
  const mine = await db.collection(EVALUATIONS).where("challengeId", "==", challengeId).where("judgeUserId", "==", actor.uid).get();
  const byId = new Map(mine.docs.map((doc) => [doc.data().submissionId as string, doc.data()]));
  return {
    challenge: { id: challenge.id, title: challenge.title, rubric: challenge.rubric, submissionClosesAt: challenge.submissionClosesAt },
    kind: assignment.kind as JudgeKind,
    canEvaluate,
    maxTotal: maxTotal(challenge.rubric),
    solutions: solutions.map((solution, index) => {
      const evaluation = byId.get(solution.id);
      return {
        // Alias estable: el id real de la solución lleva el uid de quien la entregó.
        id: solutionAlias(index),
        label: `Solución ${index + 1}`,
        text: solution.text,
        links: solution.links,
        mine: evaluation
          ? { scores: evaluation.scores as Record<string, number>, total: evaluation.total as number, status: evaluation.status as "draft" | "finalized" }
          : null,
      };
    }),
  };
}

/** Alias público de una solución dentro de su reto: «s1», «s2»… según el orden de envío (estable tras el cierre). */
export function solutionAlias(index: number): string {
  return `s${index + 1}`;
}

/** Guarda o finaliza mi evaluación de una solución. Una evaluación finalizada ya no cambia. */
export async function saveEvaluation(db: Firestore, actor: Actor, challengeId: string, alias: string, rawBody: unknown, now: Date): Promise<void> {
  const body = typeof rawBody === "object" && rawBody !== null ? (rawBody as Record<string, unknown>) : {};
  const challenge = await loadChallenge(db, challengeId);
  const position = /^s(\d+)$/.exec(alias)?.[1];
  const solutions = await submittedSubmissions(db, challengeId);
  const target = position ? solutions[Number(position) - 1] : undefined;
  if (!target) throw notFound("La solución no existe o todavía no fue enviada.");
  const submissionId = target.id;
  if (challenge.status !== "published") throw notFound();
  const assignment = await activeAssignment(db, challengeId, actor.uid);
  if (!assignment) throw new HttpError(403, "sin_asignacion", "No tenés asignado este reto como jurado.");
  if (challenge.submissionClosesAt === null || now.getTime() < Date.parse(challenge.submissionClosesAt)) {
    throw new HttpError(409, "entregas_abiertas", "Todavía no se puede evaluar: las entregas siguen abiertas.");
  }

  const ref = db.collection(EVALUATIONS).doc(evaluationDocId(submissionId, actor.uid));
  const existing = (await ref.get()).data();
  if (existing?.status === "finalized") throw new HttpError(409, "ya_finalizada", "Esta evaluación ya está finalizada.");
  const scores = parseScores(body.scores, challenge.rubric);
  const finalize = body.finalize === true;
  const stamp = now.toISOString();
  await ref.set({
    submissionId,
    challengeId,
    judgeUserId: actor.uid,
    kind: assignment.kind,
    scores,
    total: totalOf(scores),
    status: finalize ? "finalized" : "draft",
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
    finalizedAt: finalize ? stamp : null,
  });
}

export interface BoardRow {
  submissionId: string;
  label: string;
  name: string | null;
  finalizedJudges: number;
  average: number | null;
  recognition: Recognition | null;
  evaluations: { judgeUid: string; kind: string; total: number; status: string }[];
}

export interface ResultsBoard {
  challengeId: string;
  title: string;
  maxTotal: number;
  status: "draft" | "published";
  showWinners: boolean;
  showScores: boolean;
  canPublish: boolean;
  blockedReason: string | null;
  rows: BoardRow[];
}

async function resultsDoc(db: Firestore, challengeId: string): Promise<DocumentData> {
  return (await db.collection(RESULTS).doc(challengeId).get()).data() ?? {};
}

/** Tablero interno: soluciones, evaluaciones finalizadas, promedio y condición de publicación. Sin autorización: lo usan las lecturas ya filtradas. */
async function boardFor(db: Firestore, challengeId: string): Promise<ResultsBoard> {
  const challenge = await loadChallenge(db, challengeId);
  const solutions = await submittedSubmissions(db, challengeId);
  const evaluations = await db.collection(EVALUATIONS).where("challengeId", "==", challengeId).get();
  const results = await resultsDoc(db, challengeId);
  const recognitions = (results.recognitions ?? {}) as Record<string, Recognition>;

  const rows: BoardRow[] = [];
  for (const [index, solution] of solutions.entries()) {
    const mine = evaluations.docs.filter((doc) => doc.data().submissionId === solution.id);
    const finalized = mine.filter((doc) => doc.data().status === "finalized");
    rows.push({
      submissionId: solution.id,
      label: `Solución ${index + 1}`,
      name: await nameOf(db, solution),
      finalizedJudges: new Set(finalized.map((doc) => doc.data().judgeUserId)).size,
      average: consolidatedAverage(finalized.map((doc) => doc.data().total as number)),
      recognition: recognitions[solution.id] ?? null,
      evaluations: mine.map((doc) => ({
        judgeUid: doc.data().judgeUserId,
        kind: doc.data().kind ?? "externo",
        total: doc.data().total as number,
        status: doc.data().status as string,
      })),
    });
  }

  const notReady = rows.filter((row) => !solutionReady(row.finalizedJudges)).length;
  const blockedReason = rows.length === 0
    ? "Todavía no hay soluciones enviadas para publicar."
    : notReady > 0
      ? `Solo ${rows.length - notReady} de ${rows.length} soluciones tienen las dos evaluaciones finalizadas.`
      : null;

  return {
    challengeId,
    title: challenge.title,
    maxTotal: maxTotal(challenge.rubric),
    status: (results.status as "draft" | "published" | undefined) ?? "draft",
    showWinners: results.showWinners !== false,
    showScores: results.showScores === true,
    canPublish: blockedReason === null,
    blockedReason,
    rows,
  };
}

/** Tablero de C3. Solo administradores. */
export async function resultsBoard(db: Firestore, actor: Actor, challengeId: string): Promise<ResultsBoard> {
  requireAdmin(actor);
  return boardFor(db, challengeId);
}

/** Reconocimiento (ganador, finalista, mención) o ninguno. Solo antes de publicar. */
export async function setRecognition(db: Firestore, actor: Actor, challengeId: string, submissionId: string, rawRecognition: unknown): Promise<void> {
  requireAdmin(actor);
  const recognition = parseRecognition(rawRecognition);
  const current = await resultsDoc(db, challengeId);
  if (current.status === "published") throw new HttpError(409, "ya_publicado", "Los resultados ya están publicados.");
  const ref = db.collection(RESULTS).doc(challengeId);
  await ref.set({ challengeId, status: "draft", recognitions: { [submissionId]: recognition } }, { merge: true });
}

/** Publicación oficial por C3. Bloqueada hasta que cada solución tenga dos evaluaciones finalizadas. */
export async function publishResults(db: Firestore, actor: Actor, challengeId: string, rawInput: unknown, now: Date): Promise<void> {
  requireAdmin(actor);
  const board = await resultsBoard(db, actor, challengeId);
  if (board.status === "published") throw new HttpError(409, "ya_publicado", "Los resultados ya están publicados.");
  if (!board.canPublish) throw new HttpError(409, "publicacion_bloqueada", board.blockedReason ?? "No se puede publicar todavía.");
  const input = typeof rawInput === "object" && rawInput !== null ? (rawInput as Record<string, unknown>) : {};
  const stamp = now.toISOString();
  await db.collection(RESULTS).doc(challengeId).set({
    challengeId,
    status: "published",
    showWinners: input.showWinners !== false,
    showScores: input.showScores === true,
    publishedAt: stamp,
    publishedByUid: actor.uid,
  }, { merge: true });
}

/** Resultado de una solución para su equipo o persona, solo cuando C3 publicó. */
export async function resultForSubmission(db: Firestore, challengeId: string, submissionId: string | null) {
  if (!submissionId) return null;
  const results = await resultsDoc(db, challengeId);
  if (results.status !== "published") return null;
  const board = await boardFor(db, challengeId);
  const row = board.rows.find((item) => item.submissionId === submissionId);
  if (!row) return null;
  const ranked = [...board.rows].filter((item) => item.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  const place = row.average === null ? null : ranked.findIndex((item) => item.submissionId === submissionId) + 1;
  return {
    recognition: row.recognition ? RECOGNITION_LABEL[row.recognition] : null,
    average: results.showScores ? row.average : null,
    place: results.showScores ? place : null,
    of: results.showScores ? ranked.length : null,
  };
}

/** Ganadores públicos del reto, si C3 publicó y autorizó mostrarlos. */
export async function publicWinners(db: Firestore, challengeId: string): Promise<{ name: string | null; recognition: string }[]> {
  const results = await resultsDoc(db, challengeId);
  if (results.status !== "published" || results.showWinners === false) return [];
  const recognitions = (results.recognitions ?? {}) as Record<string, Recognition>;
  const winners: { name: string | null; recognition: string }[] = [];
  for (const [submissionId, recognition] of Object.entries(recognitions)) {
    if (!recognition) continue;
    const submission = await db.collection(SUBMISSIONS).doc(submissionId).get();
    if (!submission.exists || submission.data()?.status !== "submitted") continue;
    const row: SubmissionRow = {
      id: submissionId,
      challengeId,
      text: "",
      links: [],
      submittedAt: null,
      mode: submission.data()?.mode === "team" ? "team" : "individual",
      userId: submission.data()?.userId,
    };
    winners.push({ name: await nameOf(db, row), recognition: RECOGNITION_LABEL[recognition] });
  }
  return winners;
}

/** Vista de la publicación para las empresas vinculadas: promedios solo si C3 los autorizó. */
export async function companyResults(db: Firestore, challengeId: string) {
  const results = await resultsDoc(db, challengeId);
  if (results.status !== "published") return null;
  const board = await boardFor(db, challengeId);
  return {
    showScores: results.showScores === true,
    rows: board.rows.map((row) => ({
      label: row.label,
      recognition: row.recognition ? RECOGNITION_LABEL[row.recognition] : null,
      average: results.showScores ? row.average : null,
    })),
  };
}

