/**
 * Jurados, evaluaciones, consolidación y publicación oficial (Corte 5).
 * Un jurado —externo o representante autorizado por C3— evalúa las soluciones de sus challenges asignados desde que
 * el challenge está publicado, aunque las entregas sigan abiertas. C3 publica después del cierre; nada se publica solo.
 */
import type { Auth } from "firebase-admin/auth";
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import {
  consolidatedAverage,
  criterionAverages,
  maxTotal,
  parseRecognition,
  parseScores,
  RECOGNITION_LABEL,
  scoreOf,
  solutionReady,
  type Recognition,
} from "../domain/evaluation.ts";
import { ValidationFailure } from "../domain/validation.ts";
import { requireAdmin, type Actor } from "./auth.ts";
import { loadChallenge, loadExperience } from "./catalog.ts";
import { HttpError, notFound } from "./errors.ts";
import { RESULTS, SUBMISSIONS, TEAMS, USERS } from "./ids.ts";
import { publicSlugOf } from "./publicProfiles.ts";

export const JUDGE_ASSIGNMENTS = "judgeAssignments";
export const EVALUATIONS = "evaluations";
export { RESULTS };
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

// Mismo nombre que `ORGANIZATION_MEMBERS` de companies.ts (que importa este módulo: se repite para evitar el ciclo).
const MEMBERS = "organizationMembers";

/** Jurado de un challenge: la asignación activa hecha por C3 o, si no la hay, la representante vinculada a la organización del challenge. */
async function activeAssignment(db: Firestore, challengeId: string, uid: string): Promise<DocumentData | null> {
  const snapshot = await db.collection(JUDGE_ASSIGNMENTS).doc(assignmentDocId(challengeId, uid)).get();
  const data = snapshot.data();
  if (data && data.status === "active") return data;
  // Una asignación revocada por C3 es explícita: el vínculo con la empresa no la reabre.
  if (data && data.status === "revoked") return null;
  const organizationId = (await db.collection("challenges").doc(challengeId).get()).data()?.organizationId;
  if (typeof organizationId !== "string" || !organizationId) return null;
  const member = await db.collection(MEMBERS).doc(`${organizationId}__${uid}`).get();
  return member.exists ? { challengeId, userId: uid, kind: "empresa", status: "active" } : null;
}

/** Challenges publicados de las organizaciones a las que pertenece la persona. */
async function representedChallengeIds(db: Firestore, uid: string): Promise<string[]> {
  const memberships = await db.collection(MEMBERS).where("userId", "==", uid).get();
  const ids = new Set<string>();
  for (const membership of memberships.docs) {
    const challenges = await db.collection("challenges").where("organizationId", "==", membership.data().organizationId).get();
    for (const doc of challenges.docs) if (doc.data().status === "published") ids.add(doc.id);
  }
  return [...ids];
}

/** Challenges que la persona puede evaluar: asignaciones activas más los de su empresa, salvo asignaciones revocadas por C3. */
export async function evaluableChallenges(db: Firestore, uid: string): Promise<Map<string, JudgeKind>> {
  const result = new Map<string, JudgeKind>();
  const revoked = new Set<string>();
  const assignments = await db.collection(JUDGE_ASSIGNMENTS).where("userId", "==", uid).get();
  for (const doc of assignments.docs) {
    if (doc.data().status === "active") result.set(doc.data().challengeId, doc.data().kind as JudgeKind);
    else revoked.add(doc.data().challengeId);
  }
  for (const id of await representedChallengeIds(db, uid)) if (!result.has(id) && !revoked.has(id)) result.set(id, "empresa");
  return result;
}

/** Asigna un jurado a un challenge por correo. La cuenta debe existir. Solo C3. */
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

/** Las entregas siguen abiertas hasta la fecha de cierre; sin fecha, se consideran abiertas. Solo indica si una solución puede cambiar. */
export function entregasAbiertasEn(submissionClosesAt: string | null, now: Date): boolean {
  return submissionClosesAt === null || now.getTime() < Date.parse(submissionClosesAt);
}

/** Una experiencia concluida o cancelada es histórica: no recibe evaluaciones (AGENTS §5). */
async function evaluableExperience(db: Firestore, challenge: { experienceId: string }): Promise<boolean> {
  const experience = await loadExperience(db, challenge.experienceId).catch(() => null);
  return experience?.status === "published";
}

