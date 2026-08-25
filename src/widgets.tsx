/**
 * Los widgets de esta app.
 *
 * Separados de la sección de demo a propósito: los mosaicos de verdad viven en
 * el riel de la derecha, que es parte del shell y no de ninguna pestaña, así
 * que quien los declara no puede ser una pantalla. `App` los monta; la sección
 * documenta el componente con descriptores propios.
 */

import type { ReactNode } from "react";
import { ChartLine, HandHeart, History, Target, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WidgetDefinition } from "@/components/widget";

/* ── Las piezas del vistazo ─────────────────────────────────────────────── */

/** El número grande de un mosaico, con su renglón de contexto debajo. */
export function Cifra({ valor, nota }: { valor: string; nota: string }) {
  return (
    <span className="flex h-full flex-col justify-end gap-0.5">
      <span className="text-[24px] leading-none font-medium tracking-tight">
        {valor}
      </span>
      <span className="text-[12px] text-muted-foreground">{nota}</span>
    </span>
  );
}

export function Barra({ pct }: { pct: number }) {
  return (
    <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-1">
      <span
        className="h-full rounded-full bg-foreground"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

const MOVIMIENTOS = [
  { quien: "Camila Ferreyra", cuanto: "$4,200", cuando: "2 h ago" },
  { quien: "Bruno Salas", cuanto: "$1,800", cuando: "5 h ago" },
  { quien: "Anonymous", cuanto: "$12,000", cuando: "yesterday" },
  { quien: "Sofía Bermúdez", cuanto: "$900", cuando: "yesterday" },
  { quien: "Renata Bianchi", cuanto: "$2,500", cuando: "2 d ago" },
];

export function Movimientos({ hasta = 3 }: { hasta?: number }) {
  return (
    <span className="flex flex-col gap-2">
      {MOVIMIENTOS.slice(0, hasta).map((m) => (
        <span key={m.quien} className="flex items-baseline gap-2 text-[12px]">
          <span className="min-w-0 flex-1 truncate">{m.quien}</span>
          <span className="font-medium">{m.cuanto}</span>
          <span className="w-16 shrink-0 text-right text-muted-foreground">
            {m.cuando}
          </span>
        </span>
      ))}
    </span>
  );
}

/** El cuerpo de una vista entera. Acá sería la pantalla de verdad; en la demo
 *  alcanza con mostrar que el escalón existe y que llegó con su título. */
export function Entera({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-medium tracking-tight">{titulo}</h2>
        <p className="text-[13px] text-muted-foreground">{bajada}</p>
      </div>
      {children}
    </div>
  );
}

/* ── Los widgets ────────────────────────────────────────────────────────── */

// Los descriptores y las piezas con las que se dibujan son la misma decisión:
// separarlos en dos archivos sólo para que el fast refresh pueda recargar este
// esconde de qué está hecho cada vistazo. Editar un widget recarga la página.
// oxlint-disable-next-line react/only-export-components
export const WIDGETS: WidgetDefinition[] = [
  {
    id: "widget-aportes",
    label: "Contributions this month",
    icon: Wallet,
    span: "2x1",
    glance: () => (
      <span className="flex h-full items-end justify-between gap-4">
        <Cifra valor="$38,000" nota="142 contributions in six months" />
        <Badge variant="dot" color="green">
          +12%
        </Badge>
      </span>
    ),
    peek: [
      {
        label: "Summary",
        icon: ChartLine,
        content: (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              March closed above the six-month average.
            </p>
            <Movimientos hasta={3} />
          </div>
        ),
      },
      {
        label: "Goal",
        icon: Target,
        content: (
          <div className="flex flex-col gap-3">
            <Barra pct={67} />
            <p className="text-[13px] text-muted-foreground">
              $38,000 of $57,000. Two thirds of the way to go, and four months.
            </p>
          </div>
        ),
      },
    ],
    full: () => (
      <Entera
        titulo="Contributions this month"
        bajada="Everything that came in, who gave it and when."
      >
        <Movimientos hasta={5} />
      </Entera>
    ),
  },
  {
    id: "widget-campana",
    label: "Marmot Fund",
    icon: HandHeart,
    glance: () => (
      <span className="flex h-full flex-col justify-end gap-2">
        <Barra pct={67} />
        <Cifra valor="67%" nota="of this year's goal" />
      </span>
    ),
    full: () => (
      <Entera
        titulo="Marmot Fund"
        bajada="The campaign started in March and is already two thirds of the way there."
      >
        <Barra pct={67} />
      </Entera>
    ),
  },
  {
    id: "widget-equipo",
    label: "Team",
    icon: Users,
    glance: () => <Cifra valor="5 / 10" nota="people with access" />,
    full: () => (
      <Entera titulo="Team" bajada="Who gets into the space, and with which permissions." />
    ),
  },
  {
    id: "widget-actividad",
    label: "Activity",
    icon: History,
    span: "2x2",
    glance: () => (
      <span className="flex h-full flex-col justify-start pt-1">
        <Movimientos hasta={5} />
      </span>
    ),
    full: () => (
      <Entera
        titulo="Activity"
        bajada="The full log, not trimmed to the last five."
      >
        <Movimientos hasta={5} />
      </Entera>
    ),
  },
];
