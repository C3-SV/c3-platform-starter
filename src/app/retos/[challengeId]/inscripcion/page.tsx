import { notFound } from "next/navigation";
import { presentState } from "@/lib/domain/presentation";
import { database } from "@/lib/server/context";
import { getPublicChallenge } from "@/lib/server/catalog";
import { HttpError } from "@/lib/server/errors";
import { InscripcionPanel, type InscripcionChallenge } from "./InscripcionPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inscripción" };

export const dynamic = "force-dynamic";

/** V06 · Inscripción individual. Los datos del challenge son públicos; la inscripción se consulta en el cliente con la sesión. */
export default async function InscripcionPage({ params }: { params: Promise<{ challengeId: string }> }) {
  const { challengeId } = await params;
  const now = new Date();
  let detail;
  try {
    detail = await getPublicChallenge(database(), challengeId, now);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
  const { challenge, experience, state } = detail;
  const challengeData: InscripcionChallenge = {
    id: challenge.id,
    title: challenge.title,
    organizationName: challenge.organizationName,
    allows: challenge.allows,
    teamMinSize: challenge.teamMinSize,
    teamMaxSize: challenge.teamMaxSize,
    kind: experience.kind,
    experienceTitle: experience.title,
    statePresented: presentState(challenge.status, { opensAt: experience.registrationOpensAt, closesAt: experience.registrationClosesAt }, now),
    registrationOpen: state.label === "Abierto",
    registrationClosesAt: experience.registrationClosesAt,
    submissionClosesAt: challenge.submissionClosesAt,
  };
  return <InscripcionPanel challenge={challengeData} />;
}
