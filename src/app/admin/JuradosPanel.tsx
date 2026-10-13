"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type FieldIssue } from "@/lib/client/api";

interface ChallengeOption {
  id: string;
  title: string;
  rubric: { id: string; label: string; maxScore: number }[];
}

interface JudgeRow {
  id: string;
  userId: string;
  email: string | null;
  kind: "empresa" | "externo";
  status: "active" | "revoked";
}

const KIND_LABEL = { empresa: "Representante de la empresa", externo: "Jurado externo" } as const;

/** Jurados asignados por C3 y rúbrica de cada reto. Revocar quita el acceso sin borrar evaluaciones. */
export function JuradosPanel({ challenges }: { challenges: ChallengeOption[] }) {
  const [selected, setSelected] = useState("");
  const [judges, setJudges] = useState<JudgeRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<"empresa" | "externo">("externo");
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const challengeId = challenges.some((item) => item.id === selected) ? selected : (challenges[0]?.id ?? "");
  const challenge = challenges.find((item) => item.id === challengeId);

  async function fetchJudges(id: string) {
    const data = await apiRequest<{ judges: JudgeRow[] }>(`/api/admin/retos/${id}/jurados`);
    return data.judges;
  }

  // Carga los jurados del reto elegido; la respuesta actualiza el estado.
  useEffect(() => {
    if (!challengeId) return;
    let active = true;
    apiRequest<{ judges: JudgeRow[] }>(`/api/admin/retos/${challengeId}/jurados`).then(
      (data) => {
        if (!active) return;
        setJudges(data.judges);
        setLoadError(null);
      },
      (error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof ApiError ? error.message : "No pudimos cargar los jurados.");
      },
    );
    return () => {
      active = false;
    };
  }, [challengeId]);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues([]);
    setFormError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiRequest(`/api/admin/retos/${challengeId}/jurados`, { method: "POST", body: { email, kind } });
      setEmail("");
      setNotice("Jurado asignado. Podrá evaluar cuando cierren las entregas.");
      setJudges(await fetchJudges(challengeId));
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.issues);
        setFormError(error.message);
      } else {
        setFormError("No pudimos asignar al jurado. Intentá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setFormError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiRequest(`/api/admin/jurados/${id}`, { method: "DELETE" });
      setNotice("Acceso revocado. Sus evaluaciones finalizadas se conservan.");
      setJudges(await fetchJudges(challengeId));
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "No pudimos revocar el acceso.");
    } finally {
      setBusy(false);
    }
  }

  if (challenges.length === 0) {
    return <div className="c3-card" style={{ padding: 24 }}><p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay retos. Creá uno en «Experiencias y retos».</p></div>;
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Jurados y rúbricas</h1>
        <p style={{ fontSize: 16, color: "var(--c3-texto-suave)" }}>Asigná jurados por correo. Solo ven las soluciones de sus retos, y solo después del cierre de entregas.</p>
      </div>

      <label htmlFor="jur-reto" className="c3-etiqueta-campo">Reto</label>
      <select id="jur-reto" className="c3-campo" value={challengeId} onChange={(event) => setSelected(event.target.value)} style={{ maxWidth: 520 }}>
        {challenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>

      {challenge ? (
        <section className="c3-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }} aria-label="Rúbrica del reto">
          <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Rúbrica · máximo {challenge.rubric.reduce((sum, item) => sum + item.maxScore, 0)} puntos</span>
          {challenge.rubric.map((criterion) => (
            <span key={criterion.id} style={{ fontSize: 14 }}>· {criterion.label}: 0 – {criterion.maxScore}</span>
          ))}
        </section>
      ) : null}

      {notice ? <div className="c3-alerta c3-alerta--exito" role="status"><strong>{notice}</strong></div> : null}
      {formError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{formError}</strong></div> : null}
      {loadError ? <div className="c3-alerta c3-alerta--error" role="alert"><strong>{loadError}</strong></div> : null}

      {judges && judges.length > 0 ? (
        <section className="c3-card" style={{ overflow: "hidden" }} aria-label="Jurados del reto">
          {judges.map((judge) => (
            <div key={judge.id} role="group" aria-label={judge.email ?? judge.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 20px", borderTop: "1px solid var(--c3-borde)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{judge.email ?? judge.userId}</span>
                <span style={{ fontSize: 12, color: "var(--c3-texto-suave)" }}>{KIND_LABEL[judge.kind]}</span>
              </div>
              {judge.status === "active" ? (
                <button type="button" className="c3-btn c3-btn--contorno" style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }} disabled={busy} onClick={() => void revoke(judge.id)}>
                  Revocar acceso
                </button>
              ) : (
                <span className="c3-pill c3-pill--neutro">Acceso revocado</span>
              )}
            </div>
          ))}
        </section>
      ) : null}
      {judges && judges.length === 0 ? <p style={{ fontSize: 14, color: "var(--c3-texto-suave)" }}>Todavía no hay jurados asignados a este reto.</p> : null}

      <form onSubmit={(event) => void assign(event)} noValidate className="c3-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <span className="c3-etiqueta" style={{ color: "var(--c3-texto-suave)" }}>Asignar jurado</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="jur-correo" className="c3-etiqueta-campo">Correo de la persona</label>
          <input id="jur-correo" type="email" className={`c3-campo${issues.some((item) => item.field === "email") ? " c3-campo--error" : ""}`} value={email} onChange={(event) => setEmail(event.target.value)} />
          {issues.find((item) => item.field === "email") ? <span className="c3-error-campo">{issues.find((item) => item.field === "email")?.message}</span> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="jur-tipo" className="c3-etiqueta-campo">Tipo de jurado</label>
          <select id="jur-tipo" className="c3-campo" value={kind} onChange={(event) => setKind(event.target.value as "empresa" | "externo")} style={{ maxWidth: 360 }}>
            <option value="externo">Jurado externo</option>
            <option value="empresa">Representante de la empresa</option>
          </select>
        </div>
        <button type="submit" className="c3-btn c3-btn--primario" disabled={busy || !email.includes("@")} style={{ alignSelf: "flex-start" }}>
          {busy ? "Asignando…" : "Asignar jurado"}
        </button>
        <span className="c3-ayuda">La persona debe tener una cuenta C3. Si no la tiene, pedile que se registre primero.</span>
      </form>
    </>
  );
}
