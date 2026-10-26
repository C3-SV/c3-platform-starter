import Link from "next/link";
import { StatePill } from "@/components/StatePill";
import { formatDate, formatDateTime } from "@/lib/domain/format";
import { deliveryPresentation, enrollmentState, type PresentedState } from "@/lib/domain/presentation";
import { medalFor, medalName, medalText, TRAJECTORY_COPY, type TrajectorySection } from "@/lib/domain/trayectoria";
import type { MyEnrollmentView } from "@/lib/server/participation";

/** Texto de cada registro: lo que C3 registró y, solo si la persona todavía puede hacer algo, adónde ir. */
function describe(item: MyEnrollmentView, section: TrajectorySection): { state: PresentedState | null; lines: string[]; strong: string | null; link: { href: string; label: string } | null } {
  const delivered = item.delivery?.state === "entregada";
  const miReto = item.challengeId ? `/mi-c3/retos/${item.challengeId}` : null;

  if (section === "sin_participacion") {
    const rejected = item.status === "rejected";
    return {
      state: enrollmentState(item.status),
      strong: rejected ? "C3 no aprobó esta inscripción." : "Inscripción cancelada.",
      lines: ["No acredita participación ni resultado."],
      link: null,
    };
  }

  if (section === "en_revision") {
    return {
      state: enrollmentState(item.status),
      strong: "C3 está revisando tu inscripción.",
      lines: [`Enviada el ${formatDate(item.createdAt)}. Todavía no acredita participación.`],
      link: null,
    };
  }

  if (item.result) {
    const details = [
      item.result.average !== null ? `Promedio ${item.result.average.toFixed(1)}` : null,
      item.result.place ? `Puesto ${item.result.place} de ${item.result.of}` : null,
    ].filter(Boolean).join(" · ");
    return {
      state: { label: "Resultado publicado", tone: "exito" },
      strong: item.result.recognition ? `${item.result.recognition}.` : null,
      lines: [details || "C3 publicó el resultado de tu entrega."],
      link: miReto ? { href: miReto, label: "Ver mi entrega" } : null,
    };
  }

  if (!item.challengeId) {
    const session = [formatDateTime(item.startsAt), item.location].filter(Boolean).join(" · ");
    return {
      state: enrollmentState(item.status),
      strong: "C3 confirmó tu lugar.",
      lines: session ? [session] : [],
      link: { href: `/experiencias/${item.experienceId}`, label: "Ver la experiencia" },
    };
  }

  if (item.delivery) {
    const state = deliveryPresentation(item.delivery.state);
    if (delivered) {
      return { state, strong: null, lines: [`Entrega enviada el ${formatDate(item.delivery.submittedAt)}.`], link: miReto ? { href: miReto, label: "Ver mi entrega" } : null };
    }
    if (item.delivery.state === "fuera_de_plazo") {
      return { state, strong: null, lines: ["El plazo cerró sin entrega enviada."], link: null };
    }
    return {
      state,
      strong: null,
      lines: [item.delivery.state === "borrador" ? "Tenés un borrador sin enviar." : "Todavía no enviaste tu entrega."],
      link: miReto ? { href: miReto, label: "Ir a mi challenge" } : null,
    };
  }

  return { state: enrollmentState(item.status), strong: null, lines: [], link: miReto ? { href: miReto, label: "Ir a mi challenge" } : null };
}

/** Medalla del puesto publicado. El texto y el nombre accesible dicen el puesto; el color solo lo refuerza. */
function Medal({ place, of }: { place: number | null; of: number | null }) {
  const medal = medalFor(place);
  if (!medal) return null;
  return (
    <span role="img" aria-label={`${medalName(medal)}, puesto ${place}${of ? ` de ${of}` : ""}`} className={`c3-tray__medalla c3-tray__medalla--${medal}`}>
      {medalText(medal)}
    </span>
  );
}

export function TrajectoryCard({ item, section }: { item: MyEnrollmentView; section: TrajectorySection }) {
  const info = describe(item, section);
  const title = item.challengeTitle ?? item.experienceTitle;
  const mode = item.mode === "team" ? (item.team ? `Equipo ${item.team.name}` : "Por equipo") : "Individual";
  const meta = item.challengeId ? `${item.organizationName} · ${mode}` : null;
  return (
    <article className={`c3-card c3-tray__tarjeta c3-tray__tarjeta--${section}${item.result ? " c3-tray__tarjeta--resultado" : ""}`}>
      {item.result ? <Medal place={item.result.place} of={item.result.of} /> : null}
      <div className="c3-tray__tarjeta-cuerpo">
        <div className="c3-tray__tarjeta-cabecera">
          <span className="c3-mi-c3__kicker">{item.challengeId ? item.experienceTitle : "Experiencia"}</span>
          {info.state ? <StatePill state={info.state} /> : null}
        </div>
        <h4 className="c3-titulo c3-mi-c3__tarjeta-titulo">{title}</h4>
        {meta ? <p className="c3-mi-c3__meta">{meta}</p> : null}
        {info.strong || info.lines.length > 0 ? (
          <p className="c3-mi-c3__estado">
            {info.strong ? <strong>{info.strong}</strong> : null}
            {info.strong && info.lines.length > 0 ? " " : null}
            {info.lines.join(" ")}
          </p>
        ) : null}
        {info.link ? <Link href={info.link.href} className="c3-tray__enlace">{info.link.label}</Link> : null}
      </div>
    </article>
  );
}

export function TrajectorySectionBlock({ section, items }: { section: TrajectorySection; items: MyEnrollmentView[] }) {
  if (items.length === 0) return null;
  const copy = TRAJECTORY_COPY[section];
  return (
    <section className={`c3-tray__seccion c3-tray__seccion--${section}`} aria-labelledby={`tray-${section}`}>
      <header className="c3-mi-c3__seccion-cabecera">
        <h3 id={`tray-${section}`} className="c3-titulo">{copy.title}</h3>
        <span className="c3-mi-c3__seccion-conteo">{items.length}</span>
        <p>{copy.description}</p>
      </header>
      <div className="c3-mi-c3__lista">
        {items.map((item) => <TrajectoryCard key={item.id} item={item} section={section} />)}
      </div>
    </section>
  );
}
