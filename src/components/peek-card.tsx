"use client";

/**
 * PeekCard — una tarjeta con pestañas anclada a lo que la abre.
 *
 * Es el escalón que falta entre el tooltip y el diálogo: más de lo que entra
 * en una píldora de una línea, menos de lo que justifica tapar la pantalla.
 * Un nombre, un ícono, un riel de `Tabs` y el cuerpo de la pestaña
 * elegida, todo pegado al elemento que lo disparó para que se lea como una
 * ampliación de ese elemento y no como una ventana nueva.
 *
 * Cinco decisiones que conviene no deshacer sin mirar el resto:
 *
 * 1. **Un solo componente para los dos gestos.** `openOn="click"` y
 *    `openOn="hover"` son la misma tarjeta con la misma anatomía; lo único que
 *    cambia es qué la abre. Son dos componentes distintos en casi todas las
 *    librerías —popover y hover-card— y esa división obliga a mantener dos
 *    veces la misma anatomía para terminar eligiendo por el gesto, que es lo
 *    de afuera. Acá el gesto es una prop.
 *
 * 2. **El hover no se lleva el foco.** Una tarjeta que aparece porque el
 *    puntero pasó por encima no pidió el foco: moverlo ahí saca al teclado del
 *    lugar donde estaba y hace saltar el scroll. Con `openOn="hover"` el foco
 *    entra sólo cuando la abrió el teclado. Con `openOn="click"` sí entra: ahí
 *    hubo una intención explícita.
 *
 * 3. **El contenido va embutido, igual que en `InsetDialog`.** El marco
 *    —título y pestañas arriba, pie abajo— es lo estable; el cuerpo de la
 *    pestaña se levanta en su propia tarjeta adentro de la bandeja. Es el
 *    mismo reparto que hace el diálogo propio, y acá cae solo: al cambiar de
 *    pestaña se mueve una sola cosa y todo lo que la rodea se queda quieto. El
 *    aire sale de `useInsetMetrics`, el mismo del diálogo, así las dos piezas
 *    se leen como una familia y no como dos que se parecen.
 *
 * 4. **La bandeja baja; la tarjeta se queda.** También como en `InsetDialog`:
 *    lo que se publica hacia adentro es el escalón que un popover publica
 *    siempre —sustrato + 2—, así un menú abierto acá adentro sigue subiendo
 *    desde donde subía, y el que se corre para abajo es el marco. La sombra de
 *    la bandeja queda fija en la de un popup y la de la tarjeta en la de un
 *    embutido —el anillo y una línea—: no flota, está metida adentro.
 *
 * 5. **No es modal.** La página sigue scrolleando y el positioner de Base UI
 *    sigue al ancla, así que la tarjeta viaja con su trigger en vez de quedarse
 *    flotando donde estaba. Es lo que separa una ampliación de un diálogo: si
 *    hay que bloquear la página detrás, lo que hacía falta era un `Dialog`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { Popover } from "@base-ui/react/popover";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { TabItem, Tabs, TabsList } from "@/components/ui/tabs";
import { useMeasuredHeight } from "@/hooks/use-measured-height";
import type { IconComponent } from "@/lib/icon-context";
import { CARD_SHADOW, useInsetMetrics } from "@/lib/inset-metrics";
import { useShape } from "@/lib/shape-context";
import {
  SizeProvider,
  useSizeVariant,
  useTypeScale,
  type SizeVariant,
} from "@/lib/size-context";
import { spring, exitFallbackMs } from "@/lib/springs";
import { SURFACE_BG, SURFACE_SHADOW } from "@/lib/surface-classes";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { cn } from "@/lib/utils";

type PositionerProps = ComponentProps<typeof Popover.Positioner>;

/** Escalones que sube la tarjeta sobre el sustrato: los dos de cualquier popup
 *  del sistema. La bandeja baja esos mismos dos y cae en el sustrato, igual que
 *  la de un `InsetDialog` abierto sobre la página cae en el escalón 1. */
const CARD_RISE = 2;

/** La sombra de la bandeja, fija en la de un popup. No sigue a su escalón por
 *  el mismo motivo que la del `Dropdown`: una tarjeta pesa lo mismo abierta
 *  sobre la página que adentro de un diálogo, aunque su fondo siga al sustrato. */
const TRAY_SHADOW = 3;

/** El ancho, un escalón más angosto en regiones compactas — el ancho, no el
 *  relleno, como los anchos del diálogo. */
const WIDTH = { default: 360, compact: 320 } as const;

