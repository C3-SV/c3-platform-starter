import type { ExperienceKind, ExperienceLine, ExperienceStatus, RubricCriterion } from "../domain/types.ts";
import { scoreOf } from "../domain/evaluation.ts";
import { contactRequestDocId, enrollmentDocId, participationDocId } from "../server/ids.ts";
import { assignmentDocId, evaluationDocId } from "../server/evaluation.ts";
import { DEMO_ACCOUNTS } from "./demo-accounts.ts";

/** Colecciones que escribe el seed. El orden importa: las organizaciones van primero. */
export const SEED_COLLECTIONS = [
  "organizations",
  "experiences",
  "challenges",
  "users",
  "enrollments",
  "participations",
  "submissions",
  "defenses",
  "shortlists",
  "contactRequests",
  "companyProposals",
  "checkpoints",
  "feedbacks",
  "judgeAssignments",
  "evaluations",
  "results",
] as const;

export interface SeedRecord {
  collection: (typeof SEED_COLLECTIONS)[number];
  id: string;
  data: Record<string, unknown>;
}

// v3 (4-nov-2026): el challenge demostrativo lleva la marca demo; la solución publicada tiene dos evaluaciones finalizadas de jurados distintos; la retroalimentación de la cuenta joven está publicada.
// v2 (3-nov-2026): línea Conecta para el challenge empresarial, nombre y rúbrica del reto demostrativo y paquete comercial.
// Un documento con la misma versión y contenido distinto aparece como conflicto en buildSeedPlan. Una versión anterior se
// actualiza con `update` (con respaldo y --allow-update), nunca con `apply`.
const SEED_VERSION = 5;
const MANAGED_BY = "c3-seed";

