"use client";

/**
 * WorkspacePanel — el marco de contenido que va al lado del sidebar.
 *
 * Una barra de pestañas donde la activa no es una píldora suelta sino que se
 * funde con el área de contenido: comparten fondo y las une un par de esquinas
 * cóncavas, como las pestañas de un navegador. Eso es lo que comunica que lo
 * de abajo es el contenido *de esa* pestaña y no un panel aparte.
 *
 * A la izquierda de la primera pestaña va el botón que muestra y oculta el
 * sidebar, así que el componente tiene que vivir dentro de un SidebarProvider.
 */

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSize, type SizeVariant } from "@/lib/size-context";
import { spring } from "@/lib/springs";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { SURFACE_BG, surfaceClasses } from "@/lib/surface-classes";
import type { IconComponent } from "@/lib/icon-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";

/** Radio de la pestaña y de las esquinas cóncavas que la unen al contenido.
 *  Un solo número: si difieren, la curva se nota partida en la unión. */
const TAB_RADIUS = 12;

/** Escalones que sube el plano (pestaña activa + contenido) sobre la barra.
 *  Dos, como cualquier capa que se apoya en su sustrato. */
const PLANE_OFFSET = 2;

/**
 * Peso fijo de la sombra del plano.
 *
 * El fondo del plano sigue al sustrato, pero su sombra no: de ella sólo se ve
 * el anillo de 1px del borde superior — el resto lo recorta el `overflow-hidden`
 * del panel — y ese anillo es la línea que separa la barra del contenido. Fijo
 * para que sea siempre un pelo, aunque el panel viva dentro de un diálogo.
 * Mismo recurso que el indicador de `tabs` con su `shadowLevel`.
 */
const PLANE_SHADOW = 3;

/** Lo que la pestaña activa monta sobre el plano para tapar el anillo de su
 *  sombra justo donde las dos se funden. */
const TAB_OVERLAP = 1;

/**
 * El aire de la barra: entre pestañas y también entre la fila y el contenido.
 *
 * Un solo número para los dos, porque son el mismo aire — al pasar el cursor,
 * el relleno de una pestaña tiene que quedar igual de despegado de su vecina
 * que del contenido de abajo.
 *
 * No lo subas a 24 (`TAB_RADIUS * 2`) para "arreglar" el solape de las
 * esquinas cóncavas de dos pestañas vecinas: ese solape es a propósito.
 */
const BAR_GAP = 4;

/**
 * Color del canto de la silueta.
 *
 * Es el mismo con el que la escalera dibuja todos sus anillos en claro
 * (`--shadow-color`), así que el canto de la pestaña y la línea que corre por
 * la barra son literalmente la misma línea. En oscuro la escalera separa por
 * color y este canto queda en un susurro, que es lo que corresponde.
 */
const EDGE = "var(--shadow-color)";

/**
 * Hasta dónde bajan los costados del canto, medido desde el pie de la pestaña.
 *
 * No es un número suelto: es exactamente donde arranca el arco de la esquina
 * cóncava, que empieza `TAB_RADIUS` por encima de la línea del plano y la
 * pestaña termina `BAR_GAP` por encima de ella. Ahí el canto tiene que cortar
 * — ni un pixel antes, que abre un hueco, ni uno después, que lo pisa.
 */
const EDGE_STOP = TAB_RADIUS - BAR_GAP;

interface WorkspaceTab {
  id: string;
  label: string;
  icon?: IconComponent;
  content: ReactNode;
}

interface WorkspacePanelProps {
  tabs: WorkspaceTab[];
  /** Pestaña activa (controlado). */
  value?: string;
  /** Pestaña activa inicial (no controlado). Por defecto, la primera. */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Cierra una pestaña. El componente no es dueño del array, así que sólo
   *  avisa: quien lo usa la saca de `tabs`. Sin este callback no hay botón de
   *  cerrar — no tendría nada que hacer. */
  onTabClose?: (id: string) => void;
  /** Fija el panel a un escalón de la escalera de tamaños. */
  size?: SizeVariant;
  className?: string;
}

/* ────────────────── Esquinas cóncavas de la pestaña activa ────────────────── */

