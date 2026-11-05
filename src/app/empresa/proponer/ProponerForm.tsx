"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import type { FieldIssue } from "@/lib/client/api";

interface Confirmation {
  reference: string;
  email: string;
}

function issueFor(issues: FieldIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

/** Proposal form (V10). No account needed: the server validates, rate-limits and stores it before confirming. */
export function ProponerForm() {
  const [values, setValues] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    problem: "",
    desiredOutcome: "",
    constraints: "",
    intent: "",
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
      // The confirmation only shows when the proposal was stored; an unsaved answer is never presented as received.
      if (response.status === 201 && payload.proposal?.stored === true) {
        setConfirmation({ reference: payload.proposal.reference, email: values.contactEmail.trim() });
        return;
      }
      if (response.status === 201) {
        setFormError("No pudimos registrar tu propuesta. Revisa los datos e intenta de nuevo.");
        return;
      }
      setIssues(payload?.error?.issues ?? []);
      setFormError(payload?.error?.message ?? "No pudimos enviar la propuesta. Intenta de nuevo.");
    } catch {
      setFormError("No pudimos conectarnos. Revisa tu conexión y vuelve a intentarlo. Tu propuesta no se envió.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <section className="c3-block" role="status" aria-live="polite">
        <span className="c3-etiqueta" style={{ color: "var(--c3-exito)" }}>Propuesta recibida</span>
        <h2>Recibimos tu propuesta</h2>
        <p className="c3-long-text">
          Tu código de referencia es <strong>{confirmation.reference}</strong>. C3 te escribirá a {confirmation.email}.
        </p>
        <p className="c3-block__intro">
          Enviar no publica nada. C3 revisa tu propuesta y define el challenge contigo antes de que se vea.
        </p>
        <Link href="/explorar" className="c3-btn c3-btn--contorno" style={{ alignSelf: "flex-start" }}>Explorar challenges publicados</Link>
      </section>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="c3-block c3-form">
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}

      <div className="c3-form-two">
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

      <div className="c3-divider" />

      <Campo id="p-problema" label="¿Cuál es el problema?" error={issueFor(issues, "problem")} help="Qué pasa hoy, quién lo sufre y qué es lo más difícil.">
        <textarea id="p-problema" rows={4} className={`c3-campo${issueFor(issues, "problem") ? " c3-campo--error" : ""}`} value={values.problem} onChange={(event) => update("problem", event.target.value)} />
      </Campo>

      <Campo id="p-objetivo" label="¿Qué resultado les gustaría explorar?" error={issueFor(issues, "desiredOutcome")}>
        <textarea id="p-objetivo" rows={3} className="c3-campo" value={values.desiredOutcome} onChange={(event) => update("desiredOutcome", event.target.value)} />
      </Campo>

      <Campo id="p-intencion" label="¿Qué quieres lograr? (opcional)" error={issueFor(issues, "intent")} help="Elige una sola opción; puedes explicarlo en el campo anterior.">
        <select id="p-intencion" className="c3-campo" value={values.intent} onChange={(event) => update("intent", event.target.value)}>
          <option value="">Sin elegir</option>
          <option value="talento">Identificar talento</option>
          <option value="solucion">Explorar una solución</option>
          <option value="ambos">Ambos</option>
        </select>
      </Campo>

      <Campo id="p-limites" label="Datos disponibles y límites de confidencialidad" error={issueFor(issues, "constraints")} help="Opcional, pero ayuda a definir qué se puede publicar.">
        <textarea id="p-limites" rows={3} className="c3-campo" value={values.constraints} onChange={(event) => update("constraints", event.target.value)} />
      </Campo>

      {/* Honeypot: bots fill it in; people never see it. */}
      <div aria-hidden="true" className="c3-visualmente-oculto">
        <label htmlFor="p-web">Sitio web (no completar)</label>
        <input id="p-web" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => update("website", event.target.value)} />
      </div>

      <label className="c3-checkbox">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} aria-invalid={Boolean(issueFor(issues, "consent"))} />
        <span>Acepto que C3 me contacte por este correo sobre la propuesta.</span>
      </label>
      {issueFor(issues, "consent") ? <span className="c3-error-campo">{issueFor(issues, "consent")}</span> : null}

      <div className="c3-form__footer">
        <button type="submit" className="c3-btn c3-btn--primario" disabled={busy}>
          {busy ? "Enviando…" : "Enviar propuesta"}
        </button>
        <span>
          Enviar no publica nada. C3 revisa tu propuesta y define el challenge contigo antes de que se vea.
        </span>
      </div>
    </form>
  );
}

function Campo({ id, label, help, error, children }: { id: string; label: string; help?: string; error: string | null; children: ReactNode }) {
  return (
    <div className="c3-field-group">
      <label htmlFor={id} className="c3-etiqueta-campo">{label}</label>
      {children}
      {help && !error ? <span className="c3-ayuda">{help}</span> : null}
      {error ? <span className="c3-error-campo">{error}</span> : null}
    </div>
  );
}
