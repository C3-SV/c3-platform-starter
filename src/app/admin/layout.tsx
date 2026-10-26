import type { ReactNode } from "react";
import { AdminGate } from "./AdminGate";

/** Consola de administración: un solo marco (cabecera, menú lateral y datos compartidos) para todas las secciones. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
