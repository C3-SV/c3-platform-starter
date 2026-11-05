"use client";

import { useEffect, useRef, useState } from "react";
import { CatalogCard, CatalogCardSkeleton, type CatalogCardData } from "@/components/CatalogCard";
import type { ExperienceKind, ExperienceLine } from "@/lib/domain/types";

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

/** Cards are revealed in batches as the reader scrolls; the catalog itself is already loaded. */
const BATCH = 6;

/** Maps the visible card state to the filter. "En evaluación" and "En desarrollo" only show with "Cualquier estado". */
function estadoOf(card: CatalogCardData): Estado | "otro" {
  if (card.state.label === "Abierto") return "abierto";
  if (card.state.label === "Próximo") return "proximo";
  if (card.state.label === "Concluido") return "concluido";
  return "otro";
}

/** Type, line, state and demo filters over the public catalog. It never changes what exists, only what is shown. */
export function FiltrosExplorar({ cards }: { cards: CatalogCardData[] }) {
  const [tipo, setTipo] = useState<"todos" | ExperienceKind>("todos");
  const [linea, setLinea] = useState<"todas" | ExperienceLine>("todas");
  const [estado, setEstado] = useState<Estado>("todos");
  const [soloDemo, setSoloDemo] = useState(false);
  const [limit, setLimit] = useState(BATCH);
  const sentinel = useRef<HTMLDivElement>(null);

  const visibles = cards.filter((card) => {
    if (tipo !== "todos" && card.kind !== tipo) return false;
    if (linea !== "todas" && card.line !== linea) return false;
    if (estado !== "todos" && estadoOf(card) !== estado) return false;
    if (soloDemo && !card.demo) return false;
    return true;
  });
  const shown = visibles.slice(0, limit);
  const hasMore = visibles.length > shown.length;
  const hayFiltros = tipo !== "todos" || linea !== "todas" || estado !== "todos" || soloDemo;

  useEffect(() => {
    const node = sentinel.current;
    if (!hasMore || !node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setLimit((current) => current + BATCH);
    }, { rootMargin: "200px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, limit]);

  // Any filter change starts again from the first batch.
  const filtered = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setLimit(BATCH);
  };

  return (
    <section aria-label="Filtros del catálogo">
      <form className="c3-filters" onSubmit={(event) => event.preventDefault()}>
        <div className="c3-field-group">
          <label htmlFor="filtro-tipo" className="c3-etiqueta-campo">Tipo</label>
          <select id="filtro-tipo" className="c3-campo" value={tipo} onChange={(event) => filtered(setTipo)(event.target.value as "todos" | ExperienceKind)}>
            <option value="todos">Todos los tipos</option>
            {TIPOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="c3-field-group">
          <label htmlFor="filtro-linea" className="c3-etiqueta-campo">Línea</label>
          <select id="filtro-linea" className="c3-campo" value={linea} onChange={(event) => filtered(setLinea)(event.target.value as "todas" | ExperienceLine)}>
            <option value="todas">Todas las líneas</option>
            {LINEAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="c3-field-group">
          <label htmlFor="filtro-estado" className="c3-etiqueta-campo">Estado</label>
          <select id="filtro-estado" className="c3-campo" value={estado} onChange={(event) => filtered(setEstado)(event.target.value as Estado)}>
            {ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <label className="c3-checkbox">
          <input type="checkbox" checked={soloDemo} onChange={(event) => filtered(setSoloDemo)(event.target.checked)} />
          Solo datos demostrativos
        </label>
      </form>

      <div className="c3-results__bar">
        <p role="status" className="c3-results__count">
          Mostrando <b>{shown.length}</b> de <b>{visibles.length}</b> {visibles.length === 1 ? "experiencia" : "experiencias"}
          {hayFiltros ? ` · ${cards.length} en total` : ""}
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
              setLimit(BATCH);
            }}
          >
            Quitar filtros
          </button>
        ) : null}
      </div>

      {visibles.length === 0 ? (
        <p className="c3-empty-card">Ninguna experiencia coincide con estos filtros. Prueba quitar alguno.</p>
      ) : (
        <>
          <div className="c3-featured__grid">
            {shown.map((card) => <CatalogCard key={card.key} card={card} />)}
            {hasMore ? Array.from({ length: Math.min(3, visibles.length - shown.length) }, (_, index) => <CatalogCardSkeleton key={index} />) : null}
          </div>
          {hasMore ? (
            <div ref={sentinel} className="c3-catalog__status">Cargando más experiencias…</div>
          ) : visibles.length > BATCH ? (
            <p className="c3-catalog__status">Ya viste todas las experiencias.</p>
          ) : null}
        </>
      )}
    </section>
  );
}
