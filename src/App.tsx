import { useRef, useState } from "react";
import {
  Boxes,
  ChevronsLeftRight,
  PackageOpen,
  Layers,
  MessageSquare,
  Moon,
  Bell,
  LayoutGrid,
  LayoutPanelTop,
  ListFilter,
  LogIn,
  MousePointer2,
  PanelRight,
  PanelTop,
  IdCard,
  Grip,
  Smartphone,
  PanelsTopLeft,
  CalendarRange,
  CalendarClock,
  GitCommitVertical,
  Sliders,
  Sun,
  TextCursorInput,
} from "lucide-react";

import { AnimatePresence } from "framer-motion";
import { Toaster } from "sileo";

import { Button } from "@/components/ui/button";

import { TravelTooltipItem } from "@/components/travel-tooltip";
import { WindowControls } from "@/components/window-controls";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  WorkspaceOutlet,
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace-context";
import type { WorkspaceTab } from "@/components/workspace-panel";
import type { WidgetDefinition } from "@/components/widget";
import { AgentSection } from "@/sections/AgentSection";
import { AnimatedEmptySection } from "@/sections/AnimatedEmptySection";
import { ControlsSection } from "@/sections/ControlsSection";
import { FilterMenuSection } from "@/sections/FilterMenuSection";
import { InputsSection } from "@/sections/InputsSection";
import { InsetDialogSection } from "@/sections/InsetDialogSection";
import { LateralPreviewSection } from "@/sections/LateralPreviewSection";
import { LoginBlockSection } from "@/sections/LoginBlockSection";
import { MobileActionConfirmationSection } from "@/sections/MobileActionConfirmationSection";
import { DatePickerSection } from "@/sections/DatePickerSection";
import { PeekCardSection } from "@/sections/PeekCardSection";
import { RangeCalendarSection } from "@/sections/RangeCalendarSection";
import { SurfacesSection } from "@/sections/SurfacesSection";
import { TimelineSection } from "@/sections/TimelineSection";
import { SystemSection } from "@/sections/SystemSection";
import { TravelTooltipSection } from "@/sections/TravelTooltipSection";
import { SileoSection } from "@/sections/SileoSection";
import { PreviewProvider, usePreview } from "@/components/preview-context";
import { WidgetRail, type WidgetRailControl } from "@/components/widget-rail";
import { WidgetDragProvider } from "@/components/widget-drag";
import { cn } from "@/lib/utils";
import { WIDGETS } from "@/widgets";
import { WidgetBoardSection } from "@/sections/WidgetBoardSection";
import { WidgetCardSection } from "@/sections/WidgetCardSection";
import { WindowControlsSection } from "@/sections/WindowControlsSection";
import { WorkspacePanelSection } from "@/sections/WorkspacePanelSection";

/**
 * Los controles de la barra del panel.
 *
 * Son `Button` en su escalón compacto —`icon-compact`, los 28px de la escalera
 * de tamaños— sin achicarlos a mano: la barra tiene su propia escalera y un
 * tamaño inventado al lado de ella se nota. Lo que cambia son dos cosas:
 *
 *   ícono en gris   `text-muted-foreground`, que se enciende al pasar. Un
 *                   control del marco no tiene por qué pesar lo mismo que un
 *                   botón del contenido.
 *   fondo blanco    el escalón más alto de la escalera de superficies, que en
 *                   claro es `#FFFFFF` y en oscuro es el gris que le
 *                   corresponde — «blanco» acá quiere decir «el tope de la
 *                   escalera», que es lo que se lee como una pieza levantada.
 *
 * El blanco contra el `#FAFAFA` de la barra es apenas un 2%: lo que separa de
 * verdad es la sombra, y por eso `shadow-surface-3` no es decoración sino la
 * mitad del efecto. Es el mismo recurso con el que el plano del panel se separa
 * de la barra, donde la escalera también está aplanada en blanco.
 *
 * Se pisa `--btn-bg`, que es la variable con la que la variante `secondary`
 * pinta el relleno **y** su anillo, así los dos se mueven juntos y el hover de
 * la variante sigue resuelto. Va sobre la capa del botón y no sobre su raíz: la
 * variante declara esa variable en la capa, y una declaración de arriba nunca
 * la alcanza — las variables se heredan, pero la que el elemento define para sí
 * mismo gana.
 */