interface PeekCardTab {
  /** Texto de la pestaña. También es su clave, así que no se repite. */
  label: string;
  icon?: IconComponent;
  /** El cuerpo, adentro de la tarjeta embutida. Puede medir lo que quiera: el
   *  alto lo sigue. */
  content: ReactNode;
}

interface PeekCardProps {
  /** El disparador. Un único elemento — recibe los handlers y el estado de
   *  abierto. Un `Button`, un avatar, un nombre subrayado. */
  children: ReactElement;
  title: string;
  icon?: IconComponent;
  /** La acción del encabezado, arriba a la derecha. Un botón corto: lo que la
   *  tarjeta invita a hacer con lo que está mostrando. */
  action?: ReactNode;
  tabs: PeekCardTab[];
  /** El pie, sobre la bandeja y debajo de la tarjeta. Suele ser un botón ancho
   *  que lleva a la vista completa de lo que la tarjeta resume. */
  footer?: ReactNode;
  /** Qué abre la tarjeta. Con `"hover"` el clic la sigue abriendo: es lo único
   *  que queda en un dispositivo táctil, donde no hay puntero que pase por
   *  encima. @default "click" */
  openOn?: "click" | "hover";
  /** Espera antes de abrir por hover, en ms. Sólo con `openOn="hover"`.
   *  @default 300 */
  delay?: number;
  /** Gracia antes de cerrar al salir, en ms. Sólo con `openOn="hover"`: da
   *  tiempo a cruzar el hueco entre el trigger y la tarjeta. @default 120 */
  closeDelay?: number;
  /** De qué lado del trigger se abre. Base UI la da vuelta sola si no entra.
   *  @default "bottom" */
  side?: PositionerProps["side"];
  /** Cómo se alinea contra ese lado. Arranca en `"start"` —el borde de la
   *  tarjeta contra el borde del trigger— y no centrada: la tarjeta es mucho
   *  más ancha que casi cualquier trigger, y centrada se le va para los dos
   *  lados. @default "start" */
  align?: PositionerProps["align"];
  /** Distancia en px entre el trigger y la tarjeta. @default 8 */
  sideOffset?: number;
  /** Ancho de la bandeja en px. Omitido, lo pone la escalera: 360, y 320 en una
   *  región compacta. */
  width?: number;
  /** Pestaña abierta al montar, sin controlar. @default 0 */
  defaultTab?: number;
  /** Pestaña abierta, controlada desde afuera. */
  tab?: number;
  onTabChange?: (index: number) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Poné `false` cuando el trigger no sea un `<button>` nativo. Omitido, se
   *  deduce del elemento: cualquier etiqueta HTML que no sea `button` lo apaga
   *  sola, y un componente se asume botón. */
  nativeButton?: boolean;
  /** Fija la tarjeta a un escalón de la escalera de tamaños (default 36px,
   *  compacto 28px — ver /docs/sizes). Omitido, sigue al SizeProvider de
   *  alrededor. */
  size?: SizeVariant;
  /** Clases para la bandeja. */
  className?: string;
}

/** Desplazamiento del cuerpo al cambiar de pestaña, en px: entra por el lado
 *  del que viene y sale por el opuesto. Sin eso, volver a la pestaña anterior
 *  se ve igual que avanzar y el movimiento no dice nada. Son los mismos 12 del
 *  cruce de pasos de `MobileActionConfirmation`. */
const PANEL_TRAVEL = 12;

