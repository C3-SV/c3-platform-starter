"use client";

import { useEffect, useState } from "react";
import { StatePill } from "@/components/StatePill";
import { useSession } from "@/lib/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/domain/format";
import type { ContactForMe } from "@/lib/server/talent";

const ACCIONES: Record<string, { label: string; tone: "primario" | "contorno" }> = {
  aceptado: { label: "Aceptar contacto", tone: "primario" },
  declinado: { label: "Declinar", tone: "contorno" },
  revocado: { label: "Revocar mi permiso", tone: "contorno" },
};

/**
 * Solicitudes de contacto que recibí de empresas (J9). Nada se envía por correo: la empresa solo puede
 * contactarme si acepto. Revocar mi permiso cierra la solicitud. Si no hay solicitudes, la sección no aparece.
 */
export function ContactosPanel() {
  const { session } = useSession();
  const signedIn = session.status === "signed-in";
  const [contacts, setContacts] = useState<ContactForMe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    apiRequest<{ contacts: ContactForMe[] }>("/api/contactos").then(
      (data) => {
        if (active) setContacts(data.contacts);
      },
      (caught: unknown) => {
        if (active) setError(caught instanceof ApiError ? caught.message : "No pudimos cargar tus solicitudes de contacto.");
      },
    );
    return () => {
      active = false;
    };
  }, [signedIn]);

  async function responder(requestId: string, to: string) {
    setBusyId(requestId);
    setError(null);
    try {
      const data = await apiRequest<{ contact: { id: string; status: string } }>(`/api/contactos/${requestId}`, { method: "PATCH", body: { to } });
      const refreshed = await apiRequest<{ contacts: ContactForMe[] }>("/api/contactos");
      setContacts(refreshed.contacts);
      return data;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No pudimos guardar tu respuesta. Intentá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  if (!signedIn || contacts.length === 0) return error ? <div className="c3-alerta c3-alerta--error" role="alert">{error}</div> : null;

  return (
    <section aria-labelledby="contactos-titulo" className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-conecta)" }}>Conecta</span>
        <h2 id="contactos-titulo" className="c3-titulo" style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 600 }}>Solicitudes de contacto</h2>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
          Una empresa pidió conversar con vos por tu trabajo. Solo se comparte contacto si aceptás. Aceptar no es una oferta de empleo.
        </p>
      </div>
      {error ? <div className="c3-alerta c3-alerta--error" role="alert">{error}</div> : null}
      {contacts.map((contact) => (
        <article key={contact.id} style={{ borderTop: "1px solid var(--c3-borde)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{contact.organizationName}</span>
            <StatePill state={contact.state} />
          </div>
          <span style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>
            Challenge: {contact.challengeTitle} · Actualizado {formatDateTime(contact.updatedAt) ?? ""}
          </span>
          {contact.message ? <p style={{ fontSize: 14, lineHeight: 1.5 }}><strong>Mensaje de la empresa:</strong> {contact.message}</p> : null}
          {contact.actions.length > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {contact.actions.map((to) => (
                <button
                  key={to}
                  type="button"
                  className={`c3-btn c3-btn--${ACCIONES[to]?.tone ?? "contorno"}`}
                  disabled={busyId === contact.id}
                  onClick={() => void responder(contact.id, to)}
                >
                  {ACCIONES[to]?.label ?? to}
                </button>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
