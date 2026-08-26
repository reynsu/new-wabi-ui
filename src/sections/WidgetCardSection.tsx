import { useState } from "react";
import {
  Boxes,
  Clock,
  Inbox,
  ListChecks,
  StickyNote,
  TrendingUp,
  Users,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Elevated } from "@/lib/elevated";
import { WidgetBoard } from "@/components/widget-board";
import { WidgetCard } from "@/components/widget-card";
import type { WidgetDefinition } from "@/components/widget";
import { Cifra, Entera, Movimientos } from "@/widgets";
import { Section } from "@/sections/Shared";

/* Lo que sube una tarjeta de la demo sobre el sustrato del board: los mismos
   dos escalones que sube el plano de un widget, porque son vecinas adentro de
   la misma grilla. Van con `Elevated` y no con un `bg-surface-*` a mano por lo
   de siempre — el escalón se cuenta desde el sustrato, no se elige—: escrito a
   mano, una tarjeta apoyada en el surface-3 del panel se pintaba surface-3 con
   la sombra del 2, o sea del color de su fondo y con menos sombra que su
   propio nivel. */
const PLANO = 2;

/** Bloque de código, igual que en las otras páginas propias. */
function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-relaxed shadow-surface-1">
      <code className="font-mono">{children.trim()}</code>
    </pre>
  );
}

/* Widgets propios de esta página: el `layoutId` sale del id, así que dos
   mosaicos del mismo widget en la misma pantalla se pisan. */
const WIDGETS: WidgetDefinition[] = [
  {
    id: "card-aportes",
    label: "Contributions",
    icon: Boxes,
    span: "2x1",
    glance: () => <Cifra valor="$38,000" nota="142 in six months" />,
    full: () => <Entera titulo="Contributions" bajada="Everything that came in." />,
  },
  {
    id: "card-equipo",
    label: "Team",
    icon: Users,
    glance: () => <Cifra valor="5 / 10" nota="people with access" />,
    full: () => <Entera titulo="Team" bajada="Who gets in, and with which permissions." />,
  },
  {
    id: "card-bandeja",
    label: "Inbox",
    icon: Inbox,
    glance: () => <Cifra valor="12" nota="unread" />,
    full: () => <Entera titulo="Inbox" bajada="What's waiting." />,
  },
  {
    id: "card-actividad",
    label: "Activity",
    icon: Clock,
    span: "2x2",
    glance: () => (
      <span className="flex h-full flex-col justify-start pt-1">
        <Movimientos hasta={5} />
      </span>
    ),
    full: () => <Entera titulo="Activity" bajada="The full log." />,
  },
];

/** El board arregla mientras la mano se mueve y avisa al soltar; el dueño de la
 *  lista es este estado. Es el mismo cableado que hace App con el riel. */
function Reordenable() {
  const [orden, setOrden] = useState(WIDGETS);
  const [ultimo, setUltimo] = useState<string[] | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <WidgetBoard
        widgets={orden}
        onReorder={(ids) => {
          setUltimo(ids);
          setOrden((lista) =>
            ids
              .map((id) => lista.find((w) => w.id === id))
              .filter((w) => w !== undefined),
          );
        }}
      />
      <p className="text-[12px] text-muted-foreground">
        onReorder →{" "}
        {ultimo
          ? ultimo.map((id) => id.replace("card-", "")).join(" · ")
          : "nothing moved yet"}
      </p>
    </div>
  );
}

