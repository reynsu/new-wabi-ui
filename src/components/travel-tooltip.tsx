"use client";

/**
 * TravelTooltip — un solo tooltip compartido por un grupo de triggers.
 *
 * La diferencia con un tooltip normal: cuando el puntero pasa de un trigger al
 * vecino, la píldora no se desmonta y vuelve a aparecer. Se traslada, ajusta su
 * ancho al texto nuevo y hace crossfade del label. El caret llega antes que el
 * cuerpo, que es lo que hace que el movimiento se lea como una sola pieza
 * siguiendo al cursor y no como dos tooltips distintos.
 *
 * Autónomo: no envuelve al Tooltip del registry, así que `shadcn add` no lo
 * toca. Un grupo de un solo item se comporta como un tooltip común.
 */

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { useSize, type SizeVariant } from "@/lib/size-context";
import { useTouchPrimary } from "@/hooks/use-touch-primary";

type Side = "top" | "bottom";

/** Aire mínimo entre la píldora y el borde del viewport, en px. */
const VIEWPORT_MARGIN = 8;
/** Media base del caret triangular, en px. */
const CARET = 4;

interface Registered {
  node: HTMLElement | null;
  label: string;
}

interface Geometry {
  /** Coordenadas de viewport: la píldora vive en un portal con position fixed. */
  left: number;
  top: number;
  width: number;
  /** Centro del trigger. Independiente del cuerpo: cuando el viewport recorta
   *  la píldora, el caret se queda apuntando al botón real. */
  caretX: number;
}

interface TravelTooltipContextValue {
  register: (index: number, entry: Registered | null) => void;
  activate: (index: number, immediate: boolean) => void;
  deactivate: (index: number) => void;
  activeIndex: number | null;
  open: boolean;
  tooltipId: string;
  enabled: boolean;
}

const TravelTooltipContext = createContext<TravelTooltipContextValue | null>(
  null
);

function useTravelTooltip() {
  const ctx = useContext(TravelTooltipContext);
  if (!ctx) {
    throw new Error("TravelTooltipItem debe usarse dentro de un TravelTooltip");
  }
  return ctx;
}

/* ─────────────────────────── Root ─────────────────────────── */

interface TravelTooltipProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** De qué lado del trigger se abre. @default "bottom" */
  side?: Side;
  /** Distancia en px entre el trigger y la píldora. @default 8 */
  sideOffset?: number;
  /** Espera antes de la primera apertura, en ms. Moverse a un trigger vecino
   *  con el tooltip ya abierto no espera nada — ahí está el efecto. @default 200 */
  delayDuration?: number;
  /** Gracia al salir del grupo, en ms. Evita el parpadeo al cruzar el hueco
   *  de 1-2px entre dos botones pegados. @default 90 */
  closeDelay?: number;
  /** Fija el grupo a un escalón de la escalera de tamaños. Omitido, sigue al
   *  SizeProvider de alrededor. */
  size?: SizeVariant;
  /** Clases para la píldora. */
  tooltipClassName?: string;
}