/**
 * Cada esquina es un cuadrado al que se le muerde un cuarto de círculo
 * apoyado en su esquina exterior de arriba. Puesta al lado de la pestaña, esa
 * mordida es la curva que baja hacia la barra.
 *
 * Va en SVG y no como máscara sobre un fondo porque la curva no sólo se
 * rellena: también se traza. El arco es el tramo de la silueta que une el
 * canto del costado de la pestaña con la línea que corre por la barra, y con
 * el centro del círculo en la esquina exterior entra tangente a las dos — sin
 * codos en ninguna de las dos uniones.
 */
function ConcaveCorner({
  side,
  level,
}: {
  side: "left" | "right";
  level: number;
}) {
  const R = TAB_RADIUS;
  const outline = `${R} ${R} 0 0 0`;
  const borde =
    side === "left"
      ? `M0,${R} A${outline} ${R},0`
      : `M0,0 A${outline} ${R},${R}`;
  // Cerrar contra la esquina interior de abajo deja el relleno del lado del
  // contenido, que es de quien la esquina es parte.
  const fill = side === "left" ? `${borde} L${R},${R} Z` : `${borde} L0,${R} Z`;

  // El trazo no va sobre el borde del relleno sino medio pixel adentro del
  // círculo, que en una mordida es el lado de la barra. Con un trazo de 1px
  // eso lo deja pisando la misma banda que el canto de la pestaña arriba y la
  // línea del plano abajo: las tres líneas se continúan sin pisarse.
  const r = R - 0.5;
  const arco =
    side === "left"
      ? `M0,${r} A${r},${r} 0 0 0 ${r},0`
      : `M${R - r},0 A${r},${r} 0 0 0 ${R},${r}`;

  return (
    <svg
      aria-hidden
      width={R}
      height={R}
      viewBox={`0 0 ${R} ${R}`}
      className="pointer-events-none absolute"
      style={{
        // Alineada con el plano y no con la pestaña: la pestaña baja un pixel
        // de más para tapar el anillo, y ese pixel lo rellena el contenido,
        // que es del mismo color.
        bottom: TAB_OVERLAP,
        [side === "left" ? "left" : "right"]: -R,
        // El trazo se sale medio pixel del cuadrado en las dos puntas; ahí es
        // justo donde tiene que encontrarse con sus vecinos.
        overflow: "visible",
      }}
    >
      <path d={fill} style={{ fill: `var(--surface-${level})` }} />
      <path d={arco} fill="none" strokeWidth={1} style={{ stroke: EDGE }} />
    </svg>
  );
}

/* ─────────────────────── Canto de la pestaña activa ─────────────────────── */

/**
 * Techo y costados de la pestaña, en una capa aparte.
 *
 * Es un anillo entero —así las dos esquinas de arriba salen redondas de una,
 * sin empalmar tres líneas— al que una máscara le come la mitad de abajo. Ahí
 * se van juntos el canto del piso, que no existe porque la pestaña sigue en el
 * contenido, y la mitad inferior de los costados.
 *
 * Capa aparte y no una sombra en la propia pestaña porque la máscara recorta
 * todo lo que el elemento pinta, y la pestaña además pinta su fondo.
 */
