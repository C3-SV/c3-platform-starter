import { CuentaPanel } from "./CuentaPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cuenta" };

/** Gestión de cuenta, datos autodeclarados y seguridad de Firebase Authentication. */
export default function CuentaPage() {
  return <CuentaPanel />;
}