const CONTROL = [
  "rounded-full",
  "text-muted-foreground hover:text-foreground",
  "shadow-surface-3",
  "[&>span:first-child]:[--btn-bg:var(--surface-3)]",
].join(" ");

/* El sidebar separa lo que viene del registry de lo que escribimos nosotros.
   Es la misma división que en el disco: components/ui/ es espejo del registry
   y se puede reinstalar entero, components/ es nuestro. */
const GROUPS = [
  {
    label: "Showcase",
    pages: [
      { id: "controls", label: "Controls", icon: Sliders, count: 11, render: () => <ControlsSection /> },
      { id: "inputs", label: "Inputs", icon: TextCursorInput, count: 5, render: () => <InputsSection /> },
      { id: "surfaces", label: "Surfaces", icon: Layers, count: 5, render: () => <SurfacesSection /> },
      { id: "agent", label: "Agent", icon: MessageSquare, count: 4, render: () => <AgentSection /> },
      { id: "system", label: "System", icon: Boxes, count: 4, render: () => <SystemSection /> },
      { id: "sileo", label: "Sileo", icon: Bell, count: 1, render: () => <SileoSection /> },
    ],
  },
  {
    label: "Our components",
    pages: [
      { id: "animated-empty", label: "AnimatedEmpty", icon: PackageOpen, count: 5, render: () => <AnimatedEmptySection /> },
      { id: "date-picker", label: "DatePicker", icon: CalendarClock, count: 7, render: () => <DatePickerSection /> },
      { id: "filter-menu", label: "FilterMenu", icon: ListFilter, count: 4, render: () => <FilterMenuSection /> },
      { id: "inset-dialog", label: "InsetDialog", icon: PanelTop, count: 2, render: () => <InsetDialogSection /> },
      { id: "lateral-preview", label: "LateralPreview", icon: PanelRight, count: 3, render: () => <LateralPreviewSection /> },
      { id: "mobile-action-confirmation", label: "MobileActionConfirmation", icon: Smartphone, count: 3, render: () => <MobileActionConfirmationSection /> },
      { id: "peek-card", label: "PeekCard", icon: IdCard, count: 4, render: () => <PeekCardSection /> },
      { id: "range-calendar", label: "RangeCalendar", icon: CalendarRange, count: 5, render: () => <RangeCalendarSection /> },
      { id: "timeline", label: "Timeline", icon: GitCommitVertical, count: 5, render: () => <TimelineSection /> },
      { id: "travel-tooltip", label: "TravelTooltip", icon: MousePointer2, count: 1, render: () => <TravelTooltipSection /> },
      { id: "widget-board", label: "WidgetBoard", icon: LayoutGrid, count: 5, render: () => <WidgetBoardSection /> },
      { id: "widget-card", label: "WidgetCard", icon: Grip, count: 7, render: () => <WidgetCardSection /> },
      { id: "window-controls", label: "WindowControls", icon: PanelsTopLeft, count: 1, render: () => <WindowControlsSection /> },
      { id: "workspace-panel", label: "WorkspacePanel", icon: LayoutPanelTop, count: 1, render: () => <WorkspacePanelSection /> },
    ],
  },
  /* Un block no es un componente: no resuelve una pieza sino una pantalla
     entera, armada con las piezas de los dos grupos de arriba. Por eso va en
     su propio grupo y no al final de "Componentes propios". */
  {
    label: "Our blocks",
    pages: [
      { id: "login-block", label: "LoginBlock", icon: LogIn, count: 1, render: () => <LoginBlockSection /> },
    ],
  },
] as const;

// El spread evita que flatMap reciba las tuplas readonly que deja `as const`,
// que no tipa bien contra su firma.
const PAGES = GROUPS.flatMap((g) => [...g.pages]);

