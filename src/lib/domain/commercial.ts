/**
 * Paquetes comerciales de los challenges empresariales (modelo B2B por proyecto).
 * Fuente única para la interfaz, el seed y la documentación. Son tarifas de referencia:
 * en la demo no hay contrato, cobro ni checkout.
 */

export type CommercialPackageId = "esencial" | "completo" | "destacado";

export interface CommercialPackage {
  id: CommercialPackageId;
  label: string;
  referenceFeeUsd: number;
  /** Profundidad del acompañamiento que compra la empresa. */
  depth: string;
  /** Valor observable: qué puede hacer la empresa con el resultado. */
  companyValue: string;
  includes: string[];
}

export const COMMERCIAL_PACKAGES: readonly CommercialPackage[] = [
  {
    id: "esencial",
    label: "Esencial",
    referenceFeeUsd: 800,
    depth: "Reto corto, definición acotada, convocatoria C3, entregas y evaluación básica.",
    companyValue: "Observar talento en un reto acotado y acceder a entregas ordenadas para revisarlas.",
    includes: ["Definición acotada del problema", "Convocatoria y gestión por C3", "Entregas y evaluación básica"],
  },
  {
    id: "completo",
    label: "Completo",
    referenceFeeUsd: 1500,
    depth: "Más seguimiento, rúbrica ajustada, reporte por persona y lista corta.",
    companyValue: "Comparar perfiles con más información para decidir los próximos pasos.",
    includes: ["Rúbrica ajustada al problema", "Reporte por persona", "Lista corta de perfiles"],
  },
  {
    id: "destacado",
    label: "Destacado",
    referenceFeeUsd: 3000,
    depth: "Convocatoria selectiva y abierta, coevaluación más profunda, defensa técnica, comparación de perfiles y seguimiento de contactos.",
    companyValue: "Evaluación integral con defensa técnica y acompañamiento para vincular talento con la empresa.",
    includes: ["Convocatoria selectiva y abierta", "Defensa técnica y coevaluación", "Seguimiento de contactos a 30 y 90 días"],
  },
];

/** Condiciones que aplican a todos los paquetes. Se muestran junto a la tarifa, no se ocultan. */
export const COMMERCIAL_CONDITIONS: readonly string[] = [
  "La empresa revisa las entregas de su reto en todos los paquetes.",
  "Contactar talento con consentimiento forma parte de la promesa general; el paquete define cuánto acompañamiento incluye.",
  "No garantizamos un volumen de soluciones, una cantidad de contrataciones ni horas de mentoría no medidas.",
  "Los premios y las licencias o propiedad intelectual no están incluidos: se acuerdan expresamente por reto.",
  "Las tarifas son de referencia y el modelo es por proyecto. No es una suscripción.",
];

export const COMMERCIAL_DEMO_NOTE = "Paquete de demostración: sin contrato, sin cobro y sin acuerdo comercial real.";

export function commercialPackageOf(id: unknown): CommercialPackage | null {
  return COMMERCIAL_PACKAGES.find((item) => item.id === id) ?? null;
}

/** Devuelve el identificador de paquete si pertenece a la lista cerrada; si no, null. */
export function parseCommercialPackageId(input: unknown): CommercialPackageId | null {
  return commercialPackageOf(input)?.id ?? null;
}

/** Formatea una tarifa en dólares con separador de miles: 1500 → «US$1,500». */
export function formatUsd(amount: number): string {
  return `US$${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
