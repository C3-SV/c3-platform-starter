import { redirect } from "next/navigation";
import { adminHref, ADMIN_HOME } from "@/lib/domain/admin-nav";

/** `/admin` entra por el Resumen, con los pendientes enlazados. */
export default function AdminPage() {
  redirect(adminHref(ADMIN_HOME));
}
