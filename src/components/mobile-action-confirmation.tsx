"use client";

/**
 * MobileActionConfirmation — la confirmación de una acción en pantalla de
 * teléfono.
 *
 * Una hoja anclada al piso: qué acción es —glifo y nombre—, qué implica, y las
 * dos salidas. Cuando la acción no es una sino una secuencia —ocho permisos,
 * ocho pantallas de alta— la misma hoja lleva el contador arriba, el riel de
 * puntos abajo y "Continuar" avanza en vez de confirmar.
 *
 * Es un `InsetDialog` con `placement="bottom"`: el paso —glifo, nombre y qué
 * implica— va en la tarjeta, y el contador, la salida de arriba, el riel y las
 * dos acciones quedan en la bandeja. Eso es lo que hace que al cambiar de paso
 * se mueva una sola cosa: el marco es todo lo que no cambia.
 *
 * Seis decisiones que conviene no deshacer sin mirar el resto:
 *
 * 1. **Va al piso, no al centro.** En un teléfono el pulgar llega abajo y no
 *    arriba; una hoja centrada deja las dos acciones en la mitad de la
 *    pantalla, donde hay que reacomodar la mano para tocarlas. `placement`
 *    tiene `center` para cuando el componente se muestra en un marco chico
 *    —el showcase— y el piso del marco no es el piso de la pantalla.
 *
 * 2. **La escalera sube al pulgar con un solo número.** 36px pasa el mouse
 *    pero no el dedo: las dos plataformas piden 44px de lado. En vez de
 *    escribir 44 y 52 a mano, todo sale de `TOUCH_BUMP` sumado a la escalera,
 *    así el escalón compacto y el default quedan los dos arriba del piso y la
 *    diferencia entre densidades se sigue leyendo. Y por eso mismo el escalón
 *    en un táctil es siempre el compacto: lo único que baja es el aire — la
 *    acción sigue midiendo 44px, que es el piso, no el techo.
 *
 * 3. **El alto se anima, el contenido se cruza.** Dos pasos con descripciones
 *    de distinto largo cambian el alto de la tarjeta; como la hoja está
 *    anclada al piso, ese cambio la haría saltar. El alto viaja con
 *    `spring.moderate` a la medida del paso que entra, y los dos pasos
 *    conviven durante el cruce —`popLayout` saca de flujo al que se va— así el
 *    que entra ya mide bien antes de que el otro termine de irse.
 *
 * 4. **El punto activo viaja, no prende y apaga.** Es una sola capa que se
 *    desplaza por el riel, como el selector de `WorkspacePanel`. Acá sí puede
 *    ser un `transform`: el punto no cambia de tamaño entre posiciones, así
 *    que no hay redondeo que deformar. Y el riel se retira pasados los
 *    `DOT_CAP` puntos — veinte puntos no se cuentan de un vistazo, para eso
 *    está el contador.
 *
 * 5. **El título y la descripción se etiquetan a mano.** Durante el cruce hay
 *    dos pasos montados; con `Dialog.Title` los dos publicarían su id sobre el
 *    mismo popup y el `aria-labelledby` quedaría apuntando al que se está
 *    yendo. Cada paso lleva su id propio y el popup apunta al que entra.
 *
 * 6. **El clic afuera no cierra.** Una confirmación se contesta: el clic al
 *    costado no es ninguna de las dos respuestas. Es lo que separa un
 *    `alertdialog` de un diálogo común, y `InsetDialog` lo trae como perilla
 *    —`disablePointerDismissal`— junto con el `role`, que va en el content.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  InsetDialog,
  InsetDialogBody,
  InsetDialogContent,
  InsetDialogFooter,
  InsetDialogHeader,
} from "@/components/inset-dialog";
import { useTouchPrimary } from "@/hooks/use-touch-primary";
import { fontWeights } from "@/lib/font-weight";
import type { IconComponent } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import {
  SizeProvider,
  useSize,
  useSizeVariant,
  useTypeScale,
  type SizeVariant,
} from "@/lib/size-context";
import { exitFallbackMs, spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Medidas
// ---------------------------------------------------------------------------

/** El salto de la escalera al pulgar. La fila de acciones sube dos veces este
 *  número sobre el alto de control y el tile del glifo uno, así el escalón
 *  compacto (28) da 44 y 36, y el default (36) da 52 y 44 — los dos arriba del
 *  piso táctil de 44px, sin repetir literales por el archivo. */
const TOUCH_BUMP = 8;

/** El punto del riel y el aire entre puntos. Iguales a propósito: el riel se
 *  lee como una secuencia y no como pares. */
