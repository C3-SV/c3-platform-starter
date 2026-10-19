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

export function C3BrandMark({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={`c3-brand-mark ${className}`.trim()}>
      <Image src="/brand/c3/c3-sim-azul.png" alt="C3, ir al inicio" width={2920} height={1234} priority={priority} />
    </span>
  );
}

export function LineBrandMark({ line, className = "", decorative = false }: { line: ExperienceLine; className?: string; decorative?: boolean }) {
  return (
    <span className={`c3-line-mark c3-line-mark--${line} ${className}`.trim()}>
      <Image src={lineLogoSrc[line]} alt={decorative ? "" : lineLogoAlt[line]} width={2070} height={2150} />
    </span>
  );
}