function PeekCard({
  children,
  title,
  icon: Icon,
  action,
  tabs,
  footer,
  openOn = "click",
  delay = 300,
  closeDelay = 120,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  width,
  defaultTab = 0,
  tab: tabProp,
  onTabChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  nativeButton,
  size,
  className,
}: PeekCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : internalOpen;
  const actionsRef = useRef<Popover.Root.Actions | null>(null);

  // El índice vive acá afuera y no adentro del popup: el popup se desmonta al
  // cerrar, así que la tarjeta reabre donde la dejaron y no siempre en la
  // primera pestaña.
  const [internalTab, setInternalTab] = useState(defaultTab);
  // Se recorta contra la lista una sola vez, acá: el riel, el cuerpo y los ids
  // del panel salen todos de este número. Sin recortar, un índice fuera de
  // rango —una lista que se achica con la tarjeta abierta, un `tab` de más—
  // deja al riel sin nada marcado mientras el cuerpo muestra la primera
  // pestaña, y los ids apuntando a una que ya no está.
  const selected = Math.min(
    Math.max(tabProp !== undefined ? tabProp : internalTab, 0),
    Math.max(tabs.length - 1, 0)
  );

  // La dirección del cruce se deriva del cambio de índice y no se escribe en el
  // handler del riel: manejada desde afuera, la pestaña cambia sin pasar por
  // él, y la dirección se quedaría con la del cambio anterior — volver se vería
  // igual que avanzar. Ajustar el estado durante el render deja la dirección
  // lista en el mismo commit que cambia el panel; en un efecto llegaría tarde,
  // cuando la salida ya arrancó.
  const [previous, setPrevious] = useState(selected);
  const [direction, setDirection] = useState(1);
  if (previous !== selected) {
    setPrevious(selected);
    setDirection(selected > previous ? 1 : -1);
  }

  const idPrefix = useId();
  const shape = useShape();
  const variant = useSizeVariant(size);
  const typeScale = useTypeScale(size);
  const { pad, rail } = useInsetMetrics(size);
  const reduceMotion = useReducedMotion() ?? false;

  // El sustrato de acá afuera: la tarjeta sube los dos de siempre y la bandeja
  // sale del mismo número, así las dos se mueven juntas si la tarjeta se abre
  // sobre un sustrato más alto.
  const substrate = useSurface();
  const card = Math.min(substrate + CARD_RISE, 8);
  const tray = Math.max(card - CARD_RISE, 1);

  const [measureRef, contentHeight] = useMeasuredHeight<HTMLDivElement>();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const handleTabChange = useCallback(
    (next: number) => {
      if (tabProp === undefined) setInternalTab(next);
      onTabChange?.(next);
    },
    [tabProp, onTabChange],
  );

  // Base UI difiere el desmontaje mientras `actionsRef` esté puesto; se libera
  // cuando la animación de salida terminó. `onAnimationComplete` es la señal
  // principal y este timer el respaldo para una pestaña en segundo plano, donde
  // los callbacks por rAF se frenan.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(
      () => actionsRef.current?.unmount(),
      exitFallbackMs(spring.moderate),
    );
    return () => clearTimeout(id);
  }, [open]);

  // Un solo escalón para todo —la apertura, el alto de la tarjeta y el cuerpo
  // que entra—: `moderate`, el de los popups y las pestañas, críticamente
  // amortiguado. Así la caja y lo que lleva adentro salen y llegan juntos, como
  // un solo movimiento; con el escalón rápido en el cuerpo, el texto quedaba
  // quieto a mitad de camino esperando que la caja lo alcanzara.
  const travel = reduceMotion ? { duration: 0 } : spring.moderate;

  // La opacidad es lo único que no sigue al resorte: va con las duraciones
  // cortas del sistema —y la del que se va, más corta todavía, como toda
  // salida— para que los dos cuerpos no se lean superpuestos durante el cruce.
  const panelVariants = useMemo(() => {
    const enter = reduceMotion
      ? { duration: 0 }
      : { ...spring.moderate, opacity: { duration: 0.08 } };
    const exit = reduceMotion
      ? { duration: 0 }
      : { ...spring.moderate.exit, opacity: { duration: 0.06 } };
    // Sin motion, el cuerpo aparece y desaparece en el lugar: el alto tampoco
    // viaja, así que un desplazamiento lateral quedaría sin nada que acompañar.
    const offset = reduceMotion ? 0 : PANEL_TRAVEL;
    return {
      enter: (direction: number) => ({ opacity: 0, x: direction * offset }),
      center: { opacity: 1, x: 0, transition: enter },
      exit: (direction: number) => ({
        opacity: 0,
        x: direction * -offset,
        transition: exit,
      }),
    };
  }, [reduceMotion]);

  const current = tabs[selected] ?? tabs[0];

  // Un elemento HTML que no sea `button` no puede recibir las props de botón
  // nativo; un componente sí puede terminar renderizando uno, así que se asume
  // que lo hace salvo que digan lo contrario.
  const isNativeButton =
    nativeButton ??
    (typeof children.type !== "string" || children.type === "button");

  const popup = (
    <Popover.Portal>
      <Popover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className="z-50 outline-none"
      >
        <motion.div
          // Una tarjeta que abre hacia arriba crece desde su borde de abajo
          // —el que está pegado al trigger—, así que el origen y el desvío
          // inicial se dan vuelta con `side`.
          initial={{ opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4 }}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4 }
          }
          transition={open ? travel : spring.moderate.exit}
          style={{
            transformOrigin: side === "top" ? "bottom center" : "top center",
          }}
          onAnimationComplete={() => {
            if (!open) actionsRef.current?.unmount();
          }}
        >
          <Popover.Popup
            // Con hover el foco entra sólo si la abrió el teclado: el puntero
            // no pidió nada. Con clic manda el comportamiento de Base UI, que
            // lleva el foco al primer tabulable de adentro.
            initialFocus={
              openOn === "hover" ? (opened) => opened === "keyboard" : undefined
            }
            finalFocus={
              openOn === "hover" ? (closed) => closed === "keyboard" : undefined
            }
            style={{
              width: width ?? WIDTH[variant],
              maxWidth: "calc(100vw - 16px)",
            }}
            className={cn(
              // Sin relleno propio: acá el aire es de cada zona, y la tarjeta
              // llega hasta el canto menos el suyo.
              "flex flex-col overflow-hidden p-0 outline-none",
              // El techo lo pone el lado donde abrió: `--available-height` es
              // lo que Base UI midió entre el ancla y el borde. Sin esto, un
              // cuerpo más alto que la pantalla se sale del viewport y no hay
              // cómo llegar — la bandeja es `fixed`, así que la página no
              // scrollea hasta ella, y el `overflow-hidden` recorta lo que
              // sobra. Con el techo puesto, el que cede es el cuerpo: la
              // cabecera y el pie no se mueven.
              "max-h-[var(--available-height)]",
              SURFACE_BG[tray],
              SURFACE_SHADOW[TRAY_SHADOW],
              shape.container,
              className,
            )}
          >
            {/* Lo que se publica hacia adentro es el nivel de la tarjeta y no
                el de la bandeja: el que se movió fue el marco, y un menú
                abierto acá adentro tiene que seguir subiendo desde donde subía
                en cualquier otro popup. */}
            <SurfaceProvider value={card}>
              {/* El `Tabs` envuelve todo el cuerpo y no sólo el riel: el riel
                  vive en el marco y lo que eligen las pestañas, adentro de la
                  tarjeta, así que el contexto tiene que abarcar a los dos. Se
                  maneja por índice —`selectedIndex` / `onSelect`— que es la
                  misma moneda que la prop `tab` de afuera. */}
              <Tabs
                selectedIndex={selected}
                onSelect={handleTabChange}
                className="flex min-h-0 flex-col"
              >
                {/* La cabecera: el nombre con su acción, y abajo las pestañas.
                    Van en la misma zona del marco porque dicen lo mismo — qué
                    es esto y qué parte se está mirando; lo que cambia al elegir
                    una está en la tarjeta. */}
                <div
                  className="flex shrink-0 flex-col"
                  style={{
                    paddingInline: pad + rail,
                    paddingTop: pad + rail,
                    paddingBottom: pad,
                    gap: rail,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* El mismo renglón que un `DialogTitle`: el rol `title`
                        del type scale y el peso de un título. `Popover.Title`
                        le da el `aria-labelledby` al popup, así que el lector
                        de pantalla lo anuncia por su nombre y no como un cuadro
                        sin etiqueta. */}
                    <Popover.Title
                      className="flex min-w-0 items-center gap-2 leading-tight text-foreground"
                      style={{
                        fontSize: typeScale.title,
                        fontVariationSettings: "'wght' 700",
                      }}
                    >
                      {Icon && (
                        <Icon
                          size={typeScale.title}
                          strokeWidth={1.75}
                          className="shrink-0 text-foreground"
                        />
                      )}
                      <span className="truncate">{title}</span>
                    </Popover.Title>
                    {action && <div className="shrink-0">{action}</div>}
                  </div>

                  {/* El riel se pinta contra el sustrato que lee, y está
                      apoyado en la bandeja: por eso acá adentro vuelve a
                      publicarse el escalón de la bandeja y no el de la tarjeta.
                      Con el de la tarjeta el segmento activo cae tres escalones
                      más arriba, y en oscuro aterriza en el mismo valor que el
                      riel — la pestaña elegida desaparece. Es la única parte del
                      marco que necesita el número de abajo: lo demás publica el
                      de la tarjeta, que es el que tiene que ver un popup abierto
                      acá adentro.

                      Las pestañas se reparten el ancho: la bandeja lo tiene
                      fijo, y un riel más corto que su renglón se lee como algo
                      que quedó a medio terminar. El `flex-1` va sin `min-w-0`
                      a propósito: reparte el sobrante cuando las etiquetas
                      entran, pero ninguna pestaña baja de lo que mide su texto
                      —que no se corta ni se parte—, así que con etiquetas
                      largas el riel se pasa de ancho y scrollea en vez de
                      pisarse una a la otra. */}
                  <SurfaceProvider value={tray}>
                    <TabsList
                      aria-label={title}
                      className="w-full overflow-x-auto scrollbar-hide"
                    >
                      {tabs.map((item, index) => (
                        <TabItem
                          key={item.label}
                          value={item.label}
                          label={item.label}
                          icon={item.icon}
                          // Los ids los ponemos nosotros porque el panel también
                          // es nuestro (ver abajo): sin un `Tabs.Panel` de Base
                          // UI registrado, la pestaña no tiene a qué apuntar.
                          id={`${idPrefix}-tab-${index}`}
                          // Sólo la elegida: es la única cuyo panel está en el
                          // DOM. Apuntar a los otros dos sería mandar al lector
                          // de pantalla a ids que no existen, que es peor que no
                          // decir nada.
                          aria-controls={
                            index === selected
                              ? `${idPrefix}-panel-${index}`
                              : undefined
                          }
                          className="flex-1 justify-center"
                        />
                      ))}
                    </TabsList>
                  </SurfaceProvider>
                </div>

                {/* La tarjeta embutida. Sin `initial={false}` la primera apertura
                  animaría el alto desde cero, que se ve como una tarjeta que se
                  despliega en vez de una que aparece entera. */}
                <motion.div
                  className={cn(
                    // `min-h-0` + el scroll propio son lo que hace que el techo
                    // de la bandeja lo pague el cuerpo: el alto animado es la
                    // medida que pide, y flexbox se la recorta cuando no entra.
                    // El eje x sigue recortado —el panel que sale se va de
                    // costado— y sólo el y scrollea.
                    "relative min-h-0 overflow-x-hidden overflow-y-auto",
                    SURFACE_BG[card],
                    SURFACE_SHADOW[CARD_SHADOW],
                    shape.item,
                  )}
                  style={{
                    marginInline: pad,
                    // Sin pie, el aire de abajo lo pone la tarjeta: si no, llega
                    // pegada al canto de la bandeja y el embutido se rompe justo
                    // donde más se nota.
                    marginBottom: footer ? 0 : pad,
                  }}
                  initial={false}
                  animate={{ height: contentHeight ?? "auto" }}
                  transition={travel}
                >
                  <AnimatePresence
                    initial={false}
                    mode="popLayout"
                    custom={direction}
                  >
                    <motion.div
                      key={selected}
                      custom={direction}
                      variants={panelVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      {/* El panel se arma a mano en vez de con `TabPanel`: ese
                        esconde al que no está elegido, y acá los dos tienen que
                        seguir montados y visibles mientras dura el cruce. Los
                        ids son los que les pusimos a las pestañas arriba, así
                        que el `aria-controls` de cada una sigue apuntando a su
                        panel.

                        El relleno es propio y no el de `InsetDialogGroup`: ese
                        está hecho para una tarjeta con varios bloques, y su
                        inset, sumado al de la bandeja, le come el renglón a una
                        columna de 360 — el mismo motivo por el que la hoja del
                        teléfono usa el suyo. */}
                      <div
                        ref={measureRef}
                        id={`${idPrefix}-panel-${selected}`}
                        role="tabpanel"
                        aria-labelledby={`${idPrefix}-tab-${selected}`}
                        tabIndex={-1}
                        className="outline-none"
                        style={{ padding: pad }}
                      >
                        {current?.content}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* El pie, sobre la bandeja: el mismo plano que la cabecera, así
                  el marco se lee de una sola pieza. */}
                {footer && (
                  <div
                    className="flex shrink-0 items-center gap-2"
                    style={{
                      paddingInline: pad + rail,
                      paddingTop: pad,
                      paddingBottom: pad + rail,
                    }}
                  >
                    {footer}
                  </div>
                )}
              </Tabs>
            </SurfaceProvider>
          </Popover.Popup>
        </motion.div>
      </Popover.Positioner>
    </Popover.Portal>
  );

  const root = (
    <Popover.Root
      open={open}
      onOpenChange={handleOpenChange}
      actionsRef={actionsRef}
      // Ver la decisión 5 del encabezado: la página sigue viva detrás.
      modal={false}
    >
      <Popover.Trigger
        render={children}
        nativeButton={isNativeButton}
        openOnHover={openOn === "hover"}
        delay={delay}
        closeDelay={closeDelay}
      />
      {popup}
    </Popover.Root>
  );

  // El `size` fija todo el compuesto —lo del trigger y lo del popup portaleado,
  // porque el contexto de React cruza portales— a un escalón de la escalera.
  return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
}

PeekCard.displayName = "PeekCard";

export { PeekCard };
export type { PeekCardProps, PeekCardTab };