function TabEdge({ skirt }: { skirt: number }) {
  const mask = `linear-gradient(to bottom, #000 calc(100% - ${EDGE_STOP}px), transparent calc(100% - ${EDGE_STOP}px))`;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        // La capa se pasa 1px para afuera en los tres lados y el anillo va
        // inset, así que el canto termina ocupando esa banda de afuera. Es
        // donde tiene que estar: el anillo del plano también corre por encima
        // del contenido y no por dentro, y las dos líneas tienen que caer del
        // mismo lado del relleno o no empalman.
        top: -1,
        left: -1,
        right: -1,
        // Abajo, en cambio, se corta antes del faldón: el faldón ya es
        // contenido y no lleva canto.
        bottom: skirt,
        // Uno más que el de la pestaña, para quedar concéntrico con ella.
        borderTopLeftRadius: TAB_RADIUS + 1,
        borderTopRightRadius: TAB_RADIUS + 1,
        boxShadow: `inset 0 0 0 1px ${EDGE}`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/* ──────────────────────────── El selector ──────────────────────────── */

/**
 * Todo lo que distingue a la pestaña activa —el plano, las dos esquinas
 * cóncavas y el canto— vive acá, en una sola capa que se desplaza de una
 * pestaña a otra en vez de aparecer y desaparecer.
 *
 * Es lo que convierte el cambio de pestaña en un movimiento: la forma es
 * siempre la misma y sólo viaja, que es exactamente lo que hace el indicador
 * de `tabs` del registry. Se anima `left` y `width` y no un `transform`
 * porque una escala deformaría el redondeo de las esquinas y los arcos.
 *
 * Las pestañas de abajo quedan limpias: sólo ponen su etiqueta y su hover.
 */
function TabSelector({
  rect,
  skirt,
  level,
}: {
  rect: { left: number; width: number; top: number; height: number };
  skirt: number;
  level: number;
}) {
  return (
    <motion.div
      aria-hidden
      // Nada de eventos: los arcos se meten por debajo de las vecinas y no
      // tienen por qué robarles el click.
      className={cn("pointer-events-none absolute z-10", SURFACE_BG[level])}
      // Sin animación de entrada: la primera vez tiene que aparecer ya puesto
      // sobre su pestaña, no viajando desde el borde.
      initial={false}
      animate={{ left: rect.left, width: rect.width }}
      transition={spring.moderate}
      style={{
        top: rect.top,
        // El faldón entra en la altura: el selector llega hasta el plano y le
        // monta el pixel que tapa su anillo.
        height: rect.height + skirt,
        borderTopLeftRadius: TAB_RADIUS,
        borderTopRightRadius: TAB_RADIUS,
      }}
    >
      <ConcaveCorner side="left" level={level} />
      <ConcaveCorner side="right" level={level} />
      <TabEdge skirt={skirt} />
    </motion.div>
  );
}

/* ───────────────────────── Botón del sidebar ───────────────────────── */

function SidebarToggle({
  compact,
  level,
}: {
  compact: boolean;
  level: number;
}) {
  const { open, toggleSidebar, side, isMobile, openMobile } = useSidebar();
  const visible = isMobile ? openMobile : open;

  const Icon =
    side === "right"
      ? visible
        ? PanelRightClose
        : PanelRightOpen
      : visible
        ? PanelLeftClose
        : PanelLeftOpen;

  return (
    <button
      type="button"
      aria-label={visible ? "Ocultar panel lateral" : "Mostrar panel lateral"}
      aria-pressed={visible}
      onClick={toggleSidebar}
      style={{ borderRadius: TAB_RADIUS }}
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center",
        "cursor-pointer outline-none transition-colors duration-80",
        "text-muted-foreground hover:text-foreground",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        // El relleno del hover es un rectángulo redondeado más ancho que el
        // círculo de reposo — es lo que se ve en la referencia.
        "hover:bg-active",
        compact ? "h-7 w-9" : "h-8 w-11"
      )}
    >
      <span
        // El chip se apoya en el mismo escalón que el plano, al 60% para que
        // sobre la barra sea un apoyo y no un botón más. Inline porque la
        // opacidad de un token dinámico no sale de las clases de Tailwind.
        style={{
          backgroundColor: `color-mix(in srgb, var(--surface-${level}) 60%, transparent)`,
        }}
        className={cn(
          // Es una superficie, así que va con su sombra: en oscuro lo despega
          // el color, pero en claro la escalera está aplanada en blanco y sin
          // el anillo de --shadow-1 no se ve que hay un chip.
          "flex items-center justify-center rounded-full shadow-surface-1",
          "[&_svg]:stroke-[1.5] group-hover:[&_svg]:stroke-2 [&_svg]:transition-[stroke-width] [&_svg]:duration-80",
          compact ? "h-5 w-5 [&_svg]:h-3 [&_svg]:w-3" : "h-6 w-6 [&_svg]:h-3.5 [&_svg]:w-3.5"
        )}
      >
        <Icon />
      </span>
    </button>
  );
}

/* ───────────────────────── WorkspacePanel ───────────────────────── */

