"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiRequest } from "@/lib/client/api";
import type { AdminPending } from "@/lib/domain/admin-nav";
import type { AdminDashboard } from "@/lib/server/admin";
import type { AdminCatalog } from "@/lib/server/catalog";

interface AdminDataValue {
  catalog: AdminCatalog | null;
  catalogError: string | null;
  reloadCatalog: () => Promise<void>;
  summary: AdminDashboard | null;
  summaryError: string | null;
  reloadSummary: () => Promise<void>;
  pending: AdminPending | null;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Datos compartidos por todas las secciones de la consola: el catálogo (experiencias, challenges, organizaciones) y los
 * pendientes del resumen. Viven en el diseño de `/admin`, así que cambiar de sección no los vuelve a pedir.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<AdminCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminDashboard | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const reloadCatalog = useCallback(async () => {
    try {
      setCatalog(await apiRequest<AdminCatalog>("/api/admin/catalogo"));
      setCatalogError(null);
    } catch (error) {
      setCatalogError(messageOf(error, "No pudimos cargar el catálogo. Intentá de nuevo."));
    }
  }, []);

  const reloadSummary = useCallback(async () => {
    try {
      setSummary(await apiRequest<AdminDashboard>("/api/admin/resumen"));
      setSummaryError(null);
    } catch (error) {
      setSummaryError(messageOf(error, "No pudimos cargar el resumen. Intentá de nuevo."));
    }
  }, []);

  // Carga inicial: las actualizaciones de estado ocurren en las respuestas, no dentro del efecto.
  useEffect(() => {
    let active = true;
    apiRequest<AdminCatalog>("/api/admin/catalogo").then(
      (data) => {
        if (!active) return;
        setCatalog(data);
        setCatalogError(null);
      },
      (error: unknown) => {
        if (active) setCatalogError(messageOf(error, "No pudimos cargar el catálogo. Intentá de nuevo."));
      },
    );
    apiRequest<AdminDashboard>("/api/admin/resumen").then(
      (data) => {
        if (!active) return;
        setSummary(data);
        setSummaryError(null);
      },
      (error: unknown) => {
        if (active) setSummaryError(messageOf(error, "No pudimos cargar el resumen. Intentá de nuevo."));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const pending = useMemo<AdminPending | null>(
    () => (summary ? { proposals: summary.pendingProposals, enrollments: summary.pendingEnrollments } : null),
    [summary],
  );

  const value = useMemo<AdminDataValue>(
    () => ({ catalog, catalogError, reloadCatalog, summary, summaryError, reloadSummary, pending }),
    [catalog, catalogError, reloadCatalog, summary, summaryError, reloadSummary, pending],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataValue {
  const value = useContext(AdminDataContext);
  if (!value) throw new Error("useAdminData debe usarse dentro de AdminDataProvider.");
  return value;
}
