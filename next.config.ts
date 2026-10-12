import type { NextConfig } from "next";

// La raíz de Turbopack se fija en este proyecto: hay otro pnpm-workspace.yaml en el directorio padre del usuario.
const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