const TravelTooltip = forwardRef<HTMLDivElement, TravelTooltipProps>(
  (
    {
      children,
      side = "bottom",
      sideOffset = 8,
      delayDuration = 200,
      closeDelay = 90,
      size,
      className,
      tooltipClassName,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const measurerRef = useRef<HTMLSpanElement | null>(null);
    // Los nodos van en un ref: no participan del render, y guardarlos en
    // estado provocaría un render por cada montaje.
    const nodes = useRef(new Map<number, HTMLElement | null>());
    // Los labels sí van en estado: se pintan. En un ref, cambiar el label de un
    // item no re-renderizaba al padre y la píldora se quedaba con el texto
    // anterior hasta el próximo render por otro motivo.
    const [labels, setLabels] = useState<Record<number, string>>({});

    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [geometry, setGeometry] = useState<Geometry>({
      left: 0,
      top: 0,
      width: 0,
      caretX: 0,
    });
    const tooltipId = useId();
    const shape = useShape();
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";
    const isTouch = useTouchPrimary();
    const reduceMotion = useReducedMotion() ?? false;
    // En táctil no hay hover: el tooltip nunca se abre y el grupo queda como un
    // contenedor común. La plataforma ya resuelve eso con long-press.
    const enabled = !isTouch;

    const pillHeight = compact ? 20 : 24;

    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearTimers = useCallback(() => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      openTimer.current = null;
      closeTimer.current = null;
    }, []);
    useEffect(() => clearTimers, [clearTimers]);

    const register = useCallback((index: number, entry: Registered | null) => {
      if (entry) {
        nodes.current.set(index, entry.node);
        setLabels((prev) =>
          prev[index] === entry.label ? prev : { ...prev, [index]: entry.label }
        );
      } else {
        nodes.current.delete(index);
        setLabels((prev) => {
          if (!(index in prev)) return prev;
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    }, []);

    // Espejo del índice activo, para leerlo dentro de un timer sin recrearlo.
    const activeIndexRef = useRef<number | null>(null);
    useEffect(() => {
      activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    const activate = useCallback(
      (index: number, immediate: boolean) => {
        if (!enabled) return;
        clearTimers();
        // Ya abierto: el salto al vecino es inmediato, sin re-esperar el delay.
        // Es la razón de ser del componente.
        if (open || immediate || delayDuration <= 0) {
          setActiveIndex(index);
          setOpen(true);
          return;
        }
        openTimer.current = setTimeout(() => {
          setActiveIndex(index);
          setOpen(true);
        }, delayDuration);
      },
      [clearTimers, delayDuration, enabled, open]
    );

    const deactivate = useCallback(
      (index: number) => {
        if (openTimer.current) {
          clearTimeout(openTimer.current);
          openTimer.current = null;
        }
        closeTimer.current = setTimeout(() => {
          // Sólo cierra si nadie tomó el relevo mientras corría la gracia.
          if (activeIndexRef.current !== index) return;
          setActiveIndex(null);
          setOpen(false);
        }, closeDelay);
      },
      [closeDelay]
    );

    const activeLabel = activeIndex !== null ? labels[activeIndex] ?? "" : "";

    const measure = useCallback(() => {
      if (activeIndex === null) return;
      const node = nodes.current.get(activeIndex);
      const measurer = measurerRef.current;
      if (!node || !measurer) return;

      const triggerBox = node.getBoundingClientRect();
      const width = measurer.offsetWidth;
      const caretX = triggerBox.left + triggerBox.width / 2;

      // Centrada en el trigger, recortada contra el viewport. El recorte va
      // contra el viewport y no contra el grupo: una etiqueta larga en una
      // barra de cuatro iconos es más ancha que el grupo entero, y clampear
      // ahí la empujaría fuera de su propio trigger.
      const maxLeft = Math.max(
        VIEWPORT_MARGIN,
        window.innerWidth - width - VIEWPORT_MARGIN
      );
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(caretX - width / 2, maxLeft)
      );

      const top =
        side === "bottom"
          ? triggerBox.bottom + sideOffset
          : triggerBox.top - sideOffset - pillHeight;

      setGeometry({ left, top, width, caretX });
    }, [activeIndex, side, sideOffset, pillHeight]);

    // Se mide en layout, antes de pintar, para que la píldora no aparezca un
    // frame en la posición anterior.
    useLayoutEffect(measure, [measure, activeLabel, compact]);

    // Con position:fixed la píldora no sigue al trigger sola: hay que
    // recolocarla si algo scrollea o el viewport cambia de tamaño.
    useEffect(() => {
      if (!open) return;
      const onChange = () => measure();
      window.addEventListener("scroll", onChange, true);
      window.addEventListener("resize", onChange);
      return () => {
        window.removeEventListener("scroll", onChange, true);
        window.removeEventListener("resize", onChange);
      };
    }, [open, measure]);

    const travel = reduceMotion ? { duration: 0 } : spring.moderate;
    // El caret usa un tier más rápido que el cuerpo: llega antes, y esa
    // diferencia es lo que hace que el conjunto se lea persiguiendo al cursor.
    const caretTravel = reduceMotion ? { duration: 0 } : spring.fast;
    const fade = reduceMotion ? { duration: 0 } : spring.fast;

    const contextValue = useMemo<TravelTooltipContextValue>(
      () => ({
        register,
        activate,
        deactivate,
        activeIndex,
        open,
        tooltipId,
        enabled,
      }),
      [register, activate, deactivate, activeIndex, open, tooltipId, enabled]
    );

    // Contador propio en vez del índice que da Children.map: un hijo
    // condicional que resuelve a null dejaría un hueco en la numeración, y los
    // labels y la geometría se indexan por estos números.
    let slot = 0;
    const indexedChildren = Children.map(children, (child) =>
      // Igual que TabsList: inyectar _index en un <div> dispara el warning de
      // prop desconocida de React, así que sólo se toca a los componentes.
      isValidElement(child) && typeof child.type !== "string"
        ? cloneElement(child, { _index: slot++ } as Record<string, unknown>)
        : child
    );

    const overlay = (
      <AnimatePresence>
        {enabled && open && activeIndex !== null && (
          // Capa fija de tamaño cero en el origen del viewport: los hijos se
          // colocan con transform desde ahí. Va en un portal porque cualquier
          // ancestro con overflow recortaría la píldora — que es justo lo que
          // pasaba cuando esto vivía dentro del grupo.
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-50 h-0 w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: reduceMotion ? { duration: 0 } : spring.fast.exit }}
            transition={fade}
          >
            <motion.span
              aria-hidden
              className="absolute left-0 top-0 h-0 w-0 border-x-4 border-x-transparent"
              style={
                side === "bottom"
                  ? { borderBottom: `${CARET}px solid var(--foreground)` }
                  : { borderTop: `${CARET}px solid var(--foreground)` }
              }
              animate={{
                x: geometry.caretX - CARET,
                y:
                  side === "bottom"
                    ? geometry.top - CARET
                    : geometry.top + pillHeight,
              }}
              transition={caretTravel}
            />

            <motion.div
              role="tooltip"
              id={tooltipId}
              className={cn(
                "absolute left-0 top-0 flex items-center justify-center overflow-hidden",
                "bg-foreground text-background font-medium",
                compact ? "text-[11px] h-5" : "text-[12px] h-6",
                shape.bg,
                tooltipClassName
              )}
              initial={{
                scale: 0.92,
                x: geometry.left,
                y: geometry.top,
                width: geometry.width,
              }}
              animate={{
                scale: 1,
                x: geometry.left,
                y: geometry.top,
                width: geometry.width,
              }}
              exit={{ scale: 0.96 }}
              transition={{ ...travel, scale: fade }}
            >
              {/* El label viejo y el nuevo se superponen durante el cambio:
                  el saliente pasa a absolute, así el ancho lo manda la píldora
                  y no el más largo de los dos. */}
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={activeIndex}
                  className="whitespace-nowrap px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, position: "absolute" }}
                  transition={fade}
                >
                  {activeLabel}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <TravelTooltipContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<HTMLDivElement | null>).current =
                node;
          }}
          className={cn("relative flex items-center", sizeClasses.gap, className)}
          {...props}
        >
          {indexedChildren}

          {/* Medidor: fuera de pantalla, da el ancho de destino antes de animar.
              Animar a "auto" no sirve — framer lo resuelve midiendo el tamaño
              visual, que bajo un ancestro escalado sobrepasa. */}
          <span
            ref={measurerRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute -left-[9999px] top-0 whitespace-nowrap px-2 font-medium",
              compact ? "text-[11px]" : "text-[12px]"
            )}
          >
            {activeLabel}
          </span>
        </div>

        {/* Vite no hace SSR: document existe ya en el primer render, así que
            el portal no necesita el clásico guard de montaje. */}
        {typeof document !== "undefined"
          ? createPortal(overlay, document.body)
          : null}
      </TravelTooltipContext.Provider>
    );
  }
);

