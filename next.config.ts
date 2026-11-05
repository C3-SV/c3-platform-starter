import type { NextConfig } from "next";
import { coverRemotePatterns } from "./src/lib/domain/coverImage.ts";

// Turbopack's root is pinned to this project: there's another pnpm-workspace.yaml in the user's parent folder.
const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  // Cover images by link: the platform only fetches and serves C3 hosts, the same list validation accepts.
  images: { remotePatterns: coverRemotePatterns() },
  /*
   * Evaluation has a single canonical address (/mi-c3/evaluar/[id]). The old ones stay as temporary
   * redirects so saved links and sent invitations keep working; the server still authorizes the canonical one.
   */
  async redirects() {
    return [
      { source: "/evaluar/:challengeId", destination: "/mi-c3/evaluar/:challengeId", permanent: false },
      { source: "/empresa/retos/:challengeId/evaluacion", destination: "/mi-c3/evaluar/:challengeId", permanent: false },
    ];
  },
};

export default nextConfig;
