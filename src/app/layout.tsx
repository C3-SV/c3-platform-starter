import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  // Cada página aporta su propio título; la plantilla agrega el nombre del producto para distinguir pestañas e historial.
  title: { default: "C3 Platform", template: "%s · C3 Platform" },
  description: "Compite. Crea. Conecta. Challenges reales de empresas y competencias técnicas para jóvenes.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