TravelTooltip.displayName = "TravelTooltip";

/* ─────────────────────────── Item ─────────────────────────── */

interface TravelTooltipItemProps {
  /** Texto de la píldora. */
  label: string;
  /** El trigger. Un único elemento — recibe los handlers y aria-describedby. */
  children: ReactElement;
  /** @internal Lo asigna TravelTooltip. */
  _index?: number;
}

function TravelTooltipItem({
  label,
  children,
  _index = 0,
}: TravelTooltipItemProps) {
  const { register, activate, deactivate, activeIndex, open, tooltipId, enabled } =
    useTravelTooltip();
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    register(_index, { node: nodeRef.current, label });
    return () => register(_index, null);
  }, [register, _index, label]);

  const isActive = open && activeIndex === _index;

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  // En React 19 `ref` es un prop más. Leerlo de `child.ref` está deprecado y
  // avisa por consola, así que se toma de props.
  const childRef = childProps.ref as React.Ref<HTMLElement> | undefined;

  return cloneElement(child, {
    // Se compone con el ref que el consumidor ya hubiera puesto en su trigger,
    // en vez de pisarlo.
    ref: (node: HTMLElement | null) => {
      nodeRef.current = node;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object") {
        (childRef as { current: HTMLElement | null }).current = node;
      }
    },
    // Los handlers se componen, no se reemplazan: un onMouseEnter del consumidor
    // tiene que seguir corriendo.
    onMouseEnter: (e: React.MouseEvent) => {
      activate(_index, false);
      (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      deactivate(_index);
      (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
    },
    // El foco abre sin esperar: quien navega con teclado ya declaró su intención.
    onFocus: (e: React.FocusEvent) => {
      activate(_index, true);
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      deactivate(_index);
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
    },
    "aria-describedby": enabled && isActive ? tooltipId : undefined,
  } as Record<string, unknown>);
}

TravelTooltipItem.displayName = "TravelTooltipItem";

export { TravelTooltip, TravelTooltipItem };
export type { TravelTooltipProps, TravelTooltipItemProps };
