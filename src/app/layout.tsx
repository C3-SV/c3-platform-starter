import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  // Each page brings its own title; the template appends the product name so tabs and history stay distinguishable.
  title: { default: "C3 Challenges · Descubre talento a través de challenges reales", template: "%s · C3 Platform" },
  description: "C3 conecta empresas con talento joven mediante challenges que hacen visibles el entregable, el proceso y el criterio técnico.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* Same font sheet the Claude design uses (Montserrat and Poppins). */}
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
