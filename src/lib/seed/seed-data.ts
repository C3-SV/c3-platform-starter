import type { ExperienceKind, ExperienceLine, ExperienceStatus } from "../domain/types.ts";

export interface SeedRecord {
  collection: "experiences" | "challenges";
  id: string;
  data: Record<string, unknown>;
}

const SEED_VERSION = 1;
const MANAGED_BY = "c3-seed";

export function seedId(collection: SeedRecord["collection"] | "experience" | "challenge", key: string): string {
  const namespace = collection === "experience" ? "experience" : collection === "challenge" ? "challenge" : collection;
  return `seed_${namespace}_${key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

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
    primaryLine: "crea",
    secondaryLines: ["conecta"],
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

const demoChallengeExperienceId = seedId("experience", "challenge-empresarial-demo");
const challenges: SeedRecord[] = [
  {
    collection: "challenges",
    id: seedId("challenge", "empresa-demostracion-rutas"),
    data: {
      experienceId: demoChallengeExperienceId,
      title: "Rutas sostenibles para una empresa ficticia",
      summary: "Prototipar una herramienta que ayude a planificar rutas con menos desperdicio.",
      problem: "Una empresa ficticia necesita explorar cómo convertir datos operativos en decisiones de ruta más sostenibles.",
      deliverables: ["Repositorio con instrucciones", "Demo o prototipo funcional"],
      rubric: [
        { id: "c1", label: "Comprensión del problema", maxScore: 10 },
        { id: "c2", label: "Calidad de la solución", maxScore: 10 },
      ],
      organizationName: "Empresa de demostración C3",
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

export const SEED_RECORDS = { experiences, challenges } as const;

export function validateSeedRecords(records: readonly SeedRecord[]): void {
  const ids = new Set<string>();
  for (const record of records) {
    if (!record || !["experiences", "challenges"].includes(record.collection) || !record.id.startsWith("seed_") || typeof record.data !== "object") {
      throw new Error("Registro de seed inválido.");
    }
    if (ids.has(`${record.collection}/${record.id}`)) throw new Error(`Registro de seed duplicado: ${record.collection}/${record.id}.`);
    ids.add(`${record.collection}/${record.id}`);
  }
}

validateSeedRecords([...SEED_RECORDS.experiences, ...SEED_RECORDS.challenges]);
