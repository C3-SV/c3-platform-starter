import { LineLandingPage } from "@/components/LineLandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conecta" };

export const dynamic = "force-dynamic";

export default function ConectaPage() {
  return <LineLandingPage line="conecta" />;
}
