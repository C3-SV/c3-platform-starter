import Image from "next/image";
import type { ExperienceLine } from "@/lib/domain/types";

const lineLogoSrc: Record<ExperienceLine, string> = {
  compite: "/brand/lines/compite.png",
  crea: "/brand/lines/crea.png",
  conecta: "/brand/lines/conecta.png",
};

const lineLogoAlt: Record<ExperienceLine, string> = {
  compite: "Identidad visual de Compite",
  crea: "Identidad visual de Crea",
  conecta: "Identidad visual de Conecta",
};

/** C3 logo. `tone="white"` is the version for navy backgrounds, such as the site footer. */
export function C3BrandMark({ className = "", priority = false, tone = "blue" }: { className?: string; priority?: boolean; tone?: "blue" | "white" }) {
  const src = tone === "white" ? "/brand/c3/logo-simple-blanco.png" : "/brand/c3/c3-sim-azul.png";
  return (
    <span className={`c3-brand-mark ${className}`.trim()}>
      <Image src={src} alt="C3, ir al inicio" width={2920} height={1234} priority={priority} />
    </span>
  );
}

/** Compite, Crea or Conecta logo. Pass `eager` when it sits above the fold, as in the line page hero. */
export function LineBrandMark({ line, className = "", decorative = false, eager = false }: { line: ExperienceLine; className?: string; decorative?: boolean; eager?: boolean }) {
  return (
    <span className={`c3-line-mark c3-line-mark--${line} ${className}`.trim()}>
      <Image src={lineLogoSrc[line]} alt={decorative ? "" : lineLogoAlt[line]} width={2070} height={2150} loading={eager ? "eager" : undefined} />
    </span>
  );
}
