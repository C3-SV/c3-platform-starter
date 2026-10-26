import { LineLandingPage } from "@/components/LineLandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crea" };

export const dynamic = "force-dynamic";

export default function CreaPage() {
  return <LineLandingPage line="crea" />;
}
