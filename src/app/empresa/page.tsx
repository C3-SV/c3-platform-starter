import { EmpresaPanel } from "./EmpresaPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Espacio de empresa" };

/** V09 · Espacio de empresa. */
export default function EmpresaPage() {
  return <EmpresaPanel />;
}