/** Challenges asignados a la persona autenticada, con su avance de evaluación. */
export async function myAssignments(db: Firestore, actor: Actor, now: Date) {
  const evaluable = await evaluableChallenges(db, actor.uid);
  return Promise.all([...evaluable].map(async ([challengeId, kind]) => {
    const data = { challengeId, kind };
    const challenge = await loadChallenge(db, data.challengeId).catch(() => null);
    const solutions = challenge ? await submittedSubmissions(db, challenge.id) : [];
    const evaluations = await db.collection(EVALUATIONS).where("challengeId", "==", data.challengeId).where("judgeUserId", "==", actor.uid).get();
    const finalized = evaluations.docs.filter((item) => item.data().status === "finalized").length;
    return {
      challengeId: data.challengeId,
      title: challenge?.title ?? "Challenge",
      kind: data.kind as JudgeKind,
      // Puede evaluar desde que el challenge y su experiencia están publicados; las entregas abiertas solo indican que una solución puede cambiar.
      canEvaluate: challenge !== null && challenge.status === "published" && (await evaluableExperience(db, challenge)),
      entregasAbiertas: challenge ? entregasAbiertasEn(challenge.submissionClosesAt, now) : false,
      solutions: solutions.length,
      finalized,
    };
  }));
}

/**
 * Espacio de evaluación: soluciones del challenge, rúbrica y mis evaluaciones. Solo jurados asignados.
 * Se evalúa desde que el challenge está publicado: el contenido y el nombre de cada solución se ven siempre.
 * `entregasAbiertas` indica que todavía pueden llegar o cambiar soluciones. Nunca se devuelve el uid de quien entregó.
 */
export async function evaluationWorkspace(db: Firestore, actor: Actor, challengeId: string, now: Date) {
  const challenge = await loadChallenge(db, challengeId);
  if (challenge.status !== "published" || !(await evaluableExperience(db, challenge))) throw notFound();
  const assignment = await activeAssignment(db, challengeId, actor.uid);
  if (!assignment) throw new HttpError(403, "sin_asignacion", "No tenés asignado este challenge como jurado.");
  const solutions = await submittedSubmissions(db, challengeId);
  const names = await Promise.all(solutions.map((solution) => nameOf(db, solution)));
  const mine = await db.collection(EVALUATIONS).where("challengeId", "==", challengeId).where("judgeUserId", "==", actor.uid).get();
  const byId = new Map(mine.docs.map((doc) => [doc.data().submissionId as string, doc.data()]));
  return {
    challenge: { id: challenge.id, title: challenge.title, rubric: challenge.rubric, submissionClosesAt: challenge.submissionClosesAt },
    kind: assignment.kind as JudgeKind,
    entregasAbiertas: entregasAbiertasEn(challenge.submissionClosesAt, now),
    maxTotal: maxTotal(challenge.rubric),
    solutions: solutions.map((solution, index) => {
      const evaluation = byId.get(solution.id);
      return {
        // Alias estable: el id real de la solución lleva el uid de quien la entregó.
        id: solutionAlias(index),
        label: `Solución ${index + 1}`,
        // Nombre real de la persona o del equipo, visible para el jurado asignado.
        name: names[index],
        text: solution.text,
        links: solution.links,
        mine: evaluation
          ? { scores: evaluation.scores as Record<string, number>, total: evaluation.total as number, status: evaluation.status as "draft" | "finalized", comment: (evaluation.comment as string | null | undefined) ?? null }
          : null,
      };
    }),
  };
}

/** Alias público de una solución dentro de su challenge: «s1», «s2»… según el orden de envío (estable: una solución enviada no cambia de posición). */
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
  if (challenge.status !== "published" || !(await evaluableExperience(db, challenge))) throw notFound();
  const assignment = await activeAssignment(db, challengeId, actor.uid);
  if (!assignment) throw new HttpError(403, "sin_asignacion", "No tenés asignado este challenge como jurado.");
  // Nadie evalúa su propia solución; en equipo, quien la envió es la líder.
  if (target.userId === actor.uid) throw new HttpError(403, "autoevaluacion", "No podés evaluar tu propia solución.");

  const ref =db.collection(EVALUATIONS).doc(evaluationDocId(submissionId, actor.uid));
  const scores = parseScores(body.scores, challenge.rubric);
  const finalize = body.finalize === true;
  // Comentario interno del jurado: lo ve solo C3. No es la retroalimentación que la empresa publica a la persona.
  const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim() : null;
  if (comment && comment.length > 1000) {
    throw new ValidationFailure([{ field: "comment", message: "El comentario puede tener hasta 1000 caracteres." }]);
  }
  const stamp = now.toISOString();
  // La lectura del estado y la escritura van en una transacción: un guardado simultáneo no reabre una evaluación finalizada.
  await db.runTransaction(async (transaction) => {
    const existing = (await transaction.get(ref)).data();
    // Congelar al publicar: una vez publicados los resultados, ninguna evaluación cambia.
    const results = (await transaction.get(db.collection(RESULTS).doc(challengeId))).data();
    if (results?.status === "published") throw new HttpError(409, "resultados_publicados", "Los resultados ya están publicados: las evaluaciones quedaron congeladas.");
    if (existing?.status === "finalized") throw new HttpError(409, "ya_finalizada", "Esta evaluación ya está finalizada.");
    // Toca la entrega para que una edición concurrente de la persona se reintente y vea esta evaluación (AGENTS §5).
    transaction.set(db.collection(SUBMISSIONS).doc(submissionId), { lastEvaluatedAt: stamp }, { merge: true });
    transaction.set(ref, {
      submissionId,
      challengeId,
      judgeUserId: actor.uid,
      kind: assignment.kind,
      scores,
      total: scoreOf(scores, challenge.rubric),
      comment,
      status: finalize ? "finalized" : "draft",
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
      finalizedAt: finalize ? stamp : null,
    });
  });
}

