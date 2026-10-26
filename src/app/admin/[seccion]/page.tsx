import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ADMIN_SECTIONS, adminSectionOf, parseAdminSection } from "@/lib/domain/admin-nav";
import { AdminSeccion } from "../AdminSeccion";

// Solo existen las secciones conocidas: cualquier otro segmento es un 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ADMIN_SECTIONS.map((section) => ({ seccion: section.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ seccion: string }> }): Promise<Metadata> {
  const section = parseAdminSection((await params).seccion);
  return { title: { absolute: `${section ? adminSectionOf(section).label : "Administración"} · Admin · C3 Platform` } };
}

/** V12 · C3 Admin. Una URL por sección: recargar y «atrás» conservan donde se estaba. */
export default async function AdminSeccionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const section = parseAdminSection((await params).seccion);
  if (!section) notFound();
  return <AdminSeccion section={section} />;
}
