"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const LINES = {
  compite: { title: "Compite", text: "Mide tus habilidades en competencias y challenges técnicos.", href: "/compite" },
  crea: { title: "Crea", text: "Convierte ideas en proyectos y soluciones reales.", href: "/crea" },
  conecta: { title: "Conecta", text: "Muestra tus capacidades a empresas mediante evidencia de tu trabajo.", href: "/conecta" },
} as const;

type LineKey = keyof typeof LINES;

/** Home hero visual: the C3 symbol in orbit. Each dot of the symbol opens a short card about its line. */
export function HomeOrbit() {
  const [active, setActive] = useState<LineKey | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keep = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };
  const show = (key: LineKey) => {
    keep();
    setActive(key);
  };
  // A short delay lets the pointer travel from the dot to the card without closing it.
  const hide = () => {
    keep();
    hideTimer.current = setTimeout(() => setActive(null), 160);
  };

  const line = active ? LINES[active] : null;

  return (
    <div className="c3-orbit-visual">
      <div className="c3-orbit">
        <span className="c3-orbit__ring c3-orbit__ring--outer" aria-hidden="true" />
        <span className="c3-orbit__ring c3-orbit__ring--inner" aria-hidden="true" />
        <span className="c3-orbit__spin c3-orbit__spin--outer" aria-hidden="true">
          <span className="c3-orbit__satellite" />
          <span className="c3-orbit__satellite c3-orbit__satellite--bottom c3-orbit__satellite--compite" />
        </span>
        <span className="c3-orbit__spin c3-orbit__spin--inner" aria-hidden="true">
          <span className="c3-orbit__satellite c3-orbit__satellite--bottom c3-orbit__satellite--crea" />
        </span>
        <div className="c3-orbit__mark">
          <Image src="/brand/c3/c3-symbol.png" alt="" width={520} height={540} priority />
          {(Object.keys(LINES) as LineKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`c3-orbit__hotspot c3-orbit__hotspot--${key}`}
              aria-label={LINES[key].title}
              aria-pressed={active === key}
              aria-controls="c3-orbit-bubble"
              onMouseEnter={() => show(key)}
              onFocus={() => show(key)}
              onClick={() => show(key)}
              onMouseLeave={hide}
              onBlur={hide}
            />
          ))}
        </div>
      </div>
      <div
        className="c3-bubble"
        id="c3-orbit-bubble"
        aria-live="polite"
        hidden={!line}
        onMouseEnter={keep}
        onFocus={keep}
        onMouseLeave={hide}
        onBlur={hide}
      >
        {line ? (
          <>
            <h3>{line.title}</h3>
            <p>{line.text}</p>
            <Link href={line.href}>Conocer {line.title} <span aria-hidden="true">↗</span></Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
