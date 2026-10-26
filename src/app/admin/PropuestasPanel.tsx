"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { StatePill } from "@/components/StatePill";
import { apiRequest, ApiError } from "@/lib/client/api";
import { adminHref } from "@/lib/domain/admin-nav";
import { formatDate } from "@/lib/domain/format";
import { proposalPresentation, type ProposalStatus } from "@/lib/domain/proposals";
import type { ProposalView } from "@/lib/server/proposals";

interface OrganizationOption {
  id: string;
  name: string;
}

/** Propuestas de empresa (revisión de C3) y organizaciones con sus representantes. */
export function PropuestasPanel({ organizations, onChanged }: { organizations: OrganizationOption[]; onChanged: () => void }) {
  const [proposals, setProposals] = useState<ProposalView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [repEmail, setRepEmail] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [linkOrg, setLinkOrg] = useState<Record<string, string>>({});

  async function reloadProposals() {
    try {
      const data = await apiRequest<{ proposals: ProposalView[] }>("/api/admin/propuestas");
      setProposals(data.proposals);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar las propuestas. Intentá de nuevo.");
    }
  }

  // Carga inicial: la respuesta actualiza el estado; no se escribe dentro del efecto.
  useEffect(() => {
    let active = true;
    apiRequest<{ proposals: ProposalView[] }>("/api/admin/propuestas").then(
      (data) => {
        if (!active) return;
        setProposals(data.proposals);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar las propuestas. Intentá de nuevo.");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function run(label: string, action: () => Promise<void>, success: string) {
    setActionError(null);
    setNotice(null);
    setBusyId(label);
    try {
      await action();
      setNotice(success);
      await reloadProposals();
      onChanged();
    } catch (error) {
      setActionError(error instanceof ApiError
        ? (error.issues.length ? error.issues.map((issue) => issue.message).join(" ") : error.message)
        : "No pudimos completar la acción. Intentá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  async function review(id: string, status: ProposalStatus, extra: Record<string, unknown> = {}) {
    await run(id, async () => {
      await apiRequest(`/api/admin/propuestas/${id}`, { method: "PATCH", body: { status, ...extra } });
    }, status === "needs_changes" ? "Ajustes pedidos a la empresa." : status === "accepted" ? "Propuesta aceptada." : "Propuesta marcada como no priorizada.");
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("org", async () => {
      await apiRequest("/api/admin/organizaciones", { method: "POST", body: { name: orgName } });
      setOrgName("");
    }, "Organización creada.");
  }

  async function linkRep(organizationId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(`rep-${organizationId}`, async () => {
      await apiRequest(`/api/admin/organizaciones/${organizationId}/representantes`, { method: "POST", body: { email: repEmail[organizationId] ?? "" } });
      setRepEmail((current) => ({ ...current, [organizationId]: "" }));
    }, "Representante vinculado. Ya puede ver su espacio de empresa.");
  }

  const orgNameById = Object.fromEntries(organizations.map((item) => [item.id, item.name]));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Propuestas</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>
          C3 revisa cada propuesta. Pedir ajustes envía una nota a la empresa; aceptar puede vincular la organización.
        </p>
      </div>

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {actionError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{actionError}</strong></div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}

      {proposals === null && !loadError ? <p style={{ color: "var(--c3-texto-suave)" }}>Cargando propuestas…</p> : null}
      {proposals && proposals.length === 0 ? (
        <div className="c3-card" style={{ padding: 24 }}><p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no llegaron propuestas.</p></div>
      ) : null}

      {proposals?.map((proposal) => (
        <section key={proposal.id} className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }} aria-label={`Propuesta ${proposal.reference}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="c3-titulo" style={{ fontSize: 20, fontWeight: 600 }}>{proposal.companyName}</span>
              <span style={{ fontSize: 13, color: "var(--c3-texto-suave)" }}>
                {proposal.contactName} · {proposal.contactEmail} · Ref. {proposal.reference} · {formatDate(proposal.createdAt)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <StatePill state={proposalPresentation(proposal.status)} />
              {proposal.organizationId ? <span className="c3-pill c3-pill--neutro">{orgNameById[proposal.organizationId] ?? "Organización"}</span> : null}
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>{proposal.problem}</p>
          {proposal.desiredOutcome ? <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Resultado buscado: {proposal.desiredOutcome}</p> : null}
          {proposal.constraints ? <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--c3-texto-suave)" }}>Límites: {proposal.constraints}</p> : null}
          {proposal.reviewNote ? <p style={{ fontSize: 14, lineHeight: 1.5 }}>Nota enviada: {proposal.reviewNote}</p> : null}

          {proposal.status === "accepted" ? (
            <div className="c3-alerta c3-alerta--info" style={{ marginTop: 2 }}>
              <strong>Siguiente paso: definir el challenge</strong>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>
                Alcance, entregables, rúbrica y fechas se definen con la empresa. Creá el challenge dentro de una experiencia y vinculalo a su organización.{" "}
                <Link href={adminHref("experiencias")}>Ir a Experiencias y challenges</Link>
              </span>
            </div>
          ) : null}

          {proposal.status !== "accepted" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--c3-borde)", paddingTop: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor={`nota-${proposal.id}`} className="c3-etiqueta-campo">Pedir ajustes (nota para la empresa)</label>
                <textarea id={`nota-${proposal.id}`} className="c3-campo" rows={2} value={notes[proposal.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [proposal.id]: event.target.value }))} />
                <button type="button" className="c3-btn c3-btn--contorno" style={{ alignSelf: "flex-start", minHeight: 40, padding: "0 16px", fontSize: 12 }} disabled={busyId !== null} onClick={() => void review(proposal.id, "needs_changes", { note: notes[proposal.id] ?? "" })}>
                  Pedir ajustes
                </button>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor={`org-${proposal.id}`} className="c3-etiqueta-campo">Organización (opcional)</label>
                  <select id={`org-${proposal.id}`} className="c3-campo" style={{ minWidth: 220 }} value={linkOrg[proposal.id] ?? ""} onChange={(event) => setLinkOrg((current) => ({ ...current, [proposal.id]: event.target.value }))}>
                    <option value="">Sin vincular</option>
                    {organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <button type="button" className="c3-btn c3-btn--primario" style={{ minHeight: 40, padding: "0 16px", fontSize: 12 }} disabled={busyId !== null} onClick={() => void review(proposal.id, "accepted", { organizationId: linkOrg[proposal.id] || null })}>
                  Aceptar
                </button>
                <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 16px", fontSize: 12 }} disabled={busyId !== null} onClick={() => void review(proposal.id, "not_prioritized")}>
                  No priorizar
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ))}

      <section className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }} aria-labelledby="titulo-orgs">
        <h2 id="titulo-orgs" className="c3-titulo" style={{ fontSize: 22, fontWeight: 600 }}>Organizaciones y representantes</h2>
        <form onSubmit={(event) => void createOrganization(event)} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 260px" }}>
            <label htmlFor="org-nombre" className="c3-etiqueta-campo">Nueva organización</label>
            <input id="org-nombre" className="c3-campo" value={orgName} onChange={(event) => setOrgName(event.target.value)} />
          </div>
          <button type="submit" className="c3-btn c3-btn--primario" disabled={busyId !== null || orgName.trim().length < 2}>Crear organización</button>
        </form>

        {organizations.map((organization) => (
          <form key={organization.id} onSubmit={(event) => void linkRep(organization.id, event)} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", borderTop: "1px solid var(--c3-borde)", paddingTop: 14 }} aria-label={`Representantes de ${organization.name}`}>
            <span style={{ fontSize: 16, fontWeight: 600, flex: "1 1 220px" }}>{organization.name}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 260px" }}>
              <label htmlFor={`rep-${organization.id}`} className="c3-etiqueta-campo">Correo de la persona representante</label>
              <input id={`rep-${organization.id}`} type="email" className="c3-campo" value={repEmail[organization.id] ?? ""} onChange={(event) => setRepEmail((current) => ({ ...current, [organization.id]: event.target.value }))} />
            </div>
            <button type="submit" className="c3-btn c3-btn--contorno" disabled={busyId !== null || !(repEmail[organization.id] ?? "").includes("@")}>Vincular representante</button>
          </form>
        ))}
        <span className="c3-ayuda">La cuenta debe existir: la persona se registra en C3 y después C3 la vincula por correo.</span>
      </section>
    </>
  );
}
