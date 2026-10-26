"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import type { FieldIssue } from "@/lib/client/api";

interface Confirmation {
  reference: string;
  email: string;
  stored: boolean;
}

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/** V10 · Proponer challenge. Sin cuenta: el servidor valida, limita y guarda la propuesta antes de confirmarla. */
export function ProponerForm() {
  const [values, setValues] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    problem: "",
    desiredOutcome: "",
    constraints: "",
    website: "",
  });
  const [consent, setConsent] = useState(false);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues([]);
    setFormError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/propuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, consent }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 201) {
        setConfirmation({ reference: payload.proposal?.reference ?? "", email: values.contactEmail.trim(), stored: payload.proposal?.stored !== false });
        return;
      }
      setIssues(payload?.error?.issues ?? []);
      setFormError(payload?.error?.message ?? "No pudimos enviar la propuesta. Intentá de nuevo.");
    } catch {
      setFormError("No pudimos conectarnos. Revisá tu conexión y volvé a intentarlo. Tu propuesta no se envió.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <section className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }} role="status" aria-live="polite">
        <span className="c3-etiqueta" style={{ color: "var(--c3-exito)" }}>Propuesta recibida</span>
        <h2 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Recibimos tu propuesta</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6 }}>
          Tu código de referencia es <strong>{confirmation.reference}</strong>. C3 te escribirá a {confirmation.email}.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>
          Enviar no publica nada. C3 revisa tu propuesta y define el challenge contigo antes de que se vea.
        </p>
        <Link href="/explorar" className="c3-btn c3-btn--contorno" style={{ alignSelf: "flex-start" }}>Explorar challenges publicados</Link>
      </section>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="c3-card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <div className="c3-form-dos" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
        <Campo id="p-org" label="Organización" error={issueFor(issues, "companyName")}>
          <input id="p-org" className={`c3-campo${issueFor(issues, "companyName") ? " c3-campo--error" : ""}`} value={values.companyName} onChange={(event) => update("companyName", event.target.value)} />
        </Campo>
        <Campo id="p-nombre" label="Tu nombre y cargo" error={issueFor(issues, "contactName")}>
          <input id="p-nombre" className={`c3-campo${issueFor(issues, "contactName") ? " c3-campo--error" : ""}`} value={values.contactName} onChange={(event) => update("contactName", event.target.value)} />
        </Campo>
      </div>

      <Campo id="p-correo" label="Correo de contacto" error={issueFor(issues, "contactEmail")} help="Usaremos este medio para responderte.">
        <input id="p-correo" type="email" autoComplete="email" className={`c3-campo${issueFor(issues, "contactEmail") ? " c3-campo--error" : ""}`} value={values.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} />
      </Campo>

      <div style={{ height: 1, background: "var(--c3-borde)" }} />

      <Campo id="p-problema" label="¿Cuál es el problema?" error={issueFor(issues, "problem")} help="Qué pasa hoy, quién lo sufre y qué es lo más difícil.">
        <textarea id="p-problema" rows={4} className={`c3-campo${issueFor(issues, "problem") ? " c3-campo--error" : ""}`} value={values.problem} onChange={(event) => update("problem", event.target.value)} />
      </Campo>

      <Campo id="p-objetivo" label="¿Qué resultado les gustaría explorar?" error={issueFor(issues, "desiredOutcome")}>
        <textarea id="p-objetivo" rows={3} className="c3-campo" value={values.desiredOutcome} onChange={(event) => update("desiredOutcome", event.target.value)} />
      </Campo>

      <Campo id="p-limites" label="Datos disponibles y límites de confidencialidad" error={issueFor(issues, "constraints")} help="Opcional, pero ayuda a definir qué se puede publicar.">
        <textarea id="p-limites" rows={3} className="c3-campo" value={values.constraints} onChange={(event) => update("constraints", event.target.value)} />
      </Campo>

      {/* Campo trampa: los bots lo completan; las personas no lo ven ni lo llenan. */}
      <div aria-hidden="true" className="c3-visualmente-oculto">
        <label htmlFor="p-web">Sitio web (no completar)</label>
        <input id="p-web" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => update("website", event.target.value)} />
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--c3-accion)", marginTop: 2, flexShrink: 0 }} aria-invalid={Boolean(issueFor(issues, "consent"))} />
        <span>Acepto que C3 me contacte por este correo sobre la propuesta.</span>
      </label>
      {issueFor(issues, "consent") ? <span className="c3-error-campo">{issueFor(issues, "consent")}</span> : null}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", paddingTop: 8 }}>
        <button type="submit" className="c3-btn c3-btn--primario" disabled={busy}>
          {busy ? "Enviando…" : "Enviar propuesta"}
        </button>
        <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--c3-texto-suave)", maxWidth: 360 }}>
          Enviar no publica nada. C3 revisa tu propuesta y define el challenge contigo antes de que se vea.
        </span>
      </div>
    </form>
  );
}

function Campo({ id, label, help, error, children }: { id: string; label: string; help?: string; error: string | null; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className="c3-etiqueta-campo">{label}</label>
      {children}
      {help && !error ? <span className="c3-ayuda">{help}</span> : null}
      {error ? <span className="c3-error-campo">{error}</span> : null}
    </div>
  );
}
