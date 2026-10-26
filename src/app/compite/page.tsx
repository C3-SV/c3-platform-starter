import { LineLandingPage } from "@/components/LineLandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Compite" };

export const dynamic = "force-dynamic";

export default function CompitePage() {
  return <LineLandingPage line="compite" />;
}
