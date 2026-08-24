"use client";

/**
 * InsetDialog — el diálogo con el contenido embutido en su propia tarjeta.
 *
 * El `Dialog` del registry apoya todo sobre un solo plano: cabecera, contenido
 * y pie comparten fondo, y lo que separa las tres zonas es el aire. Acá el
 * contenido se levanta en una tarjeta y lo que queda alrededor —cabecera y
 * pie— es el marco que la sostiene. Sirve cuando el contenido es una pieza en
 * sí misma (una lista larga, una tabla, un registro que corre, el paso de una
 * secuencia) y el marco es lo estable: título arriba, acciones abajo, y en el
 * medio algo que se mueve.
 *
 * Es la base de diálogo de los componentes propios: `MobileActionConfirmation`
 * es un `InsetDialog` anclado al piso.
 *
 * Cinco decisiones que conviene no deshacer sin mirar el resto:
 *
 * 1. **El diálogo no sube: baja su marco.** La tarjeta se queda en el escalón
 *    de siempre —sustrato + 4, el mismo que publica hacia adentro el diálogo
 *    del registry—, así que un popover abierto adentro sigue subiendo desde
 *    donde subía. Lo que se corre es la bandeja, cuatro escalones para abajo.
 *    Al revés —bandeja en su lugar y tarjeta más arriba— no se puede: en claro
 *    la escalera está aplanada en blanco desde el escalón 3, así que los dos
 *    planos quedarían del mismo color. Abajo es donde al tema claro todavía le
 *    queda recorrido: #FAFAFA contra #FFFFFF.
 *
 * 2. **La bandeja toma su fondo de un escalón y su sombra de otro.** El fondo
 *    baja al pie de la escalera pero la sombra pesa la de un diálogo, que es
 *    la que la despega del velo. Es la misma separación entre fondo y peso que
 *    usa el `FilterMenu` con `Elevated`.
 *
 * 3. **La tarjeta lleva el anillo y no la sombra entera.** No flota: está
 *    embutida. En oscuro la despega el color —#333333 sobre #171717— y en
 *    claro, donde los dos son casi el mismo blanco, la línea la dibuja entera
 *    el anillo de `shadow-surface-2`. Sin él, #FFFFFF contra #FAFAFA se
 *    distingue apenas.
 *
 * 4. **Dos anclas, dos escalones de motion.** Centrado es un diálogo y entra
 *    con `spring.slow`, el escalón de los diálogos. Anclado al piso es una
 *    hoja y va con `moderate`, que está críticamente amortiguado: una hoja
 *    pegada al borde que rebota se va abajo de la pantalla y vuelve. Es el
 *    mismo motivo por el que lo usa el `MobileDrawer`.
 *
 * 5. **La X se queda en `right-3 top-3`.** Es la esquina de todos los diálogos
 *    de la app; correrla al carril de la bandeja haría que este cierre en un
 *    lugar distinto que el resto. En vez de moverla, la cabecera le deja el
 *    carril libre y lo que va a la derecha del título arranca antes.
 *
 * Del portal al popup es el mismo baile que hace el `DialogContent` del
 * registry —velo, `transitionStatus` para que la salida se vea entera,
 * escotilla `container`, anchos de la escalera—, con las dos cosas que el suyo
 * no expone y que esta base necesita: el ancla al piso y el clic afuera que no
 * cierra.
 */

import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIcon } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import { spring } from "@/lib/springs";
import { SURFACE_BG, SURFACE_SHADOW } from "@/lib/surface-classes";
import { CARD_SHADOW, useInsetMetrics } from "@/lib/inset-metrics";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Medidas
// ---------------------------------------------------------------------------

/** Escalones que baja la bandeja respecto de la tarjeta. Cuatro es lo que hace
 *  falta para que en claro caiga del blanco plano (escalón 3 para arriba) a la
 *  parte de la escalera donde todavía hay gris. */
const TRAY_DROP = 4;

/** El carril que la cabecera le deja a la X: los 12px del ancla, más su caja
 *  de 28px, más aire. */
const CLOSE_LANE = 48;

/** Aire entre una bandeja anclada al piso y el borde de la pantalla. */
const FLOOR_INSET = 16;

