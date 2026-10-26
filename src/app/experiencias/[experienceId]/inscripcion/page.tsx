import { notFound } from "next/navigation";
import { experienceLabel } from "@/lib/domain/presentation";
import { database } from "@/lib/server/context";
import { getPublicExperience } from "@/lib/server/catalog";
import { HttpError } from "@/lib/server/errors";
import { InscripcionExperienciaPanel, type InscripcionExperiencia } from "./InscripcionExperienciaPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inscripción" };

export const dynamic = "force-dynamic";

/** Inscripción a una experiencia sin challenges publicados. Los datos son públicos; la inscripción propia se consulta en el cliente. */
export default async function InscripcionExperienciaPage({ params }: { params: Promise<{ experienceId: string }> }) {
  const { experienceId } = await params;
  let detail;
  try {
    detail = await getPublicExperience(database(), experienceId, new Date());
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const { experience, state, registration } = detail;
  if (experience.status !== "published") notFound();
  const data: InscripcionExperiencia = {
    id: experience.id,
    title: experience.title,
    label: experienceLabel(experience),
    state,
    registrationOpen: registration.open,
    direct: registration.direct,
    full: registration.full,
    spotsLeft: registration.spotsLeft,
    capacity: experience.capacity ?? null,
    startsAt: experience.startsAt ?? null,
    endsAt: experience.endsAt ?? null,
    modality: experience.modality ?? null,
    location: experience.location ?? null,
    registrationClosesAt: experience.registrationClosesAt,
  };
  return <InscripcionExperienciaPanel experience={data} />;
}
