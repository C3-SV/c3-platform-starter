import { TrayectoriaPanel } from "./TrayectoriaPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trayectoria" };

/** V08 · Perfil y trayectoria. */
export default function TrayectoriaPage() {
  return <TrayectoriaPanel />;
}
