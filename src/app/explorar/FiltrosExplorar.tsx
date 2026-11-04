"use client";

import Link from "next/link";
import { useState } from "react";
import { StatePill } from "@/components/StatePill";
import { lineColorOf, lineTextColorOf, type PresentedState } from "@/lib/domain/presentation";
import type { ExperienceKind, ExperienceLine } from "@/lib/domain/types";

/** Tarjeta del catálogo ya preparada en el servidor. Solo datos serializables. */
export interface ExploreCard {
  key: string;
  href: string;
  kind: ExperienceKind;
  line: ExperienceLine;
  label: string;
  state: PresentedState;
  title: string;
  summary: string;
  footer: string;
  detail: string | null;
  demo: boolean;
}

const TIPOS: { value: ExperienceKind; label: string }[] = [
  { value: "competencia", label: "Competencia" },
  { value: "hackathon", label: "Hackathon" },
  { value: "challenge_empresarial", label: "Challenge empresarial" },
];

const LINEAS: { value: ExperienceLine; label: string }[] = [
  { value: "compite", label: "Compite" },
  { value: "crea", label: "Crea" },
  { value: "conecta", label: "Conecta" },
];

type Estado = "todos" | "abierto" | "proximo" | "concluido";
const ESTADOS: { value: Estado; label: string }[] = [
  { value: "todos", label: "Cualquier estado" },
  { value: "abierto", label: "Abierto" },
  { value: "proximo", label: "Próximo" },
  { value: "concluido", label: "Concluido" },
];

/** Estado visible de la tarjeta, mapeado al filtro. «En evaluación» y «En desarrollo» solo aparecen con «Cualquier estado». */
function estadoOf(card: ExploreCard): Estado | "otro" {
  if (card.state.label === "Abierto") return "abierto";
  if (card.state.label === "Próximo") return "proximo";
  if (card.state.label === "Concluido") return "concluido";
  return "otro";
}

/** Filtros de tipo, línea, estado y demo sobre el catálogo público. No cambia qué existe: solo cuáles se muestran. */
export function FiltrosExplorar({ cards }: { cards: ExploreCard[] }) {
  const [tipo, setTipo] = useState<"todos" | ExperienceKind>("todos");
  const [linea, setLinea] = useState<"todas" | ExperienceLine>("todas");
  const [estado, setEstado] = useState<Estado>("todos");
  const [soloDemo, setSoloDemo] = useState(false);

  const visibles = cards.filter((card) => {
    if (tipo !== "todos" && card.kind !== tipo) return false;
    if (linea !== "todas" && card.line !== linea) return false;
    if (estado !== "todos" && estadoOf(card) !== estado) return false;
    if (soloDemo && !card.demo) return false;
    return true;
  });

  const hayFiltros = tipo !== "todos" || linea !== "todas" || estado !== "todos" || soloDemo;

  return (
    <section aria-label="Filtros del catálogo" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form className="c3-card" style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, alignItems: "end" }} onSubmit={(event) => event.preventDefault()}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="filtro-tipo" className="c3-etiqueta-campo">Tipo</label>
          <select id="filtro-tipo" className="c3-campo" value={tipo} onChange={(event) => setTipo(event.target.value as "todos" | ExperienceKind)}>
            <option value="todos">Todos los tipos</option>
            {TIPOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="filtro-linea" className="c3-etiqueta-campo">Línea</label>
          <select id="filtro-linea" className="c3-campo" value={linea} onChange={(event) => setLinea(event.target.value as "todas" | ExperienceLine)}>
            <option value="todas">Todas las líneas</option>
            {LINEAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="filtro-estado" className="c3-etiqueta-campo">Estado</label>
          <select id="filtro-estado" className="c3-campo" value={estado} onChange={(event) => setEstado(event.target.value as Estado)}>
            {ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14 }}>
          <input type="checkbox" checked={soloDemo} onChange={(event) => setSoloDemo(event.target.checked)} />
          Solo datos demostrativos
        </label>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <p role="status" style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
          Mostrando {visibles.length} de {cards.length} {cards.length === 1 ? "experiencia" : "experiencias"}.
        </p>
        {hayFiltros ? (
          <button
            type="button"
            className="c3-btn c3-btn--contorno"
            onClick={() => {
              setTipo("todos");
              setLinea("todas");
              setEstado("todos");
              setSoloDemo(false);
            }}
          >
            Quitar filtros
          </button>
        ) : null}
      </div>

      {visibles.length === 0 ? (
        <div className="c3-card" style={{ padding: 24 }}>
          <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Ninguna experiencia coincide con estos filtros. Probá quitar alguno.</p>
        </div>
      ) : (
        <div className="c3-grilla-tarjetas">
          {visibles.map((card) => (
            <Link key={card.key} href={card.href} className="c3-tarjeta-enlace">
              <div style={{ height: 6, background: lineColorOf(card.line) }} />
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="c3-etiqueta" style={{ color: lineTextColorOf(card.line) }}>{card.label}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {card.demo ? <span className="c3-etiqueta" style={{ color: "var(--c3-advertencia)" }}>DEMO</span> : null}
                    <StatePill state={card.state} />
                  </div>
                </div>
                <div className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>{card.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>{card.summary}</div>
                <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--c3-borde)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{card.footer}</span>
                  {card.detail ? <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{card.detail}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