/** Los anchos del diálogo del registry: la escalera lo angosta un escalón en
 *  regiones compactas — el ancho, no el relleno. */
const MAX_WIDTH = {
  sm: { default: 400, compact: 360 },
  lg: { default: 540, compact: 480 },
} as const;

/** Props que framer redefine con otra firma: no pueden viajar desde el payload
 *  de Base UI hasta un `motion.div`. */
type MotionSafeDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

// ---------------------------------------------------------------------------
// Raíz
// ---------------------------------------------------------------------------

interface InsetDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Atrapa el foco y bloquea el scroll de atrás. Apagalo para mostrarlo
   *  dentro de un marco, junto con `container` en el content. */
  modal?: boolean;
  /** El clic afuera no cierra. Un diálogo así suele ser una superficie de
   *  trabajo —una lista larga, un registro que corre— o una pregunta que hay
   *  que contestar, y no algo que se descarta al pasar: perderlo por un clic
   *  al costado es perder el lugar donde se estaba. El `Dialog` del registry
   *  no expone esta perilla de Base UI, y es una de las dos razones por las
   *  que esta base va sobre la primitiva y no sobre la suya. */
  disablePointerDismissal?: boolean;
  children?: ReactNode;
}

function InsetDialog({
  open,
  defaultOpen,
  onOpenChange,
  modal,
  disablePointerDismissal,
  children,
}: InsetDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(next)}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

const InsetDialogTrigger = DialogTrigger;
const InsetDialogClose = DialogClose;
const InsetDialogTitle = DialogTitle;
const InsetDialogDescription = DialogDescription;

// ---------------------------------------------------------------------------
// La bandeja
// ---------------------------------------------------------------------------

interface InsetDialogContentProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "lg";
  /** Dónde se para la bandeja. Centrado es un diálogo; al piso es una hoja, y
   *  ahí el aire de abajo respeta la barra de gestos del teléfono. */
  placement?: "center" | "bottom";
  /** La X de cierre. Por default sí cuando está centrado y no cuando va al
   *  piso: una hoja anclada suele traer sus dos salidas en el pie, y una X
   *  arriba sería una tercera. */
  showClose?: boolean;
  /** Marco al que se portalea, para mostrarlo dentro de una región acotada.
   *  Va con `<InsetDialog modal={false}>`; el marco tiene que ser `relative` y
   *  `overflow: hidden`. */
  container?: HTMLElement | null;
  /** Qué recibe el foco al abrir. Sin esto, el primer tabulable. */
  initialFocus?: boolean | RefObject<HTMLElement | null>;
  /** Adónde vuelve el foco al cerrar. */
  finalFocus?: boolean | RefObject<HTMLElement | null>;
}