export function seedId(namespace: string, key: string): string {
  return `seed_${namespace}_${key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/** Organización ficticia que representa la empresa demo. Las cuentas de empresa demo se vinculan a este id. */
export const DEMO_ORGANIZATION_ID = seedId("organization", "empresa-demostracion");

function experience(
  key: string,
  input: {
    title: string;
    kind: ExperienceKind;
    primaryLine: ExperienceLine;
    secondaryLines?: ExperienceLine[];
    summary: string;
    status: ExperienceStatus;
    registrationOpensAt?: string | null;
    registrationClosesAt?: string | null;
    isDemo?: boolean;
    demoNote?: string;
    sourceUrl?: string;
    sourceLabel?: string;
  },
): SeedRecord {
  const stamp = "2026-10-01T00:00:00.000Z";
  return {
    collection: "experiences",
    id: seedId("experience", key),
    data: {
      title: input.title,
      kind: input.kind,
      primaryLine: input.primaryLine,
      ...(input.secondaryLines ? { secondaryLines: input.secondaryLines } : {}),
      summary: input.summary,
      status: input.status,
      registrationOpensAt: input.registrationOpensAt ?? null,
      registrationClosesAt: input.registrationClosesAt ?? null,
      ...(input.isDemo ? { isDemo: true, demoNote: input.demoNote } : {}),
      ...(input.sourceUrl ? { sourceUrl: input.sourceUrl, sourceLabel: input.sourceLabel } : {}),
      seedVersion: SEED_VERSION,
      managedBy: MANAGED_BY,
      createdAt: stamp,
      updatedAt: stamp,
    },
  };
}

const experiences: SeedRecord[] = [
  experience("copa-salvadorena-2026", {
    title: "Copa Salvadoreña de Programación 2026",
    kind: "competencia",
    primaryLine: "compite",
    summary: "Competencia nacional para fortalecer el pensamiento algorítmico y reunir talento técnico joven.",
    status: "closed",
    sourceUrl: "https://copa.c3.com.sv/",
    sourceLabel: "Copa Salvadoreña de Programación",
  }),
  experience("hackathon-turismo-creativo-vol-1", {
    title: "Hackathon de Turismo Creativo Vol. 1",
    kind: "hackathon",
    primaryLine: "crea",
    summary: "Experiencia intensiva para construir soluciones reales donde turismo, código y cultura se encuentran.",
    status: "closed",
    sourceUrl: "https://hackathon.c3.com.sv/",
    sourceLabel: "Hackathon de Turismo Creativo Vol. 1",
  }),
  experience("duelo-programacion-c3-software-week-esen-2025", {
    title: "Duelo de Programación C3 · Software Week ESEN 2025",
    kind: "competencia",
    primaryLine: "compite",
    summary: "Competencia de programación individual para resolver retos de lógica en tiempo limitado.",
    status: "closed",
    sourceUrl: "https://c3.com.sv/",
    sourceLabel: "C3 · Evidencia viva del ecosistema",
  }),
  experience("taller-programacion-competitiva-instituto-retos", {
    title: "Taller de Programación Competitiva · Instituto Retos",
    kind: "competencia",
    primaryLine: "compite",
    summary: "Experiencia demostrativa de aprendizaje para practicar pensamiento algorítmico y resolución de problemas.",
    status: "published",
    isDemo: true,
    demoNote: "Configuración de demostración; no es una convocatoria oficial.",
  }),
  experience("hackathon-turismo-creativo-vol-2", {
    title: "Hackathon de Turismo Creativo Vol. 2",
    kind: "hackathon",
    primaryLine: "crea",
    summary: "Propuesta demostrativa para continuar construyendo soluciones de turismo, tecnología y cultura.",
    status: "published",
    isDemo: true,
    demoNote: "Propuesta de demostración; no existe convocatoria oficial confirmada.",
  }),
  experience("challenge-empresarial-demo", {
    title: "Challenge empresarial · Empresa de demostración",
    kind: "challenge_empresarial",
    primaryLine: "conecta",
    secondaryLines: ["crea"],
    summary: "Reto demostrativo que convierte un problema empresarial en una oportunidad de creación y conexión.",
    status: "published",
    isDemo: true,
    demoNote: "Configuración de demostración con empresa ficticia; no representa un acuerdo real.",
  }),
  experience("encuentro-c3-talento-industria", {
    title: "Encuentro C3: Talento e industria",
    kind: "challenge_empresarial",
    primaryLine: "conecta",
    summary: "Encuentro demostrativo para acercar comunidad técnica, instituciones y organizaciones.",
    status: "published",
    isDemo: true,
    demoNote: "Experiencia de demostración; no es una convocatoria oficial.",
  }),
];

const organizations: SeedRecord[] = [
  {
    collection: "organizations",
    id: DEMO_ORGANIZATION_ID,
    data: {
      name: "Empresa de demostración C3",
      isDemo: true,
      seedVersion: SEED_VERSION,
      managedBy: MANAGED_BY,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  },
];

const demoChallengeExperienceId = seedId("experience", "challenge-empresarial-demo");
/** Rúbrica del challenge demo con pesos 20/30/25/25 (update §0.3). Cada criterio se puntúa de 0 a 10. */
const DEMO_RUBRIC: RubricCriterion[] = [
  { id: "c1", label: "Comprensión del problema", maxScore: 10, weight: 20 },
  { id: "c2", label: "Solución funcional y pruebas", maxScore: 10, weight: 30 },
  { id: "c3", label: "Criterio técnico y decisiones", maxScore: 10, weight: 25 },
  { id: "c4", label: "Claridad de la defensa", maxScore: 10, weight: 25 },
];
const challenges: SeedRecord[] = [
  {
    collection: "challenges",
    id: seedId("challenge", "empresa-demostracion-rutas"),
    data: {
      experienceId: demoChallengeExperienceId,
      organizationId: DEMO_ORGANIZATION_ID,
      title: "Optimización de rutas para una operación de entregas",
      summary: "Prototipar una herramienta que proponga rutas de reparto y explique los criterios que aplicó.",
      problem: "Una empresa de logística ficticia distribuye pedidos y quiere comparar rutas para reducir kilómetros innecesarios. Necesita un prototipo que permita cargar un conjunto sintético de entregas, generar una propuesta de ruta y explicar qué restricciones y criterios se aplicaron.",
      deliverables: [
        "Repositorio y README",
        "Demo de prototipo o video",
        "Bitácora breve con dos decisiones clave",
        "Defensa con trade-offs y limitaciones",
      ],
      rubric: DEMO_RUBRIC,
      organizationName: "Empresa de demostración C3",
      commercialPackage: "completo",
      allows: ["individual", "team"],
      teamMinSize: 2,
      teamMaxSize: 4,
      submissionClosesAt: "2026-12-31T23:59:00.000Z",
      status: "published",
      demo: true,
      seedVersion: SEED_VERSION,
      managedBy: MANAGED_BY,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  },
];

// ---------------------------------------------------------------------------
// Dataset de demostración (update §4.C). Todo es ficticio y lleva managedBy c3-seed y demo: true.
// Las cuentas demo (joven, empresa, admin) existen en Auth con UID fijo; el resto de participantes son perfiles
// de demostración sin cuenta. Ningún registro representa una convocatoria real, una contratación ni una venta.
// Los enlaces de entrega apuntan al sitio demo: no son repositorios reales.
// ---------------------------------------------------------------------------

const demoChallengeId = seedId("challenge", "empresa-demostracion-rutas");
const demoExperienceId = seedId("experience", "challenge-empresarial-demo");
const DEMO_UID = Object.fromEntries(DEMO_ACCOUNTS.map((account) => [account.key, account.uid])) as Record<"joven" | "empresa" | "admin", string>;
const DEMO_TIMES = {
  created: "2026-10-20T15:00:00.000Z",
  submitted: "2026-11-02T18:00:00.000Z",
  defended: "2026-11-02T19:30:00.000Z",
  changed: "2026-11-02T20:00:00.000Z",
};
const DEMO_LINK = "https://demo.plat.c3.com.sv/";
const demoMeta = { seedVersion: SEED_VERSION, managedBy: MANAGED_BY, demo: true };

interface DemoParticipant {
  key: string;
  displayName: string;
  enrollment: "approved" | "pending" | "cancelled";
  submission?: "submitted" | "draft";
  text?: string;
  links?: string[];
  defense?: { summary: string; decisions: string; testing?: string; tradeoffs?: string; aiUse?: string };
  shortlist?: string;
  contact?: { status: "esperando_consentimiento" | "aceptado"; message: string };
  checkpoints?: { text: string; link?: string }[];
  feedback?: { text: string; publish: boolean };
}

/** Registros de una persona en el challenge demo: perfil (si no es cuenta demo), inscripción, participación, entrega, defensa, lista corta y contacto. */
function participantRecords(person: DemoParticipant, uid: string, withProfile: boolean): SeedRecord[] {
  const records: SeedRecord[] = [];
  if (withProfile) {
    records.push({ collection: "users", id: uid, data: { displayName: person.displayName, email: null, ...demoMeta, createdAt: DEMO_TIMES.created, updatedAt: DEMO_TIMES.created } });
  }
  const enrollmentId = enrollmentDocId(demoExperienceId, uid);
  records.push({
    collection: "enrollments",
    id: enrollmentId,
    data: { experienceId: demoExperienceId, challengeId: demoChallengeId, userId: uid, mode: "individual", status: person.enrollment, ...demoMeta, createdAt: DEMO_TIMES.created, updatedAt: DEMO_TIMES.created },
  });
  if (person.enrollment !== "approved") return records;

  const submissionId = participationDocId(demoChallengeId, uid);
  records.push({
    collection: "participations",
    id: submissionId,
    data: { challengeId: demoChallengeId, experienceId: demoExperienceId, userId: uid, mode: "individual", status: "active", ...demoMeta, createdAt: DEMO_TIMES.created, updatedAt: DEMO_TIMES.created },
  });
  if (!person.submission) return records;

  const submitted = person.submission === "submitted";
  records.push({
    collection: "submissions",
    id: submissionId,
    data: {
      participationId: submissionId,
      challengeId: demoChallengeId,
      userId: uid,
      mode: "individual",
      status: person.submission,
      text: person.text ?? "",
      links: person.links ?? [],
      createdAt: DEMO_TIMES.created,
      updatedAt: submitted ? DEMO_TIMES.submitted : DEMO_TIMES.created,
      submittedAt: submitted ? DEMO_TIMES.submitted : null,
      ...demoMeta,
    },
  });
  if (!submitted) return records;

  (person.checkpoints ?? []).forEach((checkpoint, index) => {
    records.push({
      collection: "checkpoints",
      id: seedId("checkpoint", `${uid}-${index + 1}`),
      data: {
        challengeId: demoChallengeId,
        submissionId,
        authorUid: uid,
        text: checkpoint.text,
        link: checkpoint.link ?? null,
        createdAt: `2026-10-${String(25 + index).padStart(2, "0")}T16:00:00.000Z`,
        ...demoMeta,
      },
    });
  });
  if (person.feedback) {
    records.push({
      collection: "feedbacks",
      id: submissionId,
      data: {
        challengeId: demoChallengeId,
        submissionId,
        organizationId: DEMO_ORGANIZATION_ID,
        text: person.feedback.text,
        publishedAt: person.feedback.publish ? DEMO_TIMES.changed : null,
        updatedAt: DEMO_TIMES.changed,
        writtenByUid: DEMO_UID.empresa,
        ...demoMeta,
      },
    });
  }

  if (person.defense) {
    records.push({
      collection: "defenses",
      id: submissionId,
      data: {
        submissionId,
        challengeId: demoChallengeId,
        userId: uid,
        videoUrl: null,
        summary: person.defense.summary,
        decisions: person.defense.decisions,
        testing: person.defense.testing ?? null,
        tradeoffs: person.defense.tradeoffs ?? null,
        aiUse: person.defense.aiUse ?? null,
        createdAt: DEMO_TIMES.defended,
        updatedAt: DEMO_TIMES.defended,
        ...demoMeta,
      },
    });
  }
  if (person.shortlist) {
    records.push({
      collection: "shortlists",
      id: submissionId,
      data: { organizationId: DEMO_ORGANIZATION_ID, challengeId: demoChallengeId, submissionId, userId: uid, reason: person.shortlist, addedByUserId: DEMO_UID.empresa, createdAt: DEMO_TIMES.changed, ...demoMeta },
    });
  }
  if (person.contact) {
    records.push({
      collection: "contactRequests",
      id: contactRequestDocId(demoChallengeId, uid),
      data: {
        organizationId: DEMO_ORGANIZATION_ID,
        challengeId: demoChallengeId,
        userId: uid,
        status: person.contact.status,
        message: person.contact.message,
        requestedByUserId: DEMO_UID.empresa,
        lastChangedBy: person.contact.status === "aceptado" ? "participant" : "company",
        createdAt: DEMO_TIMES.changed,
        updatedAt: DEMO_TIMES.changed,
        ...demoMeta,
      },
    });
  }
  return records;
}

const demoJoven: DemoParticipant = {
  key: "joven",
  displayName: "Joven demostrativa",
  enrollment: "approved",
  submission: "submitted",
  text: "Heurística de inserción con ventanas horarias. Comparé la propuesta contra una búsqueda exhaustiva sobre 40 instancias sintéticas y registré kilómetros y tiempo de cómputo.",
  links: [DEMO_LINK],
  defense: {
    summary: "La solución inserta cada pedido en la ruta con menor costo respetando su ventana horaria, y luego mejora la ruta intercambiando dos pedidos. La comparación con la búsqueda exacta se hizo en instancias pequeñas.",
    decisions: "Elegí inserción secuencial porque responde en menos de un segundo con 300 pedidos; la búsqueda exacta no escala a ese tamaño.",
    testing: "40 instancias sintéticas, con medición de kilómetros y tiempo, y revisión manual de tres rutas.",
    tradeoffs: "En instancias grandes pierde calidad frente a métodos metaheurísticos. Lo declaro como limitación.",
    aiUse: "Usé un asistente para generar casos de prueba. Revisé cada caso y corregí dos con errores de ventanas horarias.",
  },
  shortlist: "Justifica la heurística con datos y reconoce sus límites en instancias grandes.",
  contact: { status: "esperando_consentimiento", message: "Nos gustaría conocer mejor tu propuesta de rutas y cómo tratás las ventanas horarias." },
  checkpoints: [
    { text: "Comparé la heurística de inserción contra la búsqueda exhaustiva en 40 instancias pequeñas. La diferencia de kilómetros fue menor al 5 %." },
    { text: "Decidí mantener la inserción secuencial: con 300 pedidos responde en menos de un segundo. Lo dejo registrado con la medición.", link: DEMO_LINK },
  ],
  feedback: { text: "Buena comparación con la búsqueda exhaustiva. Falta medir el costo de cambiar de ruta después de cumplir las ventanas.", publish: true },
};

const demoParticipants: DemoParticipant[] = [
  {
    key: "ana-martinez",
    displayName: "Ana Martínez",
    enrollment: "approved",
    submission: "submitted",
    text: "Heurística de inserción con reglas de tolerancia para ventanas horarias y un reporte de cada decisión de inserción.",
    links: [DEMO_LINK],
    defense: {
      summary: "Priorizo los pedidos con ventana más estrecha y dejo registro de cada inserción para poder auditar el resultado.",
      decisions: "Usé tolerancias de quince minutos porque el cliente acepta esa diferencia; más tolerancia mejora kilómetros pero sube reclamos.",
      testing: "Revisé el reporte contra tres casos a mano y verifiqué que ningún pedido quede fuera de su ventana.",
    },
    shortlist: "Explica con datos por qué elige las tolerancias y muestra cómo se auditan las decisiones.",
    contact: { status: "aceptado", message: "Nos gustaría conversar sobre cómo justificaste las tolerancias de las ventanas." },
    feedback: { text: "Justificás las tolerancias con datos y dejás trazabilidad de cada inserción. Falta una prueba con demoras reales de tráfico.", publish: true },
  },
  {
    key: "luis-herrera",
    displayName: "Luis Herrera",
    enrollment: "approved",
    submission: "submitted",
    text: "Solución en Python con documentación completa: instalación, ejemplos de uso y una tabla de resultados por instancia.",
    links: [DEMO_LINK],
    defense: {
      summary: "La documentación explica cómo reproducir cada resultado. La solución usa vecindad por intercambio entre rutas cercanas.",
      decisions: "Documenté primero el formato de entrada para que cualquiera pueda reproducir los resultados.",
    },
  },
  {
    key: "sofia-ramirez",
    displayName: "Sofía Ramírez",
    enrollment: "approved",
    submission: "submitted",
    text: "Prototipo de búsqueda local con 2-opt por zonas y una interfaz web sencilla para cargar pedidos.",
    links: [DEMO_LINK],
  },
  {
    key: "diego-castillo",
    displayName: "Diego Castillo",
    enrollment: "approved",
    submission: "draft",
    text: "Borrador en progreso: falta la comparación con la búsqueda exacta.",
  },
  { key: "fernanda-lopez", displayName: "Fernanda López", enrollment: "pending" },
  { key: "javier-mendez", displayName: "Javier Méndez", enrollment: "cancelled" },
];

const demoProposals: SeedRecord[] = [
  {
    collection: "companyProposals",
    id: seedId("proposal", "logistica-ficticia"),
    data: {
      companyName: "Logística Ficticia S. A.",
      contactName: "Contacto demostrativo, operaciones",
      contactEmail: "operaciones@example.test",
      problem: "Distribuimos pedidos en zonas urbanas y comparamos rutas a mano. Queremos entender cómo otras herramientas proponen rutas con restricciones de horario.",
      desiredOutcome: "Un prototipo que compare dos enfoques sobre el mismo conjunto de pedidos sintéticos.",
      constraints: "Solo datos sintéticos; sin direcciones reales de clientes.",
      status: "accepted",
      reviewNote: "Aceptada: se convierte en el challenge demostrativo de rutas.",
      organizationId: DEMO_ORGANIZATION_ID,
      createdAt: DEMO_TIMES.created,
      updatedAt: DEMO_TIMES.changed,
      ...demoMeta,
    },
  },
  {
    collection: "companyProposals",
    id: seedId("proposal", "retail-ficticio"),
    data: {
      companyName: "Retail Ficticio",
      contactName: "Contacto demostrativo, datos",
      contactEmail: "datos@example.test",
      problem: "Queremos detectar patrones de compra estacionales en un catálogo de productos y no sabemos por dónde empezar.",
      desiredOutcome: "Una primera versión que muestre los patrones con datos sintéticos.",
      constraints: "Sin datos personales de clientes.",
      status: "needs_changes",
      reviewNote: "Indicá qué datos sintéticos compartirían y cómo los anonimizan antes de revisar la propuesta.",
      organizationId: null,
      createdAt: DEMO_TIMES.created,
      updatedAt: DEMO_TIMES.changed,
      ...demoMeta,
    },
  },
  {
    collection: "companyProposals",
    id: seedId("proposal", "banca-ficticia"),
    data: {
      companyName: "Banca Ficticia",
      contactName: "Contacto demostrativo, innovación",
      contactEmail: "innovacion@example.test",
      problem: "Queremos evaluar talento en la validación de reglas de negocio de un proceso de crédito, con datos sintéticos.",
      desiredOutcome: "Conocer perfiles que expliquen cómo validan reglas.",
      constraints: "Solo datos sintéticos.",
      status: "received",
      reviewNote: null,
      organizationId: null,
      createdAt: DEMO_TIMES.created,
      updatedAt: DEMO_TIMES.created,
      ...demoMeta,
    },
  },
];

/**
 * Evaluación de demostración: dos jurados asignados (la administradora demo y un jurado externo sin cuenta).
 * Ana y Luis tienen dos evaluaciones finalizadas; Sofía tiene un borrador. El resultado queda publicado con puntajes
 * visibles SOLO para esta demostración; no hay ganadores públicos (showWinners false).
 */
function evaluationRecords(): SeedRecord[] {
  const externalJudge = seedId("user", "jurado-externo");
  const judges = [
    { uid: DEMO_UID.admin, email: DEMO_ACCOUNTS.find((account) => account.key === "admin")?.email ?? "", kind: "externo" },
    { uid: externalJudge, email: "jurado.externo@example.test", kind: "externo" },
  ];
  const assignments: SeedRecord[] = judges.map((judge) => ({
    collection: "judgeAssignments",
    id: assignmentDocId(demoChallengeId, judge.uid),
    data: {
      challengeId: demoChallengeId,
      experienceId: demoExperienceId,
      userId: judge.uid,
      email: judge.email,
      kind: judge.kind,
      status: "active",
      assignedAt: DEMO_TIMES.created,
      assignedByUid: DEMO_UID.admin,
      revokedAt: null,
      ...demoMeta,
    },
  }));

  const scoresBy: Record<string, { judge: string; scores: Record<string, number>; finalized: boolean }[]> = {
    "ana-martinez": [
      { judge: DEMO_UID.admin, scores: { c1: 9, c2: 8, c3: 9, c4: 8 }, finalized: true },
      { judge: externalJudge, scores: { c1: 8, c2: 9, c3: 8, c4: 9 }, finalized: true },
    ],
    "luis-herrera": [
      { judge: DEMO_UID.admin, scores: { c1: 7, c2: 6, c3: 7, c4: 6 }, finalized: true },
      { judge: externalJudge, scores: { c1: 6, c2: 7, c3: 6, c4: 7 }, finalized: true },
    ],
    "sofia-ramirez": [
      { judge: DEMO_UID.admin, scores: { c1: 8, c2: 7, c3: 7, c4: 8 }, finalized: true },
      { judge: externalJudge, scores: { c1: 7, c2: 8, c3: 6, c4: 7 }, finalized: true },
    ],
  };
  const evaluations: SeedRecord[] = Object.entries(scoresBy).flatMap(([key, entries]) => {
    const submissionId = participationDocId(demoChallengeId, seedId("user", key));
    return entries.map((entry) => ({
      collection: "evaluations",
      id: evaluationDocId(submissionId, entry.judge),
      data: {
        submissionId,
        challengeId: demoChallengeId,
        judgeUserId: entry.judge,
        kind: "externo",
        scores: entry.scores,
        total: scoreOf(entry.scores, DEMO_RUBRIC),
        status: entry.finalized ? "finalized" : "draft",
        createdAt: DEMO_TIMES.changed,
        updatedAt: DEMO_TIMES.changed,
        finalizedAt: entry.finalized ? DEMO_TIMES.changed : null,
        ...demoMeta,
      },
    }));
  });

  const results: SeedRecord[] = [{
    collection: "results",
    id: demoChallengeId,
    data: {
      challengeId: demoChallengeId,
      status: "published",
      showWinners: false,
      showScores: true,
      publishedAt: DEMO_TIMES.changed,
      publishedByUid: DEMO_UID.admin,
      ...demoMeta,
    },
  }];
  return [...assignments, ...evaluations, ...results];
}

// ---------------------------------------------------------------------------
// Retos demo adicionales (update §4.C): otros dominios y estados, con las mismas cuentas demo (joven, empresa, admin)
// y los mismos perfiles de demostración. Uno abierto, uno en evaluación y uno concluido con resultados publicados.
// ---------------------------------------------------------------------------

interface ExtraParticipant {
  uid: string;
  enrollment: "approved" | "pending";
  submission?: "submitted" | "draft";
  text?: string;
}

interface ExtraEvaluation {
  /** Persona cuya solución se evalúa. */
  uid: string;
  judge: string;
  scores: Record<string, number>;
}

interface ExtraChallengeSpec {
  key: string;
  experienceTitle: string;
  title: string;
  summary: string;
  problem: string;
  deliverables: string[];
  rubric: RubricCriterion[];
  commercialPackage: "esencial" | "completo" | "destacado";
  closesAt: string;
  status: ExperienceStatus;
  participants: ExtraParticipant[];
  evaluations?: ExtraEvaluation[];
  resultsPublished?: boolean;
}

const EXTERNAL_JUDGE_UID = seedId("user", "jurado-externo");

function extraChallenge(spec: ExtraChallengeSpec): { experience: SeedRecord; challenge: SeedRecord; records: SeedRecord[] } {
  const experienceKey = `${spec.key}-experiencia`;
  const experienceId = seedId("experience", experienceKey);
  const challengeId = seedId("challenge", spec.key);
  const stamp = "2026-10-01T00:00:00.000Z";
  const experienceRecord = experience(experienceKey, {
    title: spec.experienceTitle,
    kind: "challenge_empresarial",
    primaryLine: "conecta",
    summary: spec.summary,
    status: spec.status,
    isDemo: true,
    demoNote: "Configuración de demostración con empresa ficticia; no representa un acuerdo real.",
  });
  const challengeRecord: SeedRecord = {
    collection: "challenges",
    id: challengeId,
    data: {
      experienceId,
      organizationId: DEMO_ORGANIZATION_ID,
      title: spec.title,
      summary: spec.summary,
      problem: spec.problem,
      deliverables: spec.deliverables,
      rubric: spec.rubric,
      organizationName: "Empresa de demostración C3",
      commercialPackage: spec.commercialPackage,
      allows: ["individual"],
      teamMinSize: null,
      teamMaxSize: null,
      submissionClosesAt: spec.closesAt,
      status: spec.status,
      demo: true,
      seedVersion: SEED_VERSION,
      managedBy: MANAGED_BY,
      createdAt: stamp,
      updatedAt: stamp,
    },
  };

  const records: SeedRecord[] = [];
  for (const person of spec.participants) {
    records.push({
      collection: "enrollments",
      id: enrollmentDocId(experienceId, person.uid),
      data: { experienceId, challengeId, userId: person.uid, mode: "individual", status: person.enrollment, ...demoMeta, createdAt: DEMO_TIMES.created, updatedAt: DEMO_TIMES.created },
    });
    if (person.enrollment !== "approved") continue;
    const submissionId = participationDocId(challengeId, person.uid);
    records.push({
      collection: "participations",
      id: submissionId,
      data: { challengeId, experienceId, userId: person.uid, mode: "individual", status: "active", ...demoMeta, createdAt: DEMO_TIMES.created, updatedAt: DEMO_TIMES.created },
    });
    if (!person.submission) continue;
    const submitted = person.submission === "submitted";
    records.push({
      collection: "submissions",
      id: submissionId,
      data: {
        participationId: submissionId,
        challengeId,
        userId: person.uid,
        mode: "individual",
        status: person.submission,
        text: person.text ?? "",
        links: [DEMO_LINK],
        createdAt: DEMO_TIMES.created,
        updatedAt: submitted ? DEMO_TIMES.submitted : DEMO_TIMES.created,
        submittedAt: submitted ? DEMO_TIMES.submitted : null,
        ...demoMeta,
      },
    });
  }

  if (spec.evaluations) {
    const judges = [
      { uid: DEMO_UID.admin, email: DEMO_ACCOUNTS.find((account) => account.key === "admin")?.email ?? "" },
      { uid: EXTERNAL_JUDGE_UID, email: "jurado.externo@example.test" },
    ];
    for (const judge of judges) {
      records.push({
        collection: "judgeAssignments",
        id: assignmentDocId(challengeId, judge.uid),
        data: { challengeId, experienceId, userId: judge.uid, email: judge.email, kind: "externo", status: "active", assignedAt: DEMO_TIMES.created, assignedByUid: DEMO_UID.admin, revokedAt: null, ...demoMeta },
      });
    }
    for (const entry of spec.evaluations) {
      const submissionId = participationDocId(challengeId, entry.uid);
      records.push({
        collection: "evaluations",
        id: evaluationDocId(submissionId, entry.judge),
        data: {
          submissionId,
          challengeId,
          judgeUserId: entry.judge,
          kind: "externo",
          scores: entry.scores,
          total: scoreOf(entry.scores, spec.rubric),
          status: "finalized",
          createdAt: DEMO_TIMES.changed,
          updatedAt: DEMO_TIMES.changed,
          finalizedAt: DEMO_TIMES.changed,
          ...demoMeta,
        },
      });
    }
  }
  if (spec.resultsPublished) {
    records.push({
      collection: "results",
      id: challengeId,
      data: { challengeId, status: "published", showWinners: false, showScores: true, publishedAt: DEMO_TIMES.changed, publishedByUid: DEMO_UID.admin, ...demoMeta },
    });
  }
  return { experience: experienceRecord, challenge: challengeRecord, records };
}

const ana = seedId("user", "ana-martinez");
const luis = seedId("user", "luis-herrera");
const sofia = seedId("user", "sofia-ramirez");
const fernanda = seedId("user", "fernanda-lopez");
const javier = seedId("user", "javier-mendez");
const externo = EXTERNAL_JUDGE_UID;

const extraChallenges = [
  // Abierto: la cuenta joven tiene un borrador; todavía no hay soluciones enviadas.
  extraChallenge({
    key: "demanda-retail",
    experienceTitle: "Challenge empresarial · Cadena de retail (demostración)",
    title: "Predicción de demanda semanal para una cadena de tiendas",
    summary: "Estimar la demanda semanal por tienda y explicar qué señales usó el modelo.",
    problem: "Una cadena de tiendas ficticia reabastece a ciegas y termina con faltantes en unas sucursales y sobrantes en otras. Necesita un prototipo que, con un historial sintético de ventas, proponga la demanda de la próxima semana y explique las señales que pesaron.",
    deliverables: ["Repositorio y README", "Pronóstico de ejemplo con su explicación", "Bitácora breve con dos decisiones clave"],
    rubric: [
      { id: "c1", label: "Calidad del pronóstico", maxScore: 10, weight: 40 },
      { id: "c2", label: "Explicación de las señales", maxScore: 10, weight: 30 },
      { id: "c3", label: "Claridad de la defensa", maxScore: 10, weight: 30 },
    ],
    commercialPackage: "esencial",
    closesAt: "2027-01-31T23:59:00.000Z",
    status: "published",
    participants: [
      { uid: DEMO_UID.joven, enrollment: "approved", submission: "draft", text: "Borrador: separé la serie por tienda y probé un promedio móvil como línea base antes de comparar modelos." },
      { uid: fernanda, enrollment: "approved" },
      { uid: javier, enrollment: "pending" },
    ],
  }),
  // En evaluación: las entregas cerraron y solo un jurado finalizó una evaluación.
  extraChallenge({
    key: "tablero-fintech",
    experienceTitle: "Challenge empresarial · Fintech (demostración)",
    title: "Tablero de indicadores para decisiones de una fintech",
    summary: "Diseñar un tablero que muestre morosidad y captación sin abrumar a quien decide.",
    problem: "Una fintech ficticia revisa decenas de métricas cada lunes y nadie sabe cuáles importan. Necesita un tablero con pocos indicadores, con datos sintéticos, que permita decidir qué cartera mirar primero y por qué.",
    deliverables: ["Prototipo navegable o código", "Criterios de elección de los indicadores", "Defensa con límites y siguientes pasos"],
    rubric: [
      { id: "c1", label: "Relevancia de los indicadores", maxScore: 10, weight: 25 },
      { id: "c2", label: "Claridad visual", maxScore: 10, weight: 25 },
      { id: "c3", label: "Criterio y decisiones", maxScore: 10, weight: 25 },
      { id: "c4", label: "Claridad de la defensa", maxScore: 10, weight: 25 },
    ],
    commercialPackage: "destacado",
    closesAt: "2026-10-30T23:59:00.000Z",
    status: "published",
    participants: [
      { uid: ana, enrollment: "approved", submission: "submitted", text: "Tablero con cinco indicadores ordenados por impacto; cada tarjeta explica por qué está y cuándo dejaría de importar." },
      { uid: luis, enrollment: "approved", submission: "submitted", text: "Vista única con semáforo por cartera y un detalle plegable; priorizé la morosidad temprana sobre la captación." },
      { uid: DEMO_UID.joven, enrollment: "approved", submission: "submitted", text: "Tablero en dos niveles: resumen de tres números y detalle por segmento, con las decisiones documentadas." },
    ],
    evaluations: [{ uid: ana, judge: DEMO_UID.admin, scores: { c1: 8, c2: 7, c3: 9, c4: 8 } }],
  }),
  // Concluido: dos soluciones evaluadas por los dos jurados y resultados publicados con puntajes.
  extraChallenge({
    key: "conciliacion-bancaria",
    experienceTitle: "Challenge empresarial · Conciliación (demostración)",
    title: "Conciliación automática de extractos y libro contable",
    summary: "Cruzar extractos bancarios con el libro contable y señalar las diferencias que requieren revisión.",
    problem: "El equipo contable de una empresa ficticia concilia a mano cada cierre mensual y las diferencias llegan tarde. Necesita un prototipo que cruce movimientos sintéticos de un extracto y un libro, marque coincidencias y explique las diferencias.",
    deliverables: ["Repositorio y README", "Reporte de diferencias de ejemplo", "Defensa con trade-offs"],
    rubric: [
      { id: "c1", label: "Calidad del resultado", maxScore: 10, weight: 30 },
      { id: "c2", label: "Manejo de casos límite", maxScore: 10, weight: 25 },
      { id: "c3", label: "Claridad del enfoque", maxScore: 10, weight: 20 },
      { id: "c4", label: "Claridad de la defensa", maxScore: 10, weight: 25 },
    ],
    commercialPackage: "completo",
    closesAt: "2026-10-15T23:59:00.000Z",
    status: "closed",
    participants: [
      { uid: sofia, enrollment: "approved", submission: "submitted", text: "Cruce por monto y fecha con tolerancia de dos días; las diferencias se agrupan por causa probable." },
      { uid: ana, enrollment: "approved", submission: "submitted", text: "Conciliación en dos pasadas: coincidencias exactas y luego aproximadas, con un reporte de partidas sin pareja." },
    ],
    evaluations: [
      { uid: sofia, judge: DEMO_UID.admin, scores: { c1: 7, c2: 8, c3: 7, c4: 8 } },
      { uid: sofia, judge: externo, scores: { c1: 8, c2: 7, c3: 8, c4: 7 } },
      { uid: ana, judge: DEMO_UID.admin, scores: { c1: 9, c2: 8, c3: 9, c4: 9 } },
      { uid: ana, judge: externo, scores: { c1: 8, c2: 9, c3: 9, c4: 9 } },
    ],
    resultsPublished: true,
  }),
];

const demoRecords: SeedRecord[] = [
  ...evaluationRecords(),
  ...participantRecords(demoJoven, DEMO_UID.joven, false),
  ...demoParticipants.flatMap((person) => participantRecords(person, seedId("user", person.key), true)),
  ...demoProposals,
  ...extraChallenges.flatMap((item) => item.records),
];
const demoOf = (collection: SeedRecord["collection"]): SeedRecord[] => demoRecords.filter((record) => record.collection === collection);

export const SEED_RECORDS = {
  organizations,
  experiences: [...experiences, ...extraChallenges.map((item) => item.experience)],
  challenges: [...challenges, ...extraChallenges.map((item) => item.challenge)],
  users: demoOf("users"),
  enrollments: demoOf("enrollments"),
  participations: demoOf("participations"),
  submissions: demoOf("submissions"),
  defenses: demoOf("defenses"),
  shortlists: demoOf("shortlists"),
  contactRequests: demoOf("contactRequests"),
  companyProposals: demoOf("companyProposals"),
  checkpoints: demoOf("checkpoints"),
  feedbacks: demoOf("feedbacks"),
  judgeAssignments: demoOf("judgeAssignments"),
  evaluations: demoOf("evaluations"),
  results: demoOf("results"),
} as const;

export function validateSeedRecords(records: readonly SeedRecord[]): void {
  const ids = new Set<string>();
  for (const record of records) {
    if (!record || !(SEED_COLLECTIONS as readonly string[]).includes(record.collection) || !record.id.startsWith("seed_") || typeof record.data !== "object") {
      throw new Error("Registro de seed inválido.");
    }
    if (ids.has(`${record.collection}/${record.id}`)) throw new Error(`Registro de seed duplicado: ${record.collection}/${record.id}.`);
    ids.add(`${record.collection}/${record.id}`);
  }
}

validateSeedRecords(Object.values(SEED_RECORDS).flat());