/** Un board sin un solo widget: cuatro `WidgetCard` con lo que sea adentro. */
function Sueltas() {
  const [ultimo, setUltimo] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <WidgetBoard onReorder={setUltimo}>
        <WidgetCard id="nota" span="2x1" label="A note">
          <Elevated offset={PLANO} className="flex h-full flex-col justify-end gap-1 rounded-xl p-4">
            <p className="text-[13px] font-medium">A plain div</p>
            <p className="text-[12px] text-muted-foreground">
              No descriptor, no glance, no tab to open. It's a cell.
            </p>
          </Elevated>
        </WidgetCard>
        <WidgetCard id="marca" label="The mark">
          {/* Se pinta sola —es una marca, no una superficie— y `cn` deja que
              `bg-foreground` gane sobre el fondo del escalón; lo que se queda
              del escalón es la sombra, que es lo que la separa del board. */}
          <Elevated
            offset={PLANO}
            className="flex h-full items-center justify-center rounded-xl bg-foreground text-background"
          >
            <span className="text-[28px] font-medium tracking-tight">FF</span>
          </Elevated>
        </WidgetCard>
        <WidgetCard id="lista" label="A list">
          <div className="flex h-full flex-col justify-center gap-2 rounded-xl border border-dashed border-border p-4">
            {["One", "Two", "Three"].map((n) => (
              <p key={n} className="text-[12px] text-muted-foreground">
                {n}
              </p>
            ))}
          </div>
        </WidgetCard>
        <WidgetCard id="cifra" label="A number">
          <Elevated offset={PLANO} className="flex h-full flex-col justify-end rounded-xl p-4">
            <span className="text-[24px] leading-none font-medium tracking-tight">
              67%
            </span>
            <span className="text-[12px] text-muted-foreground">of the goal</span>
          </Elevated>
        </WidgetCard>
      </WidgetBoard>
      <p className="text-[12px] text-muted-foreground">
        onReorder → {ultimo.length ? ultimo.join(" · ") : "nothing moved yet"}
      </p>
    </div>
  );
}

/** El mismo board sin `onReorder`: las tarjetas siguen colocando, pero no se
 *  arrastran. Es la prueba de que la regla se lee en el markup. */
function Quieto() {
  return (
    <WidgetBoard>
      <WidgetCard id="fijo-1" span="2x1" label="Fixed">
        <Elevated offset={PLANO} className="flex h-full flex-col justify-end gap-1 rounded-xl p-4">
          <p className="text-[13px] font-medium">Nothing to report to</p>
          <p className="text-[12px] text-muted-foreground">
            No grab cursor, no tab stop, no listeners.
          </p>
        </Elevated>
      </WidgetCard>
      <WidgetCard id="fijo-2" label="Fixed too">
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border">
          <span className="text-[12px] text-muted-foreground">1x1</span>
        </div>
      </WidgetCard>
    </WidgetBoard>
  );
}

/* La bandeja: widgets que todavía no están en el riel. Cada tarjeta lleva su
   descriptor en `data`, que es lo que el board del otro lado necesita para
   hacerlo suyo — el `WidgetDragProvider` de App es lo que pone a los dos en el
   mismo contexto. */
const BANDEJA: WidgetDefinition[] = [
  {
    id: "tray-ingresos",
    label: "Revenue",
    icon: TrendingUp,
    span: "2x1",
    glance: () => <Cifra valor="$12,400" nota="this quarter" />,
    full: () => <Entera titulo="Revenue" bajada="What came in, by month." />,
  },
  {
    id: "tray-tareas",
    label: "Tasks",
    icon: ListChecks,
    glance: () => <Cifra valor="7" nota="open" />,
    full: () => <Entera titulo="Tasks" bajada="What is still open." />,
  },
  {
    id: "tray-notas",
    label: "Notes",
    icon: StickyNote,
    glance: () => <Cifra valor="3" nota="pinned" />,
    full: () => <Entera titulo="Notes" bajada="What was written down." />,
  },
];

function Bandeja() {
  const [bandeja, setBandeja] = useState(BANDEJA);
  /* Las dos semánticas, una al lado de la otra: con `copy` la bandeja es una
     paleta —el original se queda y al riel va una copia con id propio—, sin
     ella la tarjeta se muda y la bandeja la pierde. */
  const [copia, setCopia] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Switch label="copy" checked={copia} onToggle={() => setCopia((c) => !c)} />
        <p className="text-[12px] text-muted-foreground">
          {copia
            ? "the tray keeps its card and the rail gets a copy of it"
            : "the card moves: it leaves the tray and lives in the rail"}
        </p>
      </div>

      <WidgetBoard
        copy={copia}
        widgets={bandeja}
        onReorder={(ids) =>
          setBandeja((lista) =>
            ids
              .map((id) => lista.find((w) => w.id === id))
              .filter((w) => w !== undefined),
          )
        }
        /* Sólo llega cuando la tarjeta se muda: una copia no saca nada de acá. */
        onRemove={(id) => setBandeja((lista) => lista.filter((w) => w.id !== id))}
        /* Y la bandeja también recibe: un widget arrastrado desde el riel entra
           con el id que le da el board, que en una copia no es el del
           descriptor. */
        onAdd={(id, index, data) => {
          const widget = data as WidgetDefinition | undefined;
          if (!widget?.id) return false;
          setBandeja((lista) =>
            lista.some((w) => w.id === id)
              ? lista
              : [...lista.slice(0, index), { ...widget, id }, ...lista.slice(index)],
          );
          return true;
        }}
      />

      <p className="text-[12px] text-muted-foreground">
        {bandeja.length === 1
          ? "1 card in the tray"
          : `${bandeja.length} cards in the tray`}
      </p>
    </div>
  );
}

