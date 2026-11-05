"use client";

import { useState } from "react";
import { CatalogCard, type CatalogCardData } from "@/components/CatalogCard";

const PAGE_SIZE = 6;

/** Home featured experiences, six per page. The whole public catalog is already loaded; this only pages it. */
export function FeaturedGrid({ cards }: { cards: CatalogCardData[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const visible = cards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <div className="c3-featured__grid">
        {visible.map((card) => <CatalogCard key={card.key} card={card} />)}
      </div>
      {pages > 1 ? (
        <nav className="c3-pagination" aria-label="Páginas de experiencias">
          <button type="button" className="c3-pagination__button" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              className="c3-pagination__button"
              aria-current={index === page ? "page" : undefined}
              aria-label={`Página ${index + 1}`}
              onClick={() => setPage(index)}
            >
              {index + 1}
            </button>
          ))}
          <button type="button" className="c3-pagination__button" aria-label="Página siguiente" disabled={page === pages - 1} onClick={() => setPage(page + 1)}>›</button>
        </nav>
      ) : null}
    </>
  );
}
