"use client";

/**
 * WindowControls — la barra de iconos que controla el estado de la ventana y
 * del sidebar, con un TravelTooltip compartido.
 *
 * Los tres botones operan sobre estado real, no simulado:
 *   sidebar          useSidebar() del registry
 *   pantalla completa Fullscreen API
 *   ventana flotante  Document Picture-in-Picture
 *
 * Cada etiqueta refleja el estado actual ("Ocultar" ⇄ "Mostrar"), así que al
 * pulsar con el tooltip abierto la píldora se remide y se ajusta al texto
 * nuevo sin cerrarse. Es el mismo mecanismo del traslado entre botones, pero
 * disparado por un cambio de estado en vez de por el puntero.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PictureInPicture2,
  SquarePen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownContent,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { useSidebar } from "@/components/ui/sidebar";
import { TravelTooltip, TravelTooltipItem } from "@/components/travel-tooltip";
import { cn } from "@/lib/utils";
import type { SizeVariant } from "@/lib/size-context";

/* ───────────────────────── Pantalla completa ───────────────────────── */

function useFullscreen(target?: () => Element | null) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // El usuario puede salir con Escape sin tocar el botón, así que el estado se
  // deriva del evento del navegador y no de lo que hicimos nosotros.
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const el = target?.() ?? document.documentElement;
        await el.requestFullscreen();
      }
    } catch {
      // Se rechaza cuando no hay gesto de usuario o una política lo bloquea.
      // El listener de arriba deja el estado como esté realmente.
    }
  }, [target]);

  return {
    isFullscreen,
    toggle,
    supported:
      typeof document !== "undefined" && document.fullscreenEnabled === true,
  };
}

/* ───────────────────────── Ventana flotante ───────────────────────── */

interface DocumentPiP {
  requestWindow: (options?: {
    width?: number;
    height?: number;
  }) => Promise<Window>;
  window: Window | null;
}

function getPiP(): DocumentPiP | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { documentPictureInPicture?: DocumentPiP })
    .documentPictureInPicture ?? null;
}

/** Clona los estilos del documento principal dentro de la ventana flotante.
 *  Sin esto sale sin CSS: es un documento aparte, no hereda nada. En dev Vite
 *  inyecta <style>, en build quedan como <link>, así que hay que cubrir los
 *  dos casos. */
function copyStyles(target: Window) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("");
      const style = target.document.createElement("style");
      style.textContent = rules;
      target.document.head.appendChild(style);
    } catch {
      // Hoja de otro origen: no se pueden leer sus reglas, se enlaza.
      if (!sheet.href) continue;
      const link = target.document.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      target.document.head.appendChild(link);
    }
  }
  // El tema vive en una clase de <html>, que la ventana nueva no hereda.
  target.document.documentElement.className =
    document.documentElement.className;
}

function useFloatingWindow(content: ReactNode) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  // Que la API exista no garantiza que funcione: dentro de un panel embebido
  // (no una ventana de primer nivel) requestWindow rechaza con
  // InvalidStateError. Sólo se sabe intentándolo, así que el primer fallo
  // marca el botón como no disponible en vez de dejarlo muerto y en silencio.
  const [unavailable, setUnavailable] = useState(false);
  const supported = getPiP() !== null && content != null && !unavailable;

  const close = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  const open = useCallback(async () => {
    const pip = getPiP();
    if (!pip) return;
    if (pip.window) {
      pip.window.close();
      setPipWindow(null);
      return;
    }
    try {
      const w = await pip.requestWindow({ width: 320, height: 180 });
      copyStyles(w);
      w.document.body.style.margin = "0";
      // Cerrar desde la cruz de la ventana también tiene que limpiar el estado.
      w.addEventListener("pagehide", () => setPipWindow(null), { once: true });
      setPipWindow(w);
    } catch {
      // Sin gesto de usuario, bloqueado por política, o un contexto que no
      // puede abrir ventanas. En cualquier caso el botón deja de ofrecer algo
      // que no va a pasar.
      setUnavailable(true);
    }
  }, []);

  // Si el componente se desmonta con la ventana abierta, se cierra con él.
  useEffect(() => () => pipWindow?.close(), [pipWindow]);

  const portal = pipWindow
    ? createPortal(content, pipWindow.document.body)
    : null;

  return { isOpen: pipWindow !== null, open, close, supported, portal };
}

/* ───────────────────────── Botones ───────────────────────── */

/** Cada control es un botón suelto con su propia superficie, no tres iconos
 *  dentro de una píldora compartida. `tertiary` aporta el anillo de 1px que lo
 *  delimita, y rounded-full lo vuelve circular — que es la convención para
 *  controles de ventana. Es el único punto donde el componente se aparta a
 *  propósito del sistema de formas: shape.button daría 8px en modo "rounded",
 *  y acá el círculo es parte de la identidad del control. */
const CONTROL_CLASS = "rounded-full";

/* ───────────────────────── Botón del sidebar ───────────────────────── */

/** Aparte para que el hook sólo corra cuando se pide el botón: useSidebar()
 *  lanza fuera de un SidebarProvider, y el resto de los controles no lo
 *  necesitan. */