type Page = (typeof PAGES)[number];

/* Una página del sidebar abierta como pestaña del panel. El contenido se arma
   acá y no en el panel porque `content` es un ReactNode que viaja en el estado
   del provider: la columna de lectura entra con la pestaña, no con el marco. */
const toTab = (p: Page): WorkspaceTab => ({
  id: p.id,
  label: p.label,
  icon: p.icon,
  content: <div className="mx-auto max-w-3xl px-6 py-10">{p.render()}</div>,
});

/* El provider va afuera del sidebar, no al lado del panel: los botones que
   abren pestañas son los del sidebar, así que el estado tiene que estar por
   encima de los dos. Por eso App no es el showcase — lo envuelve. */
export default function App() {
  return (
    <WorkspaceProvider defaultTabs={[toTab(PAGES[0])]}>
      {/* El preview del riel vive al lado de las pestañas y por el mismo
          motivo: lo que lo pide está en cualquier parte de la app y el riel se
          dibuja en una sola. */}
      <PreviewProvider>
        <Showcase />
      </PreviewProvider>
    </WorkspaceProvider>
  );
}

function Showcase() {
  const { openTab, activeId } = useWorkspace();
  const { preview } = usePreview();
  const [dark, setDark] = useState(false);
  /* El tirador del riel vive en un componente y el panel en otro, así que el
     estado «esto está por redimensionarse» sube hasta acá, que es donde los dos
     se encuentran. El riel avisa, el panel lo dice con su elevación. */
  /* El panel se marca —sombra y canto oscuro— cuando el botón que lo
     redimensiona está por usarse o se está usando. Las dos mitades se juntan
     acá: el hover del botón lo sabe App, que lo renderiza, y el tirón lo avisa
     el riel, que es quien lo hace. */
  const [apuntado, setApuntado] = useState(false);
  const [redimensionando, setRedimensionando] = useState(false);
  const armado = apuntado || redimensionando;
  /* La manija del riel. El botón de redimensionar vive en la barra del panel y
     el tirón lo sabe hacer el riel, así que el botón le pasa su evento de
     puntero y el riel hace el resto — mismo límite, mismo plegado del sidebar,
     misma captura. La única diferencia con agarrar el canto es dónde empezó la
     mano, y el tirón es relativo justamente para que eso no importe. */
  const riel = useRef<WidgetRailControl | null>(null);
  /* La lista del board vive acá: ni el riel ni el board son dueños de ella —
     sólo avisan cuando se cierra uno—, y vaciarla es lo que deja ver el estado
     vacío que el board ya sabe dibujar. */
  const [widgets, setWidgets] = useState(WIDGETS);
  /* El board se puede cerrar y el riel se va con él — salvo que haya un preview
     que mostrar, que es la otra cosa que vive ahí. Volver a abrirlo es el
     control de la barra: la × del board lo saca, el control lo trae, igual que
     el sidebar con su riel y su botón. */
  const [board, setBoard] = useState(true);
  /* El riel se dibuja si hay algo que poner en él: el board abierto, o un
     preview — que puede pedirse con el board cerrado. */
  const rielVisible = board || preview !== null;

  const toggleTheme = () =>
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });

  return (
    <SidebarProvider defaultOpen className="h-screen overflow-hidden bg-surface-1">
      <Sidebar variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">
              FF
            </div>
            <span className="text-[13px] font-medium">Fluid Functionalism</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.pages.map((p) => (
                  <SidebarMenuItem key={p.id}>
                    <SidebarMenuButton
                      icon={p.icon}
                      isActive={p.id === activeId}
                      onClick={() => openTab(toTab(p))}
                    >
                      {p.label}
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{p.count}</SidebarMenuBadge>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* El toggle de tema estuvo acá abajo mientras no hubo dónde: ahora la
            barra del panel tiene sus controles y ese es su lugar. Dos botones
            para lo mismo en la misma pantalla no son una comodidad, son una
            duda sobre cuál es el que manda. */}
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1">
            <p className="min-w-0 text-[12px] text-muted-foreground">
              24 from the registry + 14 in-house + 1 block + Sileo
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Un solo contexto de arrastre para el panel y el riel: sin esto cada
          board tendría el suyo y una tarjeta no podría cruzar de uno al otro.
          Va acá y no más adentro porque tiene que contener a los dos. */}
      <WidgetDragProvider>
      {/* El panel no vive adentro del contenido: es el contenido. Reemplaza al
          SidebarInset —que aportaba una tarjeta más, con su fondo, su sombra y
          su padding alrededor de otra tarjeta— y se lleva su papel: el `<main>`
          del documento y los márgenes atados al estado del sidebar, que salen
          del mismo `peer` que usaba el inset.

          Al perder ese marco el panel se apoya derecho sobre el sustrato de la
          página (escalón 1) y no sobre el 2 que pintaba el inset: la barra baja
          un escalón y el plano queda en 3. Es el mismo salto de dos, medido
          desde donde el panel está parado ahora. */}
      <WorkspaceOutlet
        as="main"
        lifted={armado}
        controls={
          /* `sidebar={false}` y `more={false}`: el botón del sidebar ya está en
             el otro extremo de esta misma barra, y el menú del navegador
             —pantalla completa, ventana flotante— no tiene por qué acompañar a
             tres controles de la app. Queda la barra con lo propio, adentro de
             un solo TravelTooltip que viaja de un botón al otro. */
          /* El `gap-1` que trae el riel del TravelTooltip es el de una fila de
             botones pegados; acá son tres controles sueltos y necesitan
             respirar un poco más. Se llega por el hijo directo porque el hueco
             lo pone el contenedor del tooltip, no el de `WindowControls`. */
          <WindowControls
            sidebar={false}
            more={false}
            size="compact"
            className="[&>div]:gap-1.5"
          >
            <TravelTooltipItem label={dark ? "Light mode" : "Dark mode"}>
              <Button
                variant="secondary"
                size="icon-compact"
                className={CONTROL}
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {dark ? <Sun /> : <Moon />}
              </Button>
            </TravelTooltipItem>

            <TravelTooltipItem label="Notifications">
              <Button
                variant="secondary"
                size="icon-compact"
                className={CONTROL}
                aria-label="Notifications"
              >
                <Bell />
              </Button>
            </TravelTooltipItem>

            {/* El tirador sólo existe si hay riel que tirar. Un botón que no
                hace nada es peor que uno que no está. */}
            {rielVisible && (
            /* Se redimensiona manteniéndolo apretado, no clickeándolo: por eso
               va por `onPointerDown` y no por `onClick`, y no lleva estado
               propio — el riel es el dueño del tirón y de su límite. */
            <TravelTooltipItem label="Hold to resize">
              <Button
                variant="secondary"
                size="icon-compact"
                className={cn(CONTROL, "cursor-col-resize")}
                aria-label="Resize the panel"
                onPointerDown={(e) => riel.current?.beginResize(e)}
                onPointerEnter={() => setApuntado(true)}
                onPointerLeave={() => setApuntado(false)}
                onFocus={() => setApuntado(true)}
                onBlur={() => setApuntado(false)}
                /* Las flechas hacen lo mismo en pasos. Sin esto, redimensionar
                   queda sólo para quien puede arrastrar. */
                onKeyDown={(e) => {
                  const manija = riel.current;
                  if (!manija) return;
                  const paso =
                    e.key === "ArrowRight"
                      ? -manija.step
                      : e.key === "ArrowLeft"
                        ? manija.step
                        : 0;
                  if (!paso) return;
                  e.preventDefault();
                  manija.nudge(paso);
                }}
              >
                <ChevronsLeftRight />
              </Button>
            </TravelTooltipItem>
            )}

            {/* El board se abre y se cierra desde el extremo de la barra, del
                lado donde el board aparece. Va siempre último, incluso cuando
                el tirador del riel se suma: es el control que gobierna a los
                demás y no debería cambiar de lugar según qué haya abierto. */}
            <TravelTooltipItem label={board ? "Hide the board" : "Show the board"}>
              <Button
                variant="secondary"
                size="icon-compact"
                className={CONTROL}
                aria-label={board ? "Hide the board" : "Show the board"}
                aria-pressed={board}
                onClick={() => setBoard((v) => !v)}
              >
                <LayoutGrid />
              </Button>
            </TravelTooltipItem>
          </WindowControls>
        }
        className="m-2 ml-0 min-h-0 w-full min-w-0 flex-1 transition-[margin] duration-80 peer-data-[state=collapsed]:ml-2"
      />

      {/* El riel de widgets: el board no es contenido de ninguna pestaña sino
          una región del shell, del mismo rango que el sidebar del otro costado.
          Por eso está siempre montado, y por eso el mosaico que abrió su vista
          deja un hueco en vez de quedarse: si se quedara, su plano y el de la
          pestaña serían el mismo `layoutId` en dos sitios a la vez.

          Va después del `WorkspaceOutlet` y no antes: el riel mide a su hermano
          anterior para saber cuánto se están repartiendo, que es de dónde sale
          el tope del tirón. */}
      {/* `AnimatePresence` para que el riel alcance a irse: sin esto se
          desmonta en el mismo cuadro en que se cierra el board y la animación
          de salida no llega a correr. `initial={false}` para que no haga una
          entrada en cada carga de la página — la entrada es para cuando alguien
          lo abre, no para cuando llega. */}
      <AnimatePresence initial={false}>
        {rielVisible && (
      <WidgetRail
        widgets={widgets}
        preview={preview}
        onBoardClose={() => setBoard(false)}
        onWidgetClose={(id) =>
          setWidgets((lista) => lista.filter((w) => w.id !== id))
        }
        /* El board arregla mientras la mano se mueve y devuelve los ids al
           soltar; el dueño de la lista sigue siendo este estado. Se reordena
           contra lo que hay: un id que ya no está —se cerró el widget a mitad
           del tirón— no puede reaparecer por venir en el arreglo. */
        onWidgetReorder={(ids) =>
          setWidgets((lista) =>
            ids
              .map((id) => lista.find((w) => w.id === id))
              .filter((w) => w !== undefined),
          )
        }
        /* El riel es destino: una tarjeta arrastrada desde el panel entra acá
           con el descriptor que traía. Se rechaza —`false`— lo que no sea un
           widget o lo que ya esté puesto: el board del otro lado se entera y
           devuelve la tarjeta a su lugar en vez de perderla.

           El id manda sobre el del descriptor: en una copia son distintos —el
           original se queda con el suyo— y el que vale es el que da el board,
           que es el único que sabe que no choca con nada. */
        onWidgetAdd={(id, index, data) => {
          const widget = data as WidgetDefinition | undefined;
          if (!widget?.id) return false;
          let puesto = false;
          setWidgets((lista) => {
            if (lista.some((w) => w.id === id)) return lista;
            puesto = true;
            const llega = { ...widget, id };
            return [...lista.slice(0, index), llega, ...lista.slice(index)];
          });
          return puesto;
        }}
        /* Y también origen: un widget arrastrado del riel a una bandeja del
           panel se va de la lista. Es lo mismo que hace cerrarlo, con la
           diferencia de que del otro lado alguien lo recibió. */
        onWidgetRemove={(id) =>
          setWidgets((lista) => lista.filter((w) => w.id !== id))
        }
        controlRef={riel}
        onResizingChange={setRedimensionando}
      />
        )}
      </AnimatePresence>
      </WidgetDragProvider>

      {/* theme explícito y no "system": la app alterna el tema con la clase
          .dark en <html>, mientras que "system" seguiría al sistema operativo
          y quedaría desincronizado del toggle de la cabecera. */}
      <Toaster
        position="bottom-right"
        offset={16}
        theme={dark ? "dark" : "light"}
      />
    </SidebarProvider>
  );
}
