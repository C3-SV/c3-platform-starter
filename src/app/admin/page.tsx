import { AdminPanel } from "./AdminPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administración" };

/** V12 · C3 Admin. El control de acceso lo hace el panel con el token verificado en cada llamada a la API. */
export default function AdminPage() {
  return <AdminPanel />;
}
