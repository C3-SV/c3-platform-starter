"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import type { FeedbackView } from "@/lib/server/talent";

/**
 * Retroalimentación de la empresa (J8). Solo aparece cuando la empresa la publica; un borrador nunca llega aquí.
 */
export function RetroalimentacionCard({ challengeId }: { challengeId: string }) {
  const [feedback, setFeedback] = useState<FeedbackView | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ feedback: FeedbackView | null }>(`/api/retos/${challengeId}/retroalimentacion`).then(
      (data) => {
        if (active) setFeedback(data.feedback);
      },
      () => {
        if (active) setFeedback(null);
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  if (!feedback) return null;

  return (
    <section aria-labelledby="retroalimentacion-titulo" className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <span className="c3-etiqueta" style={{ color: "var(--c3-exito)" }}>Retroalimentación</span>
      <h2 id="retroalimentacion-titulo" className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>Lo que dijo la empresa sobre tu entrega</h2>
      <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>{feedback.text}</p>
      <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>Publicada {formatDateTime(feedback.publishedAt) ?? ""}</span>
    </section>
  );
}