const DOT = 6;
const DOT_GAP = 6;

/** Pasados estos pasos el riel se retira y queda sólo el contador: veinte
 *  puntos no se cuentan de un vistazo. */
const DOT_CAP = 7;

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

interface ConfirmationStep {
  /** Estable entre renders: es la clave del cruce y la raíz de los ids que
   *  etiquetan el diálogo. */
  id: string;
  icon: IconComponent;
  title: string;
  description: ReactNode;
  /** Etiqueta de la acción que sigue, sólo para este paso. Sin esto, la del
   *  componente. */
  confirmLabel?: string;
}

interface MobileActionConfirmationProps {
  open: boolean;
  /** Cerrar. Llega también por Escape; el clic afuera no cierra —hay que
   *  elegir una de las dos salidas. */
  onOpenChange: (open: boolean) => void;
  /** Uno para una confirmación común, varios para una secuencia. */
  steps: ConfirmationStep[];
  /** Paso activo, para manejarlo desde afuera. Sin esto lo lleva el
   *  componente y vuelve al primero cuando la hoja termina de salir. */
  step?: number;
  onStepChange?: (step: number) => void;
  /** Confirmar. En una secuencia, sólo en el último paso. */
  onConfirm: () => void;
  /** Volver atrás en el primer paso. Sin esto, cierra. */
  onCancel?: () => void;
  /** La salida de arriba a la derecha. Sin esto no se dibuja: una secuencia de
   *  la que no se puede salir no debería ofrecerlo. */
  onSkip?: () => void;
  confirmLabel?: string;
  /** Etiqueta del confirmar en el último paso de una secuencia. Sin esto, la
   *  misma que en los demás. */
  finalConfirmLabel?: string;
  /** La salida del primer paso — cerrar sin hacer nada. */
  cancelLabel?: string;
  /** La vuelta al paso anterior. Es otra etiqueta que `cancelLabel` porque es
   *  otra cosa: una deshace un paso, la otra abandona. */
  backLabel?: string;
  skipLabel?: string;
  /** El confirmar queda cargando y las dos salidas se bloquean. */
  pending?: boolean;
  /** Cómo se pinta el tile del glifo. */
  tone?: "neutral" | "destructive";
  /** El único lugar por donde entra un color de marca: el tile. El resto de la
   *  hoja sale de los tokens del tema. */
  tileClassName?: string;
  placement?: "bottom" | "center";
  /** Adónde vuelve el foco al cerrar. */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Atrapa el foco y bloquea el scroll de atrás. Por default sí, salvo que
   *  la hoja esté portaleada a un marco (`container`): ahí es una muestra
   *  adentro de una página que se sigue usando, y el atrape se llevaría el
   *  foco de todo lo que hay alrededor. */
  modal?: boolean;
  /** Marco al que se portalea. Con esto la hoja se posiciona `absolute` adentro
   *  del elemento en vez de sobre la ventana — sirve para mostrarla dentro de
   *  una pantalla de teléfono dibujada. El marco tiene que ser `relative` y
   *  `overflow: hidden`. */
  container?: HTMLElement | null;
  /** Fija la densidad de la hoja para puntero fino. Sin esto sigue al
   *  `SizeProvider` de arriba. En un dispositivo táctil no se lee: ahí la
   *  densidad es siempre compacta. */
  size?: SizeVariant;
}

// ---------------------------------------------------------------------------
// El cruce entre pasos
// ---------------------------------------------------------------------------

/* La dirección la pone quien dispara el cambio: adelante entra por la derecha,
   atrás por la izquierda. Sin eso los dos lados del recorrido se ven iguales y
   volver no se distingue de avanzar. */
const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 12 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -12 }),
};

/** Mide el alto del paso montado. Devuelve un ref estable y el alto en px.
 *
 *  El ref es el mismo callback en todos los renders —uno nuevo por render hace
 *  que React desmonte y vuelva a montar el ref, y cada vuelta invalida la
 *  medición—, y no suelta el observer cuando lo llaman con `null`: durante el
 *  cruce los dos pasos están montados, así que el nodo que se va lo llamaría
 *  con `null` después de que el que entra ya se anotó, y soltaría la medición
 *  del que se está quedando. */
function useMeasuredHeight() {
  const [height, setHeight] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    observer.current?.disconnect();
    const next = new ResizeObserver(() => setHeight(node.offsetHeight));
    next.observe(node);
    observer.current = next;
    setHeight(node.offsetHeight);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, height] as const;
}