function WorkspacePanel({
  tabs,
  value,
  defaultValue,
  onValueChange,
  onTabClose,
  size,
  className,
}: WorkspacePanelProps) {
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";

  // El panel se apoya donde lo pongan: la barra es el sustrato y el plano —
  // pestaña activa y contenido, que son la misma superficie — sube dos
  // escalones sobre ella.
  const substrate = useSurface();
  const barLevel = substrate;
  const planeLevel = Math.min(barLevel + PLANE_OFFSET, 8);

  // Lo que la activa baja de más que sus vecinas: cruza el aire de la barra y
  // encima monta el pixel que tapa el anillo del plano.
  const skirt = BAR_GAP + TAB_OVERLAP;

  // El selector necesita saber a dónde viajar, así que las pestañas se miden.
  // Es el mismo hook con el que se mide el indicador de `tabs`: publica los
  // rects en coordenadas de layout —`offsetLeft`, inmune a los transform— y
  // los vuelve a tomar solo con que una pestaña cambie de tamaño.
  const listRef = useRef<HTMLDivElement>(null);
  const { itemRects, registerItem } = useProximityHover<HTMLDivElement>(
    listRef,
    { axis: "x" }
  );
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? internal;

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setInternal(id);
      onValueChange?.(id);
    },
    [value, onValueChange]
  );

  // Resuelta y no el id crudo: al cerrar la pestaña activa, `active` queda
  // apuntando a un id que ya no está en `tabs`. Comparando contra esto, el
  // reemplazo queda marcado en vez de mostrarse el contenido de tabs[0] sin
  // ninguna pestaña seleccionada.
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  // Registrar acá y no en el `ref` de cada pestaña: un ref en línea se
  // vuelve a atar en cada render y haría remedir de más. Así el registro
  // ocurre sólo cuando cambia el array.
  useLayoutEffect(() => {
    tabs.forEach((_, i) => registerItem(i, itemsRef.current[i] ?? null));
    // Al cerrar una pestaña sobran índices registrados de la vuelta anterior.
    for (let i = tabs.length; i < itemsRef.current.length; i++) {
      registerItem(i, null);
    }
    itemsRef.current.length = tabs.length;
  }, [tabs, registerItem]);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab?.id);
  const activeRect = activeIndex >= 0 ? itemRects[activeIndex] : undefined;

  // Cerrar sólo tiene sentido si queda algo detrás.
  const closable = onTabClose != null && tabs.length > 1;

  const closeTab = useCallback(
    (id: string) => {
      // Al cerrar la activa hay que pasarle el relevo a una vecina: la de la
      // derecha, y si era la última la de la izquierda — la convención de
      // navegadores y editores. Se elige antes de avisar al padre porque
      // después la pestaña ya no está en `tabs` para saber quién la seguía.
      if (id === activeTab?.id) {
        const i = tabs.findIndex((t) => t.id === id);
        const vecina = tabs[i + 1] ?? tabs[i - 1];
        if (vecina) select(vecina.id);
      }
      onTabClose?.(id);
    },
    [activeTab?.id, tabs, select, onTabClose]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl",
        // La tarjeta entera flota un escalón sobre su sustrato; el fondo que
        // se ve acá es el de la barra, porque el contenido lo tapa.
        surfaceClasses(barLevel, Math.min(barLevel + 1, 8)),
        className
      )}
    >
      {/* items-end alinea abajo toda la fila, y el aire de la barra la despega
          del contenido tanto como se despegan las pestañas entre sí. La única
          que cruza ese aire es la activa, con su faldón. */}
      <div
        role="tablist"
        ref={listRef}
        className={cn(
          "relative flex shrink-0 items-end px-2",
          compact ? "pt-1.5" : "pt-2"
        )}
        style={{ gap: BAR_GAP, paddingBottom: BAR_GAP }}
      >
        {activeRect && (
          <TabSelector rect={activeRect} skirt={skirt} level={planeLevel} />
        )}

        <SidebarToggle compact={compact} level={planeLevel} />

        {tabs.map((tab, i) => {
          const isActive = tab.id === activeTab?.id;
          const Icon = tab.icon;
          return (
            // Contenedor y no <button>: el botón de cerrar es otro botón, y
            // anidarlos es HTML inválido. Como hermanos, cada uno conserva su
            // semántica nativa y el wrapper aporta el hover.
            <div
              key={tab.id}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              className={cn(
                "group relative inline-flex shrink-0 items-center",
                "transition-colors duration-80",
                compact ? "h-7 text-[12px]" : "h-8 text-[13px]",
                isActive
                  ? // Ni fondo ni forma: eso lo pone el selector, que viaja
                    // por debajo. Acá sólo queda la etiqueta, y va por encima
                    // de él.
                    "z-20 text-foreground font-medium"
                  : // --active (10% blanco) y no --hover (6%): sobre la barra,
                    // el 6% cae en #232323, a dos puntos del #252525 del tab
                    // activo, y el relleno no se despega del fondo.
                    "text-muted-foreground hover:bg-active hover:text-foreground"
              )}
              // Mismo radio que el selector: dos redondeos distintos en la
              // misma fila se notan.
              style={{ borderRadius: TAB_RADIUS }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => select(tab.id)}
                className={cn(
                  "relative inline-flex h-full items-center bg-transparent",
                  "cursor-pointer outline-none",
                  "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                  compact ? "gap-1.5 pl-2.5" : "gap-2 pl-3",
                  // Sin botón de cerrar, el padding derecho lo pone la propia
                  // pestaña.
                  closable ? "pr-1" : compact ? "pr-2.5" : "pr-3"
                )}
                style={{ borderRadius: TAB_RADIUS }}
              >
                {Icon && (
                  <span
                    className={cn(
                      "relative flex items-center justify-center",
                      "[&_svg]:stroke-[1.5] group-hover:[&_svg]:stroke-2 [&_svg]:transition-[stroke-width] [&_svg]:duration-80",
                      compact ? "[&_svg]:h-3.5 [&_svg]:w-3.5" : "[&_svg]:h-4 [&_svg]:w-4"
                    )}
                  >
                    <Icon />
                  </span>
                )}
                <span className="relative whitespace-nowrap">{tab.label}</span>
              </button>

              {closable && (
                // Siempre en el layout, invisible hasta el hover: si apareciera
                // recién entonces, la pestaña cambiaría de ancho y la fila
                // entera saltaría bajo el cursor.
                <button
                  type="button"
                  aria-label={`Cerrar ${tab.label}`}
                  onClick={() => closeTab(tab.id)}
                  className={cn(
                    "relative mr-1 inline-flex items-center justify-center",
                    "cursor-pointer rounded-md outline-none",
                    "opacity-0 transition-opacity duration-80 pointer-events-none",
                    // El foco también lo revela: si no, con teclado se llega a
                    // un botón que no se ve.
                    "group-hover:pointer-events-auto group-hover:opacity-100",
                    "focus-visible:pointer-events-auto focus-visible:opacity-100",
                    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                    "text-muted-foreground hover:bg-active hover:text-foreground",
                    compact
                      ? "h-4 w-4 [&_svg]:h-2.5 [&_svg]:w-2.5"
                      : "h-5 w-5 [&_svg]:h-3 [&_svg]:w-3"
                  )}
                >
                  <X />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* El plano lleva fondo *y* sombra. En oscuro lo despega el color, pero
          en claro la escalera de superficies está aplanada en blanco desde el
          escalón 3, así que la separación con la barra la da entera el anillo
          de la sombra. Sin él, #FAFAFA contra #FFFFFF no se distingue. */}
      <div
        role="tabpanel"
        className={cn(
          "min-h-0 flex-1 overflow-auto",
          surfaceClasses(planeLevel, PLANE_SHADOW)
        )}
      >
        {/* Lo que se monte adentro arranca desde el nivel del plano, no desde
            el sustrato del panel: un popover en una pestaña sigue subiendo. */}
        <SurfaceProvider value={planeLevel}>{activeTab?.content}</SurfaceProvider>
      </div>
    </div>
  );
}

WorkspacePanel.displayName = "WorkspacePanel";

export { WorkspacePanel };
export type { WorkspacePanelProps, WorkspaceTab };
