import { useState } from "react";
import { Boxes, Clock, Inbox, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WidgetBoard } from "@/components/widget-board";
import type { WidgetDefinition } from "@/components/widget";
import { Cifra, Entera, Movimientos } from "@/widgets";
import { Section } from "@/sections/Shared";

/* Los de acá abajo son otros widgets y no los del riel, aunque muestren cosas
   parecidas. El `layoutId` sale del id, así que dos mosaicos del mismo widget
   en la misma pantalla se pisan: Framer los toma por el mismo objeto y cruza
   uno contra el otro. Un widget se dibuja una vez por pantalla — y el riel de
   la derecha ya está mostrando los suyos mientras leés esto. */
const ESCALERA: WidgetDefinition[] = [
  {
    id: "demo-2x1",
    label: "2x1",
    icon: Boxes,
    span: "2x1",
    glance: () => <Cifra valor="$38,000" nota="two columns, one row" />,
    full: () => <Entera titulo="2x1" bajada="Double the width, single the height." />,
  },
  {
    id: "demo-1x1",
    label: "1x1",
    icon: Inbox,
    glance: () => <Cifra valor="12" nota="the base cell" />,
    full: () => <Entera titulo="1x1" bajada="One column, one row." />,
  },
  {
    id: "demo-1x1-bis",
    label: "1x1",
    icon: Users,
    glance: () => <Cifra valor="5 / 10" nota="another base cell" />,
    full: () => <Entera titulo="1x1" bajada="One column, one row." />,
  },
  {
    id: "demo-2x2",
    label: "2x2",
    icon: Clock,
    span: "2x2",
    glance: () => (
      <span className="flex h-full flex-col justify-start pt-1">
        <Movimientos hasta={5} />
      </span>
    ),
    full: () => <Entera titulo="2x2" bajada="The big cell." />,
  },
];

const VACIO: WidgetDefinition[] = [
  {
    id: "demo-vacio",
    label: "Contributions this month",
    icon: Boxes,
    span: "2x1",
    glance: () => <Cifra valor="$38,000" nota="142 contributions in six months" />,
    full: () => <Entera titulo="Contributions this month" bajada="Everything that came in." />,
  },
];

/* El board arregla mientras la mano se mueve y avisa al soltar; el dueño de la
   lista es este estado. Es el mismo cableado que hace App con el riel. */
function Reordenable() {
  const [orden, setOrden] = useState(ESCALERA);

  return (
    <div className="flex flex-col gap-3">
      <WidgetBoard
        widgets={orden}
        onReorder={(ids) =>
          setOrden((lista) =>
            ids
              .map((id) => lista.find((w) => w.id === id))
              .filter((w) => w !== undefined),
          )
        }
      />
      <p className="text-[12px] text-muted-foreground">
        onReorder → {orden.map((w) => w.id.replace("demo-", "")).join(" · ")}
      </p>
    </div>
  );
}

export function WidgetBoardSection() {
  const [puestos, setPuestos] = useState(true);

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="Where it lives"
        hint="The real board is the rail on the right, not this tab. It's part of the shell: always there, next to the panel, like the sidebar on the other side."
      >
        <p className="text-[13px] text-muted-foreground">
          Tap a tile in the rail. It doesn't open the tab: it becomes it —the
          plane travels from over there to here— and what's left in the rail is
          the outline of where it was, with an "Open alongside". Go back to
          another tab and the tile returns to its cell the same way.
        </p>
      </Section>

      <Section
        title="The size ladder"
        hint="1x1, 2x1 and 2x2 on fixed-height rows. The rail is narrow and everything falls into one column there; with width, the ladder shows."
      >
        <WidgetBoard widgets={ESCALERA} />
      </Section>

      <Section
        title="Rearranging it"
        hint="Drag a tile from one place to another — here, and in the real board on the right. The card follows the hand, the neighbours make room, and the board hands back the ids when it lands. The cell that carries the drag is WidgetCard, which has a page of its own."
      >
        <Reordenable />
      </Section>

      <Section
        title="The middle step"
        hint="Hover over “Contributions this month” in the rail — it's the only one that declares a peek."
      >
        <p className="text-[13px] text-muted-foreground">
          The `PeekCard` comes from the same descriptor as the tile, so the
          summary is written once. Hover opens the summary, click opens the full
          view. On touch there's no hover: the finger goes straight to the full
          view, which is what you expect from a tile.
        </p>
      </Section>

      <Section
        title="The empty state"
        hint="A board with no widgets is the normal state of a freshly opened app, not an error."
      >
        <div className="flex flex-col gap-4">
          <div className="h-[380px]">
            <WidgetBoard
              widgets={puestos ? VACIO : []}
              action={
                <Button size="compact" onClick={() => setPuestos(true)}>
                  Add a widget
                </Button>
              }
            />
          </div>
          <div>
            <Button
              variant="secondary"
              size="compact"
              onClick={() => setPuestos((p) => !p)}
            >
              {puestos ? "Empty the board" : "Fill it again"}
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
