import { MiC3Panel } from "./MiC3Panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi C3" };

/** V05 · Mi C3 (inicio). */
export default function MiC3Page() {
  return <MiC3Panel />;
}
