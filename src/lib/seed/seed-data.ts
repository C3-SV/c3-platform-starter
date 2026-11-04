import type { ExperienceKind, ExperienceLine, ExperienceStatus } from "../domain/types.ts";
import { contactRequestDocId, enrollmentDocId, participationDocId } from "../server/ids.ts";
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
] as const;

export interface SeedRecord {
  collection: (typeof SEED_COLLECTIONS)[number];
  id: string;
  data: Record<string, unknown>;
}

// v2 (3-nov-2026): línea Conecta para el challenge empresarial, nombre y rúbrica del reto demostrativo y paquete comercial.
// Un documento ya aplicado con v1 aparece como conflicto en buildSeedPlan: no se sobrescribe sin una migración explícita.
const SEED_VERSION = 2;
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
      // Rúbrica demostrativa: el modelo usa puntajes enteros por criterio (1–10). Los pesos del paquete no se codifican aquí.
      rubric: [
        { id: "c1", label: "Comprensión del problema", maxScore: 10 },
        { id: "c2", label: "Solución funcional y pruebas", maxScore: 10 },
        { id: "c3", label: "Criterio técnico y decisiones", maxScore: 10 },
        { id: "c4", label: "Claridad de la defensa", maxScore: 10 },
      ],
      organizationName: "Empresa de demostración C3",
      commercialPackage: "completo",
      allows: ["individual", "team"],
      teamMinSize: 2,
      teamMaxSize: 4,
      submissionClosesAt: "2026-12-31T23:59:00.000Z",
      status: "published",
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

const demoRecords: SeedRecord[] = [
  ...participantRecords(demoJoven, DEMO_UID.joven, false),
  ...demoParticipants.flatMap((person) => participantRecords(person, seedId("user", person.key), true)),
  ...demoProposals,
];
const demoOf = (collection: SeedRecord["collection"]): SeedRecord[] => demoRecords.filter((record) => record.collection === collection);

export const SEED_RECORDS = {
  organizations,
  experiences,
  challenges,
  users: demoOf("users"),
  enrollments: demoOf("enrollments"),
  participations: demoOf("participations"),
  submissions: demoOf("submissions"),
  defenses: demoOf("defenses"),
  shortlists: demoOf("shortlists"),
  contactRequests: demoOf("contactRequests"),
  companyProposals: demoOf("companyProposals"),
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