const InsetDialogContent = forwardRef<HTMLDivElement, InsetDialogContentProps>(
  (
    {
      className,
      children,
      size = "sm",
      placement = "center",
      showClose,
      container,
      initialFocus,
      finalFocus,
      style,
      ...props
    },
    ref
  ) => {
    const XIcon = useIcon("x");
    const shape = useShape();
    const compact = useSize().variant === "compact";
    // El sustrato de acá afuera: la tarjeta sube los 4 de siempre y la bandeja
    // sale del mismo número, así las dos se mueven juntas si el diálogo se
    // abre sobre un sustrato más alto.
    const substrate = useSurface();
    const card = Math.min(substrate + 4, 8);
    const tray = Math.max(card - TRAY_DROP, 1);

    const floor = placement === "bottom";
    const withClose = showClose ?? !floor;
    const tier = floor ? spring.moderate : spring.slow;

    // Sin `if (!open) return null`: `DialogPrimitive.Popup` se desmonta solo y
    // espera a que la animación de salida termine —la ve por
    // `element.getAnimations()`— antes de sacarse del DOM.
    const popup = (
      <DialogPrimitive.Popup
        ref={ref}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        render={(popupProps, state) => {
          const exiting = state.transitionStatus === "ending";
          const { style: baseStyle, ...rest } =
            popupProps as HTMLAttributes<HTMLDivElement>;
          return (
            <motion.div
              // Primero lo de Base UI (rol, refs, data attrs)…
              {...(rest as MotionSafeDivProps)}
              // …y después lo del consumidor, que aterriza en la bandeja.
              {...(props as MotionSafeDivProps)}
              className={cn(
                floor
                  ? "pointer-events-auto w-full"
                  : cn(
                      container ? "absolute" : "fixed",
                      "left-1/2 top-1/2 z-50 w-[calc(100%-2rem)]"
                    ),
                // `p-0` y `flex-col`: acá el relleno no es del diálogo sino de
                // cada zona, y la tarjeta llega hasta el canto menos su aire.
                "flex max-h-[85%] flex-col overflow-hidden p-0 focus:outline-none",
                SURFACE_BG[tray],
                SURFACE_SHADOW[card],
                shape.container,
                className
              )}
              style={{
                ...(baseStyle as CSSProperties | undefined),
                maxWidth: MAX_WIDTH[size][compact ? "compact" : "default"],
                ...(style as CSSProperties | undefined),
              }}
              initial={
                floor
                  ? { opacity: 0, y: 24 }
                  : { opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }
              }
              animate={
                floor
                  ? { opacity: exiting ? 0 : 1, y: exiting ? 24 : 0 }
                  : {
                      opacity: exiting ? 0 : 1,
                      scale: exiting ? 0.97 : 1,
                      x: "-50%",
                      y: "-50%",
                    }
              }
              transition={exiting ? tier.exit : tier}
            >
              {/* Lo que se publica hacia adentro es el nivel de la tarjeta y no
                  el de la bandeja: el que se movió fue el marco, y un popover
                  abierto acá adentro tiene que seguir subiendo desde donde
                  subía en cualquier otro diálogo. */}
              <SurfaceProvider value={card}>
                {children}
                {withClose && (
                  <DialogPrimitive.Close
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-3 top-3"
                      >
                        <XIcon />
                        <span className="sr-only">Cerrar</span>
                      </Button>
                    }
                  />
                )}
              </SurfaceProvider>
            </motion.div>
          );
        }}
      />
    );

    return (
      <DialogPrimitive.Portal container={container ?? undefined}>
        {/* El mismo velo que los diálogos de la librería: un negro al 40% que
            sigue visible para quien tiene el sistema en oscuro —la variante
            `dark:` sólo matchea la clase explícita— y sube al 80% en oscuro. */}
        <DialogPrimitive.Backdrop
          render={(backdropProps, state) => {
            const exiting = state.transitionStatus === "ending";
            const { style: _style, ...rest } =
              backdropProps as HTMLAttributes<HTMLDivElement>;
            return (
              <motion.div
                {...(rest as MotionSafeDivProps)}
                className={cn(
                  container ? "absolute" : "fixed",
                  "inset-0 z-50 bg-black/40 dark:bg-black/80"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: exiting ? 0 : 1 }}
                transition={exiting ? tier.exit : tier}
              />
            );
          }}
        />

        {floor ? (
          // La capa que ubica la hoja contra el piso. No recibe el puntero: lo
          // único tocable de acá arriba es la hoja, y el velo de abajo tiene
          // que seguir recibiendo el clic que Base UI escucha.
          <div
            className={cn(
              container ? "absolute" : "fixed",
              "pointer-events-none inset-0 z-50 flex items-end justify-center"
            )}
            style={{
              padding: FLOOR_INSET,
              // El piso de un teléfono no es el borde de la pantalla: abajo
              // está la barra de gestos. `max()` deja el aire normal donde no
              // hay barra y lo corre hacia arriba donde sí.
              paddingBottom: `max(${FLOOR_INSET}px, env(safe-area-inset-bottom))`,
            }}
          >
            {popup}
          </div>
        ) : (
          popup
        )}
      </DialogPrimitive.Portal>
    );
  }
);
InsetDialogContent.displayName = "InsetDialogContent";

// ---------------------------------------------------------------------------
// Las tres zonas
// ---------------------------------------------------------------------------

interface InsetDialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Deja libre el carril de la X. Apagalo cuando el content va con
   *  `showClose={false}`, así el título vuelve a usar todo el ancho. */
  withClose?: boolean;
}

