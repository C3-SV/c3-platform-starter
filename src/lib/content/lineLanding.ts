import type { ExperienceLine } from "@/lib/domain/types";

export interface LineLandingContent {
  line: ExperienceLine;
  eyebrow: string;
  title: string;
  intro: string;
  whatTitle: string;
  what: string;
  participateTitle: string;
  participate: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
}

export const LINE_LANDING: Record<ExperienceLine, LineLandingContent> = {
  compite: {
    line: "compite",
    eyebrow: "Pensamiento lógico · programación · excelencia",
    title: "Compite",
    intro: "Entrená tu forma de pensar, resolvé problemas bajo presión y construí evidencia técnica que habla por vos.",
    whatTitle: "Qué hacemos",
    what: "Convertimos la competencia técnica en una experiencia de aprendizaje: programación competitiva, algoritmos y desafíos que te ayudan a medir tu progreso y aprender con otros.",
    participateTitle: "Cómo participar",
    participate: "Explorá las experiencias disponibles, revisá sus reglas, inscribite cuando la convocatoria esté abierta y sumá cada resultado a tu trayectoria C3.",
    ctaLabel: "Explorar competencias",
    ctaHref: "/explorar",
    accent: "var(--c3-compite)",
  },
  crea: {
    line: "crea",
    eyebrow: "Proyectos · hackathons · problemas reales",
    title: "Crea",
    intro: "Pasá de una idea a algo que se puede probar, compartir y mejorar.",
    whatTitle: "Qué significa crear en C3",
    what: "Crear es construir soluciones con tecnología: participar en hackathons, resolver challenges y convertir un problema real en un proyecto con entregables concretos.",
    participateTitle: "Cómo participar",
    participate: "Elegí un challenge, entendé el problema, formá tu equipo si corresponde, construí una solución y entregá evidencia dentro del plazo definido.",
    ctaLabel: "Descubrir challenges para crear",
    ctaHref: "/explorar",
    accent: "var(--c3-crea)",
  },
  conecta: {
    line: "conecta",
    eyebrow: "Comunidad técnica · instituciones · industria",
    title: "Conecta",
    intro: "Encontrá personas, organizaciones y experiencias que convierten el aprendizaje en oportunidades reales.",
    whatTitle: "Qué significa conectar",
    what: "C3 acerca a jóvenes, instituciones y empresas mediante experiencias de aprendizaje, encuentros y challenges con contexto. La conexión empieza en una experiencia compartida, no en una bolsa de trabajo.",
    participateTitle: "Empresas y comunidad",
    participate: "Una organización puede compartir un problema, colaborar en la definición de un challenge o acompañar una experiencia. C3 cuida el contexto, la participación y la trazabilidad.",
    ctaLabel: "Conocer cómo colaborar",
    ctaHref: "/empresa/proponer",
    accent: "var(--c3-conecta)",
  },
};
