"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminSectionId } from "@/lib/domain/admin-nav";
import { adminHref } from "@/lib/domain/admin-nav";
import { useAdminData } from "./AdminData";
import { EntregasPanel } from "./EntregasPanel";
import { ExperienciasPanel } from "./ExperienciasPanel";
import { InscripcionesPanel, type EnrollmentTarget } from "./InscripcionesPanel";
import { JuradosPanel } from "./JuradosPanel";
import { PropuestasPanel } from "./PropuestasPanel";
import { ResultadosPanel } from "./ResultadosPanel";
import { ResumenPanel } from "./ResumenPanel";

/** Contenido de una sección de la consola. Los datos compartidos (catálogo y pendientes) vienen del diseño de `/admin`. */
export function AdminSeccion({ section }: { section: AdminSectionId }) {
  return (
    <Suspense fallback={<p style={{ color: "var(--c3-texto-suave)" }}>Cargando…</p>}>
      <Contenido section={section} />
    </Suspense>
  );
}

const loading = <p style={{ color: "var(--c3-texto-suave)" }}>Cargando challenges…</p>;

/** El destino de la revisión de inscripciones viaja en la URL (`?reto=` o `?experiencia=`): se puede enlazar y recargar. */
function targetFrom(params: URLSearchParams): EnrollmentTarget | null {
  const challenge = params.get("reto");
  if (challenge) return { kind: "challenge", id: challenge };
  const experience = params.get("experiencia");
  return experience ? { kind: "experience", id: experience } : null;
}

function Contenido({ section }: { section: AdminSectionId }) {
  const router = useRouter();
  const params = useSearchParams();
  const { catalog, catalogError, reloadCatalog, reloadSummary } = useAdminData();
  const changed = () => {
    void reloadCatalog();
    void reloadSummary();
  };
  const challenges = catalog?.challenges ?? [];

  switch (section) {
    case "resumen":
      return <ResumenPanel />;

    case "propuestas":
      return <PropuestasPanel organizations={catalog?.organizations ?? []} onChanged={changed} />;

    case "experiencias":
      return (
        <>
          {catalogError ? (
            <div className="c3-alerta c3-alerta--error" role="alert">
              <strong>No pudimos cargar el catálogo</strong>
              <span style={{ fontSize: 14 }}>{catalogError}</span>
              <button type="button" className="c3-btn c3-btn--contorno" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => void reloadCatalog()}>Reintentar</button>
            </div>
          ) : null}
          {!catalog && !catalogError ? (
            <>
              <h1 className="c3-titulo" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>Experiencias y challenges</h1>
              <p style={{ color: "var(--c3-texto-suave)" }}>Cargando catálogo…</p>
            </>
          ) : null}
          {catalog ? (
            <ExperienciasPanel
              catalog={catalog}
              onChanged={changed}
              onOpenEnrollments={(target) => router.push(adminHref("inscripciones", { [target.kind === "challenge" ? "reto" : "experiencia"]: target.id }))}
            />
          ) : null}
        </>
      );

    case "inscripciones": {
      if (!catalog) return loading;
      const target = targetFrom(params);
      return (
        <InscripcionesPanel
          key={target ? `${target.kind}:${target.id}` : "sin-seleccion"}
          challenges={catalog.challenges.map((item) => ({ id: item.id, title: item.title }))}
          experiences={catalog.experiences
            .filter((item) => !catalog.challenges.some((challenge) => challenge.experienceId === item.id))
            .map((item) => ({ id: item.id, title: item.title }))}
          initialTarget={target}
          onChanged={changed}
        />
      );
    }

    case "entregas":
      return catalog ? <EntregasPanel challenges={challenges.map((item) => ({ id: item.id, title: item.title }))} /> : loading;

    case "jurados":
      return catalog ? <JuradosPanel challenges={challenges.map((item) => ({ id: item.id, title: item.title, rubric: item.rubric }))} /> : loading;

    case "resultados":
      return catalog ? <ResultadosPanel challenges={challenges.map((item) => ({ id: item.id, title: item.title }))} /> : loading;
  }
}