/** La zona de arriba, sobre la bandeja: título, y a la derecha lo que sea que
 *  acompañe —un contador, un estado, un identificador—. */
function InsetDialogHeader({
  className,
  style,
  withClose = true,
  ...props
}: InsetDialogHeaderProps) {
  const { pad, rail } = useInsetMetrics();
  return (
    <div
      className={cn("flex shrink-0 items-center gap-3", className)}
      style={{
        paddingLeft: pad + rail,
        paddingRight: withClose ? Math.max(pad + rail, CLOSE_LANE) : pad + rail,
        paddingTop: pad + rail,
        paddingBottom: pad,
        ...style,
      }}
      {...props}
    />
  );
}

/** La zona de abajo, sobre la bandeja: el estado a la izquierda y las acciones
 *  a la derecha. Es el mismo plano que la cabecera, y por eso las dos se leen
 *  como el marco de una sola pieza. */
function InsetDialogFooter({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { pad, rail } = useInsetMetrics();
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2", className)}
      style={{
        paddingInline: pad + rail,
        paddingTop: pad,
        paddingBottom: pad + rail,
        ...style,
      }}
      {...props}
    />
  );
}

interface InsetDialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** El contenido scrollea adentro de la tarjeta. Apagalo cuando lo de adentro
   *  ya maneje su propio scroll o cuando no haya nada que scrollear. */
  scrollable?: boolean;
  /** Clases del viewport que scrollea — ahí va el relleno del contenido, no en
   *  la tarjeta: si el relleno estuviera afuera, el texto se cortaría contra el
   *  canto al scrollear en vez de disolverse abajo del `scroll-fade`. */
  viewportClassName?: string;
}

/** La tarjeta: el contenido levantado sobre la bandeja. */
const InsetDialogBody = forwardRef<HTMLDivElement, InsetDialogBodyProps>(
  (
    { className, viewportClassName, scrollable = true, children, style, ...props },
    ref
  ) => {
    // El nivel que publicó la bandeja: el de siempre para un diálogo. La
    // tarjeta se queda ahí y no vuelve a subir — el que se movió fue el marco.
    const level = useSurface();
    const shape = useShape();
    const { pad } = useInsetMetrics();

    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          SURFACE_BG[level],
          SURFACE_SHADOW[CARD_SHADOW],
          shape.item,
          className
        )}
        style={{ marginInline: pad, ...style }}
        {...props}
      >
        {scrollable ? (
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName={cn("scroll-fade", viewportClassName)}
          >
            {children}
          </ScrollArea>
        ) : (
          children
        )}
      </div>
    );
  }
);
InsetDialogBody.displayName = "InsetDialogBody";

/** Un bloque de la tarjeta, con su rótulo y lo suyo a la derecha. El divisor
 *  es punteado y no lleno: adentro de la tarjeta separa zonas de la misma
 *  pieza, mientras que una línea llena leería como dos planos. */
function InsetDialogGroup({
  label,
  aside,
  className,
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  label?: ReactNode;
  aside?: ReactNode;
}) {
  const { pad, rail, compact } = useInsetMetrics();
  return (
    <div
      className={cn(
        "flex flex-col border-b border-dashed border-border last:border-b-0",
        className
      )}
      style={{ padding: pad + rail, ...style }}
      {...props}
    >
      {(label || aside) && (
        <div className="flex items-center justify-between gap-3">
          {label && (
            <span
              className={cn(
                "uppercase tracking-[0.08em] text-muted-foreground",
                compact ? "text-[11px]" : "text-[12px]"
              )}
            >
              {label}
            </span>
          )}
          {aside && (
            <span
              className={cn(
                "text-muted-foreground tabular-nums",
                compact ? "text-[11px]" : "text-[12px]"
              )}
            >
              {aside}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export {
  InsetDialog,
  InsetDialogTrigger,
  InsetDialogContent,
  InsetDialogHeader,
  InsetDialogBody,
  InsetDialogGroup,
  InsetDialogFooter,
  InsetDialogTitle,
  InsetDialogDescription,
  InsetDialogClose,
};
export type {
  InsetDialogProps,
  InsetDialogContentProps,
  InsetDialogHeaderProps,
  InsetDialogBodyProps,
};