function SidebarControl({ _index }: { _index?: number }) {
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
    // TravelTooltip inyecta _index en este componente, no en el item que
    // devuelve, así que hay que reenviarlo a mano.
    <TravelTooltipItem
      _index={_index}
      label={visible ? "Ocultar panel lateral" : "Mostrar panel lateral"}
    >
      <Button
        variant="tertiary"
        size="icon"
        className={CONTROL_CLASS}
        aria-label={visible ? "Ocultar panel lateral" : "Mostrar panel lateral"}
        aria-pressed={visible}
        onClick={toggleSidebar}
      >
        <Icon />
      </Button>
    </TravelTooltipItem>
  );
}

/* ───────────────────────── Botón "Más…" ───────────────────────── */

interface MoreControlProps {
  fullscreen: ReturnType<typeof useFullscreen>;
  floating: ReturnType<typeof useFloatingWindow>;
  hasFloating: boolean;
  extraItems?: (startIndex: number) => ReactNode;
  _index?: number;
}

function MoreControl({
  fullscreen,
  floating,
  hasFloating,
  extraItems,
  _index,
}: MoreControlProps) {
  const [open, setOpen] = useState(false);

  // El menú se despliega justo donde iría la píldora, así que mientras está
  // abierto el item se silencia en vez de dibujar los dos encima.
  let i = 0;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <TravelTooltipItem _index={_index} label="Más…" suppressed={open}>
        <DropdownTrigger
          render={
            <Button
              variant="tertiary"
              size="icon"
              className={CONTROL_CLASS}
              aria-label="Más opciones"
            />
          }
        >
          <MoreHorizontal />
        </DropdownTrigger>
      </TravelTooltipItem>

      <DropdownContent side="bottom" align="start">
        <MenuItem
          index={i++}
          label={
            fullscreen.isFullscreen
              ? "Salir de pantalla completa"
              : "Pantalla completa"
          }
          disabled={!fullscreen.supported}
          onSelect={fullscreen.toggle}
        />
        {hasFloating && (
          <MenuItem
            index={i++}
            label={
              floating.isOpen
                ? "Cerrar ventana flotante"
                : "Usar ventana flotante"
            }
            disabled={!floating.supported}
            onSelect={floating.isOpen ? floating.close : floating.open}
          />
        )}
        {extraItems && (
          <>
            <DropdownSeparator />
            {extraItems(i)}
          </>
        )}
      </DropdownContent>
    </DropdownMenu>
  );
}

/* ───────────────────────── WindowControls ───────────────────────── */

interface WindowControlsProps {
  /** Incluye el botón que abre y cierra el sidebar. Requiere estar dentro de
   *  un SidebarProvider — el hook lanza si no lo hay. @default true */
  sidebar?: boolean;
  /** Qué elemento va a pantalla completa. Por defecto, el documento entero. */
  fullscreenTarget?: () => Element | null;
  /** Contenido de la ventana flotante. Sin esto el botón no se renderiza:
   *  una ventana vacía no le sirve a nadie. */
  floatingContent?: ReactNode;
  /** Acción del primer botón. Sin esto, ese botón no se renderiza. */
  onCompose?: () => void;
  /** Etiqueta del primer botón. @default "Nueva nota" */
  composeLabel?: string;
  /** Items extra para el menú "Más…". Recibe el índice desde el que seguir,
   *  porque MenuItem los necesita contiguos para su resalte por proximidad. */
  moreItems?: (startIndex: number) => ReactNode;
  /** Fija la barra a un escalón de la escalera de tamaños. */
  size?: SizeVariant;
  className?: string;
}

function WindowControls({
  sidebar = true,
  fullscreenTarget,
  floatingContent,
  onCompose,
  composeLabel = "Nueva nota",
  moreItems,
  size,
  className,
}: WindowControlsProps) {
  const fullscreen = useFullscreen(fullscreenTarget);
  const floating = useFloatingWindow(floatingContent);

  return (
    <>
      <div className={cn("inline-flex", className)}>
        {/* side="bottom" fijo: estos controles viven en la barra superior de
            una ventana, donde hacia arriba no hay lugar. */}
        <TravelTooltip side="bottom" size={size}>
          {onCompose ? (
            <TravelTooltipItem label={composeLabel}>
              <Button
                variant="tertiary"
                size="icon"
                className={CONTROL_CLASS}
                aria-label={composeLabel}
                onClick={onCompose}
              >
                <SquarePen />
              </Button>
            </TravelTooltipItem>
          ) : null}

          {floatingContent != null ? (
            <TravelTooltipItem
              label={
                !floating.supported
                  ? "Este navegador no abre ventanas flotantes"
                  : floating.isOpen
                    ? "Cerrar ventana flotante"
                    : "Usar ventana flotante"
              }
            >
              <Button
                variant="tertiary"
                size="icon"
                className={cn(CONTROL_CLASS, !floating.supported && "opacity-50")}
                aria-label={
                  floating.isOpen
                    ? "Cerrar ventana flotante"
                    : "Usar ventana flotante"
                }
                aria-pressed={floating.isOpen}
                aria-disabled={!floating.supported}
                onClick={
                  !floating.supported
                    ? undefined
                    : floating.isOpen
                      ? floating.close
                      : floating.open
                }
              >
                <PictureInPicture2 />
              </Button>
            </TravelTooltipItem>
          ) : null}

          <MoreControl
            fullscreen={fullscreen}
            floating={floating}
            hasFloating={floatingContent != null}
            extraItems={moreItems}
          />

          {sidebar ? <SidebarControl /> : null}
        </TravelTooltip>
      </div>

      {floating.portal}
    </>
  );
}

WindowControls.displayName = "WindowControls";

export { WindowControls };
export type { WindowControlsProps };
