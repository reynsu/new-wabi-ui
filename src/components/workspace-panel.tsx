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
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useSize, type SizeVariant } from "@/lib/size-context";
import type { IconComponent } from "@/lib/icon-context";

/** Radio de la pestaña y de las esquinas cóncavas que la unen al contenido.
 *  Un solo número: si difieren, la curva se nota partida en la unión. */
const TAB_RADIUS = 12;

/** Separación entre pestañas. Cada esquina cóncava sobresale TAB_RADIUS a su
 *  lado, así que con menos que el doble las cajas de dos vecinas se solapan y
 *  sus rellenos se apilan: en esa franja el resultado lo decide el orden del
 *  DOM, no el diseño. */
const TAB_GAP = TAB_RADIUS * 2;

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
  /** Fija el panel a un escalón de la escalera de tamaños. */
  size?: SizeVariant;
  className?: string;
}

/* ────────────────── Esquinas cóncavas de la pestaña ────────────────── */

/**
 * La forma de pestaña es de TODAS las pestañas, no sólo de la activa: arriba
 * redondeada y abajo abriéndose hacia la barra con un cuarto de círculo
 * recortado a cada lado. Lo que cambia con el estado es sólo el relleno.
 *
 * Cada esquina es un cuadrado al que un radial-gradient como mask le quita un
 * cuarto de círculo; puesto al lado de la pestaña, ese recorte dibuja la curva.
 *
 * La activa se rellena con el color del contenido, así que va en un style
 * inline. La inactiva se rellena sólo en hover, y ahí conviene la clase: el
 * `group` del botón la activa junto con el fondo de la pestaña, y al componer
 * las dos el mismo 10% sobre la misma barra, no queda costura entre el cuerpo
 * y sus esquinas.
 */
function ConcaveCorner({
  side,
  active,
}: {
  side: "left" | "right";
  active: boolean;
}) {
  const mask =
    side === "left"
      ? `radial-gradient(circle at 0 0, transparent ${TAB_RADIUS}px, #000 ${TAB_RADIUS}px)`
      : `radial-gradient(circle at 100% 0, transparent ${TAB_RADIUS}px, #000 ${TAB_RADIUS}px)`;

  const style: CSSProperties = {
    width: TAB_RADIUS,
    height: TAB_RADIUS,
    maskImage: mask,
    WebkitMaskImage: mask,
    [side === "left" ? "left" : "right"]: -TAB_RADIUS,
    ...(active ? { backgroundColor: "var(--surface-3)" } : null),
  } as CSSProperties;

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-0 transition-colors duration-80",
        !active && "bg-transparent group-hover:bg-active"
      )}
      style={style}
    />
  );
}

/* ───────────────────────── Botón del sidebar ───────────────────────── */

function SidebarToggle({ compact }: { compact: boolean }) {
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
        className={cn(
          "flex items-center justify-center rounded-full bg-surface-3/60",
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
  size,
  className,
}: WorkspacePanelProps) {
  const sizeClasses = useSize(size);
  const compact = sizeClasses.variant === "compact";

  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? internal;

  const select = useCallback(
    (id: string) => {
      if (value === undefined) setInternal(id);
      onValueChange?.(id);
    },
    [value, onValueChange]
  );

  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl bg-surface-1 shadow-surface-2",
        className
      )}
    >
      {/* items-end para que el borde inferior de la pestaña activa quede a ras
          del contenido: si sobra un pixel, las esquinas cóncavas no cierran. */}
      <div
        role="tablist"
        style={{ gap: TAB_GAP }}
        className={cn("flex shrink-0 items-end px-2", compact ? "pt-1.5" : "pt-2")}
      >
        <SidebarToggle compact={compact} />

        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => select(tab.id)}
              className={cn(
                "group relative inline-flex shrink-0 items-center",
                "cursor-pointer outline-none transition-colors duration-80",
                "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                compact
                  ? "h-7 gap-1.5 px-2.5 text-[12px]"
                  : "h-8 gap-2 px-3 text-[13px]",
                isActive
                  ? // La activa comparte fondo con el contenido y sólo redondea
                    // arriba: abajo se continúa en el panel.
                    "bg-surface-3 text-foreground font-medium"
                  : // --active (10% blanco) y no --hover (6%): sobre la barra,
                    // el 6% cae en #232323, a dos puntos del #252525 del tab
                    // activo, y el relleno no se despega del fondo.
                    "text-muted-foreground hover:bg-active hover:text-foreground"
              )}
              // Sólo arriba: abajo la silueta la continúan las esquinas
              // cóncavas, en cualquier estado.
              style={{
                borderTopLeftRadius: TAB_RADIUS,
                borderTopRightRadius: TAB_RADIUS,
              }}
            >
              <ConcaveCorner side="left" active={isActive} />
              <ConcaveCorner side="right" active={isActive} />

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
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="min-h-0 flex-1 overflow-auto bg-surface-3"
      >
        {activeTab?.content}
      </div>
    </div>
  );
}

WorkspacePanel.displayName = "WorkspacePanel";

export { WorkspacePanel };
export type { WorkspacePanelProps, WorkspaceTab };
