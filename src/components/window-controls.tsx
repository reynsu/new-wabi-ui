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
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PictureInPicture2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
        variant="ghost"
        size="icon"
        aria-label={visible ? "Ocultar panel lateral" : "Mostrar panel lateral"}
        aria-pressed={visible}
        onClick={toggleSidebar}
      >
        <Icon />
      </Button>
    </TravelTooltipItem>
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
  /** De qué lado abre el tooltip compartido. @default "bottom" */
  tooltipSide?: "top" | "bottom";
  /** Fija la barra a un escalón de la escalera de tamaños. */
  size?: SizeVariant;
  className?: string;
}

function WindowControls({
  sidebar = true,
  fullscreenTarget,
  floatingContent,
  tooltipSide = "bottom",
  size,
  className,
}: WindowControlsProps) {
  const fullscreen = useFullscreen(fullscreenTarget);
  const floating = useFloatingWindow(floatingContent);

  return (
    <>
      <div
        className={cn(
          "inline-flex rounded-full bg-surface-3 p-1 shadow-surface-2",
          className
        )}
      >
        <TravelTooltip side={tooltipSide} size={size}>
          {sidebar ? <SidebarControl /> : null}

          <TravelTooltipItem
            label={
              fullscreen.supported
                ? fullscreen.isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
                : "Pantalla completa no disponible"
            }
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                fullscreen.isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
              aria-pressed={fullscreen.isFullscreen}
              // aria-disabled y no el atributo disabled: un botón deshabilitado
              // no emite eventos de puntero, así que su tooltip —el único lugar
              // donde dice por qué no se puede— sería inalcanzable.
              aria-disabled={!fullscreen.supported}
              className={cn(!fullscreen.supported && "opacity-50")}
              onClick={fullscreen.supported ? fullscreen.toggle : undefined}
            >
              {fullscreen.isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </TravelTooltipItem>

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
                variant="ghost"
                size="icon"
                aria-label={
                  floating.isOpen
                    ? "Cerrar ventana flotante"
                    : "Usar ventana flotante"
                }
                aria-pressed={floating.isOpen}
                aria-disabled={!floating.supported}
                className={cn(!floating.supported && "opacity-50")}
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
        </TravelTooltip>
      </div>

      {floating.portal}
    </>
  );
}

WindowControls.displayName = "WindowControls";

export { WindowControls };
export type { WindowControlsProps };
