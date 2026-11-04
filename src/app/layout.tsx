import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  // Cada página aporta su propio título; la plantilla agrega el nombre del producto para distinguir pestañas e historial.
  title: { default: "C3 Challenges · Descubrí talento a través de challenges reales", template: "%s · C3 Platform" },
  description: "C3 conecta empresas con talento joven mediante challenges que hacen visibles el entregable, el proceso y el criterio técnico.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* Hoja de fuentes tal cual la usa el diseño de Claude (Montserrat y Poppins). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Poppins:wght@400;500;600&display=swap" />
      </head>
      <body>
        <a href="#contenido" className="c3-saltar">Saltar al contenido</a>
        {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "c3-platform-demo" ? (
          <div role="note" style={{ background: "var(--c3-advertencia)", color: "#111111", fontSize: 13, fontWeight: 600, textAlign: "center", padding: "6px 16px" }}>
            Entorno de demostración: datos inventados, sin cobros ni contratos, y sin envío de correos.
          </div>
        ) : null}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