export function WidgetCardSection() {
  return (
    <div className="flex flex-col gap-14">
      <Section
        title="The cell"
        hint="WidgetCard is what places something on the board: it takes the span, it signs up with the grid and it carries the drag. What goes inside is not its business — a widget's tile, a figure, three lines of text."
      >
        <Snippet>{`import { WidgetBoard } from "@/components/widget-board";
import { WidgetCard } from "@/components/widget-card";

<WidgetBoard onReorder={(ids) => setOrder(ids)}>
  <WidgetCard id="revenue" span="2x1" label="Revenue">
    <Revenue />
  </WidgetCard>
  <WidgetCard id="team" label="Team">
    <Team />
  </WidgetCard>
</WidgetBoard>`}</Snippet>
      </Section>

      <Section
        title="Rearranging"
        hint="Drag a tile from one place to another. The card follows the hand, the neighbours make room, and the board hands back the ids when it lands. It's the same board that lives in the rail on the right — try it there too."
      >
        <Reordenable />
      </Section>

      <Section
        title="Into the board on the right"
        hint="These three aren't in the rail yet. Drag one out of the tray and drop it on the board on the right: it lands where you let go, carrying its descriptor. With copy on —the switch— the tray keeps the original and what lands is a copy under an id of its own; with it off the card moves and the tray loses it. Drag one back and the tray takes it. Both boards are in the same drag because the shell wraps them in a WidgetDragProvider."
      >
        <Bandeja />
      </Section>

      <Section
        title="Anything is a cell"
        hint="Four cards with no widget behind them: a div, a figure, a list and a number. To the board a cell is a cell — it arranges ids and spans, and what's drawn inside is whoever wrote the card's business."
      >
        <Sueltas />
      </Section>

      <Section
        title="Without onReorder"
        hint="The board doesn't own the list, so with nobody to report a new order to there's nothing a drag could accomplish. Without the callback the cards place and nothing more — the rule reads in the markup, like the close buttons."
      >
        <Quieto />
      </Section>

      <Section
        title="The keyboard"
        hint="Tab to a card, space to pick it up, arrows to move it, space to drop it and escape to put it back. It's dnd-kit's keyboard sensor, with the announcements rewritten to read out the card's name instead of its id."
      >
        <p className="text-[13px] text-muted-foreground">
          The card is a <code className="text-foreground">group</code> and not a
          button: a widget's tile already has one covering it, and a button
          inside a button is something a screen reader would have to untangle.
          What says this is a piece that moves is the role description and the
          instructions dnd-kit ties to it.
        </p>
      </Section>

      <Section title="Reference" hint="What each piece exposes.">
        <Snippet>{`WidgetCard
  id        string     unique and stable — the currency of the order
  span?     "1x1" | "2x1" | "2x2"      @default "1x1"
  label?    string     the name that gets read out; the id if it's missing
  data?     unknown    what the card carries for the board that takes it
  copy?     boolean    the original stays and a copy lands, under a new id;
                       @default false — without it the card moves
  children  ReactNode  anything

WidgetBoard
  widgets?    WidgetDefinition[]   each one wrapped in a card of its own
  children?   ReactNode            WidgetCards, drawn after the widgets
  onReorder?  (ids) => void        no callback, no drag
  onAdd?      (id, index, data) => boolean | void
                                   takes a card from another board; false
                                   refuses it and sends it back
  onRemove?   (id) => void         one of its cards left for another board
  copy?       boolean              the cards it builds for widgets are
                                   sources: the original stays and a copy
                                   lands. Children carry their own
  …           the rest as before: onWidgetClose, onClose, action

WidgetDragProvider                 one drag for the whole shell: mount it above
                                   every board that has to share cards. A lone
                                   board mounts its own and needs nothing.

// The drag is @dnd-kit's: useSortable for the cell, DndContext + DragOverlay
// for the shell, with the pointer at 4px, the finger at a 350ms hold and the
// grid sorted by rectSortingStrategy.`}</Snippet>
      </Section>
    </div>
  );
}