export interface BoardRow {
  submissionId: string;
  label: string;
  name: string | null;
  finalizedJudges: number;
  average: number | null;
  recognition: Recognition | null;
  evaluations: { judgeUid: string; kind: string; total: number; status: string; comment: string | null }[];
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
async function boardFor(db: Firestore, challengeId: string, now: Date = new Date()): Promise<ResultsBoard> {
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
        comment: (doc.data().comment as string | null | undefined) ?? null,
      })),
    });
  }

  const notReady = rows.filter((row) => !solutionReady(row.finalizedJudges)).length;
  const blockedReason = rows.length === 0
    ? "Todavía no hay soluciones enviadas para publicar."
    : entregasAbiertasEn(challenge.submissionClosesAt, now)
      ? "Las entregas siguen abiertas: los resultados se publican después del cierre."
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
export async function resultsBoard(db: Firestore, actor: Actor, challengeId: string, now: Date = new Date()): Promise<ResultsBoard> {
  requireAdmin(actor);
  return boardFor(db, challengeId, now);
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

/** Publicación oficial por C3. Solo después del cierre de entregas y con dos evaluaciones finalizadas por solución. */
export async function publishResults(db: Firestore, actor: Actor, challengeId: string, rawInput: unknown, now: Date): Promise<void> {
  requireAdmin(actor);
  const board = await resultsBoard(db, actor, challengeId, now);
  if (board.status === "published") throw new HttpError(409, "ya_publicado", "Los resultados ya están publicados.");
  // Evaluar ya no exige el cierre, así que publicar sí: con entregas abiertas pueden llegar soluciones sin evaluar.
  const challenge = await loadChallenge(db, challengeId);
  if (entregasAbiertasEn(challenge.submissionClosesAt, now)) {
    throw new HttpError(409, "entregas_abiertas", "Las entregas siguen abiertas: los resultados se publican después del cierre.");
  }
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
  // Puntaje por criterio: solo cuando C3 publicó con puntajes visibles, y solo de las evaluaciones finalizadas de esta solución.
  const challenge = await loadChallenge(db, challengeId);
  const finalized = results.showScores
    ? (await db.collection(EVALUATIONS).where("challengeId", "==", challengeId).get()).docs
        .map((doc) => doc.data())
        .filter((data) => data.submissionId === submissionId && data.status === "finalized")
    : [];
  const averages = finalized.length > 0 ? criterionAverages(finalized.map((data) => data.scores as Record<string, number>), challenge.rubric) : null;
  return {
    recognition: row.recognition ? RECOGNITION_LABEL[row.recognition] : null,
    average: results.showScores ? row.average : null,
    place: results.showScores ? place : null,
    of: results.showScores ? ranked.length : null,
    maxTotal: results.showScores ? maxTotal(challenge.rubric) : null,
    criteria: averages ? challenge.rubric.map((criterion) => ({ label: criterion.label, maxScore: criterion.maxScore, average: averages[criterion.id] ?? null })) : null,
  };
}

/** Ganadores públicos del challenge, si C3 publicó y autorizó mostrarlos. */
export async function publicWinners(db: Firestore, challengeId: string): Promise<{ name: string | null; recognition: string; profileSlug: string | null }[]> {
  const results = await resultsDoc(db, challengeId);
  if (results.status !== "published" || results.showWinners === false) return [];
  const recognitions = (results.recognitions ?? {}) as Record<string, Recognition>;
  const winners: { name: string | null; recognition: string; profileSlug: string | null }[] = [];
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
    // Solo una persona ganadora que activó su perfil público tiene enlace; los equipos y las demás, no.
    const profileSlug = row.mode === "individual" && row.userId ? await publicSlugOf(db, row.userId) : null;
    winners.push({ name: await nameOf(db, row), recognition: RECOGNITION_LABEL[recognition], profileSlug });
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