// ---------------------------------------------------------------------------

export function MobileActionConfirmation({
  open,
  onOpenChange,
  steps,
  step,
  onStepChange,
  onConfirm,
  onCancel,
  onSkip,
  confirmLabel,
  finalConfirmLabel,
  cancelLabel = "Cancelar",
  backLabel = "Atrás",
  skipLabel = "Saltar",
  pending = false,
  tone = "neutral",
  tileClassName,
  placement = "bottom",
  triggerRef,
  container,
  modal,
  size,
}: MobileActionConfirmationProps) {
  // En un teléfono la densidad no se negocia: compacta, gane lo que gane
  // afuera. Un escalón default en una columna de 360px deja la descripción en
  // el doble de renglones y empuja las acciones abajo del pliegue del pulgar,
  // y el salto al pulgar hace que compacto siga dando 44px de acción — o sea
  // que lo que se achica es el aire, nunca el objetivo táctil.
  const touch = useTouchPrimary();
  const requested = useSizeVariant(size);
  const variant = touch ? "compact" : requested;
  const classes = useSize(variant);
  const type = useTypeScale(variant);
  const shape = useShape();
  const baseId = useId();

  const [internalStep, setInternalStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [bodyRef, bodyHeight] = useMeasuredHeight();

  const confirmRef = useRef<HTMLButtonElement>(null);

  const total = steps.length;
  const index = Math.min(step ?? internalStep, Math.max(total - 1, 0));
  const first = index === 0;
  const last = index === total - 1;

  // El paso vuelve al primero recién cuando la hoja terminó de salir; hacerlo
  // al cerrar mostraría el paso 1 durante la salida, que no es donde estaba el
  // que la cerró. El portal se desmonta solo —eso lo maneja `InsetDialog`—,
  // así que este timer no libera nada: sólo elige el momento de rebobinar.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      setInternalStep(0);
      setDirection(1);
    }, exitFallbackMs(spring.moderate));
    return () => clearTimeout(id);
  }, [open]);

  const goTo = (next: number, towards: number) => {
    setDirection(towards);
    if (step === undefined) setInternalStep(next);
    onStepChange?.(next);
  };

  const advance = () => {
    if (last) {
      onConfirm();
      return;
    }
    goTo(index + 1, 1);
  };

  const retreat = () => {
    if (first) {
      if (onCancel) onCancel();
      else onOpenChange(false);
      return;
    }
    goTo(index - 1, -1);
  };

  if (total === 0) return null;

  const current = steps[index];
  const Glyph = current.icon;

  // Las tres medidas de la hoja salen de la escalera más el salto al pulgar.
  const action = classes.controlHeight + TOUCH_BUMP * 2; // 52 / 44
  const tile = classes.controlHeight + TOUCH_BUMP; //        44 / 36
  const glyph = classes.icon + TOUCH_BUMP / 2; //            20 / 18
  const compact = variant === "compact";
  const stack = compact ? 12 : 16;

  const confirmText = last
    ? current.confirmLabel ?? finalConfirmLabel ?? confirmLabel ?? "Confirmar"
    : current.confirmLabel ?? confirmLabel ?? "Continuar";

  const titleId = `${baseId}-${current.id}-title`;
  const descriptionId = `${baseId}-${current.id}-description`;
  const showCounter = total > 1;
  const showRail = total > 1 && total <= DOT_CAP;

  return (
    <InsetDialog
      open={open}
      onOpenChange={onOpenChange}
      modal={modal ?? !container}
      disablePointerDismissal
    >
      <InsetDialogContent
        placement={placement}
        container={container}
        // La hoja pregunta y espera una respuesta: `alertdialog` es lo que le
        // dice al lector de pantalla que interrumpa y lea el título y la
        // descripción de una, sin esperar a que el foco recorra.
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        // El foco entra al confirmar y no al primer tabulable: la hoja
        // pregunta una cosa y esa es la respuesta esperada.
        initialFocus={confirmRef}
        finalFocus={triggerRef}
        // Las dos salidas están en el pie; una X arriba sería una tercera.
        showClose={false}
      >
        <SizeProvider size={variant}>
          {(showCounter || onSkip) && (
            <InsetDialogHeader withClose={false} style={{ height: tile }}>
              <span
                className="text-muted-foreground"
                style={{ fontSize: type.caption }}
              >
                {showCounter ? `${index + 1} de ${total}` : ""}
              </span>
              {onSkip && (
                <Button
                  variant="ghost"
                  className="ml-auto"
                  onClick={onSkip}
                  disabled={pending}
                  style={{
                    height: tile,
                    // El botón se corre su propio padding hacia afuera: así lo
                    // que se alinea con el carril de la bandeja es la palabra
                    // y no la caja invisible que la rodea.
                    marginRight: compact ? -12 : -16,
                  }}
                >
                  {skipLabel}
                </Button>
              )}
            </InsetDialogHeader>
          )}

          {/* El paso va en la tarjeta y no scrollea: lo que cambia de alto es
              él mismo, y ese cambio se anima. */}
          <InsetDialogBody scrollable={false}>
            {/* El relleno de la tarjeta es el mismo aire que separa el tile
                del título, y no el de `InsetDialogGroup`: el grupo está hecho
                para una tarjeta con varios bloques y su inset, sumado al de la
                bandeja, le come cuarenta pixeles de renglón a una columna de
                teléfono. Acá adentro hay un bloque solo. */}
            <div style={{ padding: stack }}>
              {/* Sin `initial` la primera apertura animaría el alto desde
                  cero, que se ve como una hoja que se despliega. */}
              <motion.div
                className="relative overflow-hidden"
                initial={false}
                animate={{ height: bodyHeight ?? "auto" }}
                transition={spring.moderate}
                // El paso que entra trae título nuevo: sin esto el lector de
                // pantalla se queda en el que anunció al abrir.
                aria-live="polite"
              >
                <AnimatePresence
                  initial={false}
                  mode="popLayout"
                  custom={direction}
                >
                  <motion.div
                    key={current.id}
                    ref={bodyRef}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={spring.moderate}
                    className="flex flex-col"
                    style={{ gap: stack * 0.75 }}
                  >
                    <div
                      className="flex items-center"
                      style={{ gap: compact ? 10 : 12 }}
                    >
                      <span
                        className={cn(
                          "flex shrink-0 items-center justify-center",
                          shape.item,
                          tone === "destructive"
                            ? "bg-destructive-light text-destructive"
                            : "bg-accent text-foreground",
                          tileClassName
                        )}
                        style={{ width: tile, height: tile }}
                      >
                        <Glyph size={glyph} strokeWidth={1.75} />
                      </span>
                      <h2
                        id={titleId}
                        className="min-w-0 text-foreground leading-tight"
                        style={{
                          fontSize: type.title,
                          fontVariationSettings: fontWeights.bold,
                        }}
                      >
                        {current.title}
                      </h2>
                    </div>
                    <p
                      id={descriptionId}
                      className="text-muted-foreground"
                      style={{ fontSize: type.body, lineHeight: 1.45 }}
                    >
                      {current.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </InsetDialogBody>

          {/* El riel y las acciones son las dos filas del pie: las dos son del
              marco, no del paso, y por eso comparten el plano de la bandeja. */}
          <InsetDialogFooter className="flex-col items-stretch gap-3">
            {showRail && (
              <div
                aria-hidden
                className="relative mx-auto"
                style={{
                  height: DOT,
                  width: total * DOT + (total - 1) * DOT_GAP,
                }}
              >
                <div
                  className="flex h-full items-center"
                  style={{ gap: DOT_GAP }}
                >
                  {steps.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-border"
                      style={{ width: DOT, height: DOT }}
                    />
                  ))}
                </div>
                {/* Una sola capa que viaja, como el selector del
                    WorkspacePanel. Acá el viaje puede ser un `transform`: el
                    punto no cambia de tamaño entre posiciones, así que no hay
                    redondeo que deformar. */}
                <motion.span
                  className="absolute left-0 top-0 rounded-full bg-foreground"
                  style={{ width: DOT, height: DOT }}
                  initial={false}
                  animate={{ x: index * (DOT + DOT_GAP) }}
                  transition={spring.moderate}
                />
              </div>
            )}

            {/* Las dos salidas, con la que sigue pesando más: la proporción
                dice cuál es la esperada antes de que se lean las etiquetas. */}
            <div className={cn("flex", classes.gap)}>
              <Button
                variant="tertiary"
                className="flex-1"
                style={{ height: action }}
                onClick={retreat}
                disabled={pending}
              >
                {first ? cancelLabel : backLabel}
              </Button>
              <Button
                ref={confirmRef}
                className="flex-[1.6]"
                style={{ height: action }}
                onClick={advance}
                loading={pending}
              >
                {confirmText}
              </Button>
            </div>
          </InsetDialogFooter>
        </SizeProvider>
      </InsetDialogContent>
    </InsetDialog>
  );
}

export type { ConfirmationStep, MobileActionConfirmationProps };
