import type { NextConfig } from "next";

// La raíz de Turbopack se fija en este proyecto: hay otro pnpm-workspace.yaml en el directorio padre del usuario.
const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  // La evaluación tiene una sola dirección canónica (/mi-c3/evaluar/[id]). Las anteriores siguen existiendo
  // como redirecciones temporales para no romper enlaces guardados ni invitaciones ya enviadas. La
  // autorización la sigue haciendo el servidor al abrir la dirección canónica.
  async redirects() {
    return [
      { source: "/evaluar/:challengeId", destination: "/mi-c3/evaluar/:challengeId", permanent: false },
      { source: "/empresa/retos/:challengeId/evaluacion", destination: "/mi-c3/evaluar/:challengeId", permanent: false },
    ];
  },
};

export default nextConfig;
