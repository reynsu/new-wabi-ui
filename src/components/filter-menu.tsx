"use client";

/**
 * FilterMenu — el menú de filtros de una vista de datos.
 *
 * Un botón abre la lista de atributos por los que se puede filtrar; al elegir
 * uno, el mismo panel se corre a los valores de ese atributo. Dos niveles
 * adentro de un panel y no un submenú lateral: el submenú obliga a cruzarlo en
 * diagonal sin salirse, y con ocho atributos ya no entra al lado del primero.
 * Acá el panel se queda quieto en su ancla y lo que viaja es el contenido.
 *
 * Cuatro decisiones que conviene no deshacer sin mirar el resto:
 *
 * 1. **El buscador no se desmonta al cambiar de nivel.** Es el mismo `<input>`
 *    en los dos: cambian el placeholder y el texto, pero el nodo es el mismo,
 *    así que el foco no se pierde ni al entrar ni al volver. Se puede filtrar,
 *    entrar y seguir tecleando sin tocar el mouse ni volver a hacer foco.
 *
 * 2. **El foco se queda en el buscador; lo que se mueve es un resaltado.** Las
 *    filas no son focusables: el campo es un `combobox` y señala la fila activa
 *    con `aria-activedescendant`. Si el foco viajara fila por fila, cada flecha
 *    lo sacaría del campo donde se está escribiendo.
 *
 * 3. **Elegir un valor no cierra el panel.** Un filtro casi nunca es uno solo:
 *    se marcan dos estados y tres empresas de una sentada. El panel se cierra
 *    con Escape, con un clic afuera o con la X. La excepción es un atributo
 *    `single`, donde después de elegir no queda nada más que hacer ahí y por
 *    eso vuelve solo al primer nivel.
 *
 * 4. **La columna de la derecha dice qué pasa si activás la fila.** En el
 *    primer nivel un chevron, que promete otro nivel; en el segundo un tilde,
 *    que promete un valor puesto. Es la misma columna en los dos, así que la
 *    promesa se lee sin cambiar de renglón.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Popover } from "@base-ui/react/popover";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { Elevated } from "@/lib/elevated";
import type { IconComponent } from "@/lib/icon-context";
import { shapeMap } from "@/lib/shape-context";
import {
  SizeProvider,
  useSize,
  useTypeScale,
  type SizeVariant,
} from "@/lib/size-context";
import { exitFallbackMs, spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

interface FilterOption {
  value: string;
  label: string;
  /** Ícono del valor. Los estados y las etiquetas suelen tener uno propio. */
  icon?: IconComponent;
  /** Texto secundario a la derecha del nombre: cuántos registros tiene ese
   *  valor, de dónde sale, lo que ayude a elegir sin salir del panel. */
  hint?: string;
}

interface FilterAttribute {
  id: string;
  label: string;
  icon: IconComponent;
  /**
   * Cómo se elige el valor.
   *   "select" — de una lista cerrada de `options` (default)
   *   "text"   — texto libre: lo que se escriba en el buscador se agrega como
   *              término con Enter. Nombres y descripciones no tienen lista.
   */
  type?: "select" | "text";
  /** Los valores del atributo, para `type: "select"`. */
  options?: FilterOption[];
  /** Un solo valor a la vez. Elegir uno reemplaza al anterior y vuelve al
   *  primer nivel. */
  single?: boolean;
  /** Placeholder del buscador dentro de este atributo. Sin esto se arma uno
   *  con la etiqueta. */
  searchPlaceholder?: string;
}

interface FilterGroup {
  label: string;
  attributes: FilterAttribute[];
}

/**
 * Lo que está filtrado: id del atributo → valores elegidos.
 *
 * Un atributo sin valores **no está en el mapa**, nunca como arreglo vacío.
 * Así `Object.keys(selection).length` es la cantidad de atributos filtrados y
 * nadie tiene que acordarse de descartar los vacíos al contar o al pintar los
 * chips de afuera.
 */
type FilterSelection = Record<string, string[]>;

interface FilterMenuProps {
  groups: FilterGroup[];
  /** Etiqueta del botón y nombre accesible del panel. */
  label?: string;
  value?: FilterSelection;
  defaultValue?: FilterSelection;
  onValueChange?: (value: FilterSelection) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fija el panel y el botón a un escalón de la escala de tamaños. Sin esto
   *  siguen al SizeProvider de alrededor. */
  size?: SizeVariant;
  /** De qué lado del botón se alinea el panel. */
  align?: "start" | "end";
  /** Va al botón, que es lo único que este componente deja en el layout. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Forma y medidas
// ---------------------------------------------------------------------------

/* Como el `dropdown` del registry, el panel se baja del sistema de formas y
   se queda siempre en los radios `rounded`. A esta escala el burbujeo de la
   forma píldora deforma el padding que se percibe y desbalancea la sombra de
   las esquinas; un popover se lee mejor con el radio chico aunque el resto de
   la app esté redondeada. */
const shape = shapeMap.rounded;

/** Ancho del panel. Fijo y no atado al botón ni a la densidad: el botón dice
 *  una palabra y la lista tiene que dar lugar a etiquetas como "Direcciones de
 *  correo". */
const PANEL_WIDTH = 288;

/** El aire del panel: entre el canto y el buscador, las filas y el pie. */
const PANEL_PAD = 6;

/** Cuántas filas se ven antes de que la lista scrollee. El alto sale de
 *  multiplicar por el escalón de la escalera, así en compacto se ven las
 *  mismas siete filas y no siete y media. */
const VISIBLE_ROWS = 7;

/** Cuánto se corre una vista al entrar y al salir. Corto a propósito: es un
 *  cambio de nivel adentro del mismo panel, no un cambio de pantalla. */
const VIEW_TRAVEL = 18;

const viewVariants = {
  enter: (direction: number) => ({ x: direction * VIEW_TRAVEL, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  // La vista que se va sale del flujo apenas empieza a irse, así el alto del
  // marco pasa a ser el de la que entra y las dos quedan una encima de la otra
  // en vez de apiladas.
  //
  // Y se va con la salida del escalón rápido, no con la del moderado: mientras
  // dura el cruce hay dos copias del nombre del atributo —la de la fila que se
  // va y la que viaja a la cabecera— una encima de la otra. Cuanto antes se
  // apague la de abajo, más limpio se lee el viaje.
  exit: (direction: number) => ({
    x: direction * -VIEW_TRAVEL,
    opacity: 0,
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    transition: spring.fast.exit,
  }),
} satisfies Variants;

/**
 * El nombre del atributo no aparece en la cabecera: llega volando desde su
 * fila.
 *
 * La fila y la cabecera comparten un `layoutId` por pieza —el glifo y la
 * etiqueta—, así que cuando la lista se va y la cabecera se arma, framer
 * reconoce que son la misma cosa en dos lugares y la lleva de una posición a
 * la otra en vez de apagarla acá y prenderla allá. Es lo que ata el nivel
 * nuevo a la fila que lo abrió: se ve *de dónde* salió.
 *
 * Va con `layout="position"`: la caja de la etiqueta cambia de ancho entre los
 * dos lugares, y una animación de layout completa corrige ese cambio
 * escalando, que en un texto se ve como una goma. Animando sólo la posición,
 * el texto viaja sin deformarse.
 *
 * **Sólo de ida.** Al volver, lo que se recupera es la lista entera y no una
 * fila: un nombre bajando solo hacia su renglón, distinto de la lista a la que
 * pertenece, se lee como un salto y no como un vínculo. Además la lista
 * scrollea y recorta, así que la mitad de ese viaje pasaría abajo del
 * buscador, invisible. Por eso el id lleva el número de viaje, que sube en
 * cada vuelta: las filas que vuelven ya no comparten id con la cabecera que se
 * está yendo y framer no las empareja.
 *
 * El `scope` es el `useId` del menú: dos FilterMenu en la misma página no
 * pueden compartir ids o el nombre de uno saldría volando hacia el otro.
 */
const travelId = (
  scope: string,
  trip: number,
  part: "icon" | "label",
  attributeId: string,
) => `${scope}-${trip}-${part}-${attributeId}`;

/** El título de la cabecera sólo se cruza en opacidad. El que se va sale del
 *  flujo —`inset` y no `top`, para que siga centrado mientras se apaga— y se
 *  apaga rápido, por lo mismo que la lista: abajo suyo hay una copia del
 *  nombre viajando. */
const titleVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: {
    opacity: 0,
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    transition: spring.fast.exit,
  },
} satisfies Variants;

// ---------------------------------------------------------------------------
// Búsqueda
// ---------------------------------------------------------------------------

/** Sin mayúsculas y sin tildes: "descripcion" tiene que encontrar
 *  "Descripción". Quien filtra escribe rápido y no acentúa. */
const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const matches = (text: string, query: string) =>
  normalize(text).includes(normalize(query.trim()));

// ---------------------------------------------------------------------------
// Selección
// ---------------------------------------------------------------------------

const valuesOf = (selection: FilterSelection, id: string) => selection[id] ?? [];

/** Prende o apaga un valor y deja el mapa sin arreglos vacíos (ver
 *  `FilterSelection`). Un atributo `single` reemplaza en vez de sumar. */
function toggleValue(
  selection: FilterSelection,
  attribute: FilterAttribute,
  value: string,
): FilterSelection {
  const current = valuesOf(selection, attribute.id);
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : attribute.single
      ? [value]
      : [...current, value];

  const result = { ...selection };
  if (next.length) result[attribute.id] = next;
  else delete result[attribute.id];
  return result;
}

function clearAttribute(
  selection: FilterSelection,
  id: string,
): FilterSelection {
  const result = { ...selection };
  delete result[id];
  return result;
}

/** Cuántos valores hay puestos en total — es lo que cuenta el botón y el pie
 *  del panel, porque "3 filtros" son tres valores y no tres atributos. */
const totalValues = (selection: FilterSelection) =>
  Object.values(selection).reduce((sum, values) => sum + values.length, 0);

// ---------------------------------------------------------------------------
// Filas
// ---------------------------------------------------------------------------

/** El contador de una fila y del botón.
 *
 *  Va con `bg-active`, un escalón más fuerte que el `bg-hover` con el que se
 *  prende la fila: si usara el mismo, el número se disolvería justo cuando el
 *  cursor está encima, que es cuando se lo mira.
 *
 *  `inline-flex` y no `flex`: adentro del botón este contador viaja como hijo,
 *  y el Button mete a sus hijos en el span de la etiqueta. Ahí una caja de
 *  bloque se va sola al renglón de abajo y parte el botón en dos líneas. */
function Count({ children }: { children: ReactNode }) {
  // Se mide contra el glifo de la escalera y no contra un alto propio: el
  // contador es un hermano del ícono de la fila, y cuando la región baja a
  // compacto tiene que bajar con él.
  const { icon } = useSize();
  const scale = useTypeScale();
  const box = icon + 4;

  return (
    <span
      style={{ height: box, minWidth: box, fontSize: scale.caption }}
      className={cn(
        "inline-flex items-center justify-center bg-active px-1 align-middle font-medium tabular-nums text-foreground",
        shape.item,
      )}
    >
      {children}
    </span>
  );
}

interface PanelRowProps {
  id: string;
  active: boolean;
  /** La fila se anota en el medidor del resaltado, que necesita su caja para
   *  saber hasta dónde viajar. Se pasan el índice y la función —y no un ref ya
   *  armado— porque un callback nuevo en cada render haría que React desmonte
   *  y vuelva a montar el ref, y cada vuelta invalida la medición: el
   *  resaltado quedaría parpadeando a razón de un cuadro. Es como se anotan
   *  los items del `dropdown` del registry. */
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  icon?: IconComponent;
  label: string;
  /** Ids del elemento compartido con la cabecera (ver `travelId`). Sólo los
   *  llevan las filas del primer nivel: son las únicas que abren un nivel al
   *  que viajar. */
  travelIconId?: string;
  travelLabelId?: string;
  hint?: string;
  trailing?: ReactNode;
  /** Sólo para las filas que son un valor: si está puesto o no. Las del primer
   *  nivel no seleccionan nada, navegan, y por eso lo dejan en `undefined`. */
  selected?: boolean;
  onActivate: () => void;
}

function PanelRow({
  id,
  active,
  index,
  registerItem,
  icon: Icon,
  label,
  travelIconId,
  travelLabelId,
  hint,
  trailing,
  selected,
  onActivate,
}: PanelRowProps) {
  // La fila resuelve su propia densidad desde el contexto en vez de recibirla
  // por props: el `SizeProvider` que arma el menú cruza el portal, así que la
  // fila lee lo mismo que el botón que la abrió — que es exactamente por qué
  // `control` es un solo token para controles y filas de menú.
  const classes = useSize();
  const scale = useTypeScale();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerItem(index, rowRef.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  return (
    <div
      id={id}
      ref={rowRef}
      role="option"
      aria-selected={selected}
      data-active={active || undefined}
      // El clic no tiene que sacar el foco del buscador, que es donde vive
      // toda la navegación por teclado.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onActivate}
      // `relative`: el resaltado es una capa absoluta que va antes en el DOM,
      // y sin posicionar la fila el fondo le pasaría por encima al texto.
      // La fila no pinta ese fondo — lo pinta la capa que viaja.
      className={cn(
        "relative flex cursor-default select-none items-center",
        shape.item,
        classes.control,
        classes.itemPx,
        classes.gap,
      )}
    >
      {Icon && (
        <motion.span
          layoutId={travelIconId}
          layout={travelIconId ? "position" : undefined}
          transition={spring.moderate}
          className="shrink-0 text-muted-foreground"
        >
          <Icon size={classes.icon} strokeWidth={1.75} />
        </motion.span>
      )}
      <motion.span
        layoutId={travelLabelId}
        layout={travelLabelId ? "position" : undefined}
        transition={spring.moderate}
        className={cn("min-w-0 flex-1 truncate text-foreground", classes.text)}
      >
        {label}
      </motion.span>
      {hint && (
        <span
          style={{ fontSize: scale.caption }}
          className="shrink-0 text-muted-foreground"
        >
          {hint}
        </span>
      )}
      {trailing}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vistas
//
// Las filas de los dos niveles se arman en una sola pasada y salen numeradas
// de corrido: el resaltado del teclado es un índice sobre ese arreglo plano, y
// los títulos de grupo quedan afuera de la numeración porque no se pueden
// activar.
// ---------------------------------------------------------------------------

type Row =
  | { kind: "attribute"; key: string; index: number; attribute: FilterAttribute }
  | {
      kind: "option";
      key: string;
      index: number;
      attribute: FilterAttribute;
      option: FilterOption;
      checked: boolean;
    }
  | { kind: "term"; key: string; index: number; attribute: FilterAttribute; term: string }
  | { kind: "add"; key: string; index: number; attribute: FilterAttribute; term: string };

interface RowSection {
  key: string;
  label?: string;
  rows: Row[];
}

function buildSections(
  groups: FilterGroup[],
  attribute: FilterAttribute | null,
  query: string,
  selection: FilterSelection,
): RowSection[] {
  let cursor = 0;
  const sections: RowSection[] = [];

  if (!attribute) {
    for (const group of groups) {
      const rows = group.attributes
        .filter((a) => matches(a.label, query))
        .map<Row>((a) => ({
          kind: "attribute",
          key: a.id,
          index: cursor++,
          attribute: a,
        }));
      if (rows.length) sections.push({ key: group.label, label: group.label, rows });
    }
    return sections;
  }

  if (attribute.type === "text") {
    const term = query.trim();
    const terms = valuesOf(selection, attribute.id);
    const rows: Row[] = [];
    // Sólo si no está ya puesto: repetir un término no agrega nada y la fila
    // ofrecería algo que no cambia nada.
    if (term && !terms.includes(term)) {
      rows.push({ kind: "add", key: `add:${term}`, index: cursor++, attribute, term });
    }
    // Los términos ya puestos no se filtran por lo que se esté escribiendo:
    // mientras se tipea uno nuevo, esconder los viejos haría parecer que se
    // borraron.
    for (const t of terms) {
      rows.push({ kind: "term", key: `term:${t}`, index: cursor++, attribute, term: t });
    }
    return rows.length ? [{ key: attribute.id, rows }] : [];
  }

  const chosen = valuesOf(selection, attribute.id);
  const rows = (attribute.options ?? [])
    .filter((option) => matches(option.label, query))
    .map<Row>((option) => ({
      kind: "option",
      key: option.value,
      index: cursor++,
      attribute,
      option,
      checked: chosen.includes(option.value),
    }));
  return rows.length ? [{ key: attribute.id, rows }] : [];
}

// ---------------------------------------------------------------------------
// PanelList
//
// La lista de un nivel: el marco que scrollea, las filas y el resaltado que
// viaja entre ellas.
//
// Es un componente aparte y no un pedazo del panel por una razón que se paga
// caro si se deshace: **cada nivel necesita su propio medidor**. Las filas se
// anotan en `useProximityHover` por índice, y durante el cruce las dos vistas
// están montadas a la vez; con un medidor compartido los índices de las dos se
// pisan, y al desmontarse la que se va su limpieza borra las filas de la que
// acaba de entrar — el resaltado desaparece y no vuelve más. Un medidor por
// vista no puede colisionar, y de paso el resaltado del nivel nuevo aparece
// con su propia opacidad en vez de venir viajando desde el nivel anterior.
// ---------------------------------------------------------------------------

interface PanelListProps {
  listId: string;
  trip: number;
  rowId: (index: number) => string;
  ariaLabel: string;
  multiselectable?: boolean;
  sections: RowSection[];
  isEmpty: boolean;
  emptyMessage: string;
  selection: FilterSelection;
  /** La fila marcada, en índices de esta lista. Vive arriba porque el buscador
   *  —que está afuera— la anuncia por `aria-activedescendant` y Enter la
   *  activa. */
  highlighted: number;
  onHighlight: (index: number) => void;
  onActivate: (row: Row) => void;
}

function PanelList({
  listId,
  trip,
  rowId,
  ariaLabel,
  multiselectable,
  sections,
  isEmpty,
  emptyMessage,
  selection,
  highlighted,
  onHighlight,
  onActivate,
}: PanelListProps) {
  const classes = useSize();
  const scale = useTypeScale();
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * El resaltado, con el mismo mecanismo que el sidebar y el dropdown del
   * registry: el hook mide las filas y elige la *más cercana* al puntero, no la
   * que está literalmente abajo. Eso es lo que hace que no se apague al pasar
   * por el aire que queda entre dos filas.
   */
  const { activeIndex, itemRects, isMeasured, handlers, registerItem } =
    useProximityHover(containerRef);

  // El cable hacia arriba: el hook elige la fila acá adentro y el índice tiene
  // que salir de esta lista para que el buscador lo anuncie y Enter lo use. No
  // hay forma de derivarlo en el render — la elección la hace el hook en su
  // propio estado, un cuadro después del movimiento del mouse.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (activeIndex !== null) onHighlight(activeIndex);
  }, [activeIndex, onHighlight]);

  const highlightRect = highlighted >= 0 ? itemRects[highlighted] : undefined;

  return (
    <ScrollArea
      className="scroll-divider [--scroll-divider-inset:6px]"
      style={
        {
          "--filter-list-max": `${classes.controlHeight * VISIBLE_ROWS}px`,
          "--scroll-fade-size": `${classes.controlHeight}px`,
        } as CSSProperties
      }
      viewportClassName="scroll-fade max-h-[var(--filter-list-max)]"
    >
      <div
        id={listId}
        ref={containerRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-multiselectable={multiselectable}
        onMouseEnter={handlers.onMouseEnter}
        onMouseMove={handlers.onMouseMove}
        // Sin `onMouseLeave`: al salir el puntero, el resaltado se queda donde
        // estaba. Acá no es una marca de hover sino el cursor del teclado —es
        // la fila que Enter va a activar— y apagarlo lo dejaría sin destino.
        //
        // El aire va acá adentro y no en el viewport que scrollea, así el
        // contenedor que mide la proximidad también cubre los bordes: el
        // resaltado no se apaga al pasar por el borde de la lista.
        className="relative p-1.5"
      >
        {/* Una sola capa que viaja de fila en fila, en vez de un fondo por fila
            que prende y apaga. Viaja con el escalón rápido, que es el del
            hover, y aparece con una opacidad de 80ms para no verse venir desde
            otra fila la primera vez.

            Va antes que las filas en el DOM: las dos capas están posicionadas,
            así que manda el orden del documento, y así el texto queda arriba.

            `isMeasured` es la condición y no un detalle: mientras las medidas
            no describan lo que hay en pantalla, una capa montada contra ellas
            se corregiría después de aparecer, y esa corrección se ve como un
            deslizamiento desde otra fila. */}
        {isMeasured && highlightRect && (
          <motion.div
            aria-hidden="true"
            className={cn("pointer-events-none absolute bg-hover", shape.item)}
            initial={{
              opacity: 0,
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
            }}
            animate={{
              opacity: 1,
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
            }}
            transition={{ ...spring.fast, opacity: { duration: 0.08 } }}
          />
        )}

        {sections.map((section) => (
          <div key={section.key} className="flex flex-col">
            {section.label && (
              <p
                style={{ fontSize: scale.caption }}
                className="px-2 pb-1 pt-1.5 text-muted-foreground"
              >
                {section.label}
              </p>
            )}
            {section.rows.map((row) => {
              const shared = {
                id: rowId(row.index),
                active: row.index === highlighted,
                index: row.index,
                registerItem,
                onActivate: () => onActivate(row),
              };

              if (row.kind === "attribute") {
                const count = valuesOf(selection, row.attribute.id).length;
                return (
                  <PanelRow
                    key={row.key}
                    {...shared}
                    icon={row.attribute.icon}
                    label={row.attribute.label}
                    travelIconId={travelId(
                      listId,
                      trip,
                      "icon",
                      row.attribute.id,
                    )}
                    travelLabelId={travelId(
                      listId,
                      trip,
                      "label",
                      row.attribute.id,
                    )}
                    trailing={
                      <span
                        className={cn(
                          "flex shrink-0 items-center",
                          classes.gap,
                        )}
                      >
                        {count > 0 && <Count>{count}</Count>}
                        <ChevronRight
                          size={classes.icon}
                          strokeWidth={1.75}
                          className="text-muted-foreground"
                        />
                      </span>
                    }
                  />
                );
              }

              if (row.kind === "option") {
                return (
                  <PanelRow
                    key={row.key}
                    {...shared}
                    icon={row.option.icon}
                    label={row.option.label}
                    hint={row.option.hint}
                    selected={row.checked}
                    trailing={
                      <Check
                        size={classes.icon}
                        strokeWidth={2}
                        aria-hidden="true"
                        className={cn(
                          "shrink-0 text-foreground transition-opacity duration-80",
                          row.checked ? "opacity-100" : "opacity-0",
                        )}
                      />
                    }
                  />
                );
              }

              if (row.kind === "add") {
                return (
                  <PanelRow
                    key={row.key}
                    {...shared}
                    icon={Plus}
                    label={`Agregar «${row.term}»`}
                  />
                );
              }

              return (
                <PanelRow
                  key={row.key}
                  {...shared}
                  label={row.term}
                  selected
                  trailing={
                    <X
                      size={classes.icon}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground"
                    />
                  }
                />
              );
            })}
          </div>
        ))}

        {isEmpty && (
          <p
            className={cn(
              "flex items-center px-2 text-muted-foreground",
              classes.control,
              classes.text,
            )}
          >
            {emptyMessage}
          </p>
        )}
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// FilterMenu
// ---------------------------------------------------------------------------

function FilterMenu({
  groups,
  label = "Filtros",
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size,
  align = "start",
  className,
}: FilterMenuProps) {
  const isOpenControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isOpenControlled ? openProp : internalOpen;
  const actionsRef = useRef<{ unmount: () => void; close: () => void } | null>(null);

  const isValueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<FilterSelection>(
    defaultValue ?? {},
  );
  const selection = value ?? internalValue;

  /** La fila marcada. La mueven el teclado desde acá y el puntero desde la
   *  lista, que avisa por `onHighlight`: un solo resaltado y no dos que se
   *  pisan. */
  const [activeIndex, setActiveIndex] = useState(0);

  const [path, setPath] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  /** Sube en cada vuelta al primer nivel — ver `travelId`. */
  const [trip, setTrip] = useState(0);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const rowId = (index: number) => `${listId}-row-${index}`;

  // El override va directo y no por contexto: estos hooks corren afuera del
  // `SizeProvider` que este mismo componente monta. Lo portaleado sí lo lee
  // del provider — el contexto de React cruza el portal.
  const classes = useSize(size);
  const scale = useTypeScale(size);

  const commit = useCallback(
    (next: FilterSelection) => {
      if (!isValueControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isValueControlled, onValueChange],
  );

  const attributes = useMemo(
    () => groups.flatMap((group) => group.attributes),
    [groups],
  );
  const attribute = useMemo(
    () => (path ? (attributes.find((a) => a.id === path) ?? null) : null),
    [attributes, path],
  );

  const sections = useMemo(
    () => buildSections(groups, attribute, query, selection),
    [groups, attribute, query, selection],
  );
  const rows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);

  // El resaltado se recorta en el render y no se corrige con un efecto: si la
  // lista se acortó por debajo de donde estaba parado — al destildar el último
  // término de un atributo de texto, por ejemplo — el índice bueno se calcula
  // acá mismo. Un efecto que lo arreglara después pintaría un cuadro con la
  // marca en una fila que ya no existe.
  const highlighted = rows.length ? Math.min(activeIndex, rows.length - 1) : -1;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange],
  );

  /**
   * Base UI difiere el desmontaje mientras haya `actionsRef`, así que el panel
   * se libera recién cuando terminó la animación de salida. El estado de
   * navegación se reinicia en el mismo lugar y no al cerrar: si se limpiara
   * antes, el panel se vería volver al primer nivel mientras se desvanece.
   */
  useEffect(() => {
    if (open) return;
    const id = window.setTimeout(() => {
      actionsRef.current?.unmount();
      setPath(null);
      setQuery("");
      setActiveIndex(0);
      setDirection(1);
      setTrip(0);
    }, exitFallbackMs(spring.moderate));
    return () => window.clearTimeout(id);
  }, [open, setActiveIndex]);

  /** Cambiar lo que se busca devuelve el resaltado a la primera fila: quedarse
   *  en el índice 5 después de escribir tres letras deja la marca en una fila
   *  que no tiene nada que ver con lo que se buscó. Por acá pasan las cuatro
   *  formas de cambiarlo — tipear, entrar, volver y agregar un término. */
  const search = useCallback(
    (next: string) => {
      setQuery(next);
      setActiveIndex(0);
    },
    [setActiveIndex],
  );

  const enter = useCallback(
    (next: FilterAttribute) => {
      setDirection(1);
      setPath(next.id);
      search("");
      inputRef.current?.focus();
    },
    [search],
  );

  const back = useCallback(() => {
    setDirection(-1);
    setPath(null);
    setTrip((n) => n + 1);
    search("");
    inputRef.current?.focus();
  }, [search]);

  const activate = useCallback(
    (row: Row) => {
      switch (row.kind) {
        case "attribute":
          enter(row.attribute);
          break;
        case "option":
          commit(toggleValue(selection, row.attribute, row.option.value));
          // Con un solo valor posible, quedarse adentro del atributo es
          // quedarse mirando una lista donde ya no hay nada que hacer.
          if (row.attribute.single) back();
          break;
        case "add":
          commit(toggleValue(selection, row.attribute, row.term));
          search("");
          break;
        case "term":
          commit(toggleValue(selection, row.attribute, row.term));
          break;
      }
    },
    [back, commit, enter, search, selection],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const row = rows[highlighted];

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (!rows.length) return;
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        // Da la vuelta: en una lista corta, bajar desde la última a la primera
        // es más rápido que subir siete veces.
        const next = (highlighted + step + rows.length) % rows.length;
        setActiveIndex(next);
        // Y la trae a la vista. Hay que pedirlo a mano: las filas no reciben
        // el foco, que es lo que normalmente arrastra el scroll de una lista.
        document
          .getElementById(rowId(next))
          ?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "Enter":
        if (row) {
          event.preventDefault();
          activate(row);
        }
        break;
      case "ArrowRight":
        // Sólo con el cursor al final del texto: si está en el medio de lo que
        // se escribió, la flecha es del campo y no del panel.
        if (
          row?.kind === "attribute" &&
          input.selectionStart === input.value.length
        ) {
          event.preventDefault();
          enter(row.attribute);
        }
        break;
      case "ArrowLeft":
      case "Backspace":
        if (attribute && !query) {
          event.preventDefault();
          back();
        }
        break;
      case "Escape":
        // Escape deshace de a un paso: primero la búsqueda, después el nivel, y
        // recién con las dos cosas limpias cierra el panel. Lo último lo hace
        // Base UI, que escucha la tecla en el contenedor del portal; para
        // frenarlo hay que cortar la propagación del evento nativo, porque el
        // handler de React corre antes pero sobre el mismo evento.
        if (query) {
          event.preventDefault();
          event.nativeEvent.stopPropagation();
          search("");
        } else if (attribute) {
          event.preventDefault();
          event.nativeEvent.stopPropagation();
          back();
        }
        break;
    }
  };

  // El marco de la lista anima su alto contra el de la vista que está en
  // pantalla. Se mide con un ResizeObserver sobre el nodo de la vista actual y
  // no con `layout` de framer, que para animar el alto escala el marco y le
  // deforma el texto a las filas.
  const [viewNode, setViewNode] = useState<HTMLDivElement | null>(null);
  const [viewHeight, setViewHeight] = useState<number | null>(null);

  // La función de limpieza es la que evita que la vista que se está yendo se
  // lleve puesta la medición de la que entra: React 19 no llama al ref con
  // `null` cuando hay cleanup, así que cada nodo limpia el suyo y el tardío
  // sólo borra si todavía era el nodo actual.
  const attachView = useCallback((node: HTMLDivElement) => {
    setViewNode(node);
    return () => setViewNode((current) => (current === node ? null : current));
  }, []);

  useLayoutEffect(() => {
    if (!viewNode) return;
    const measure = () => setViewHeight(viewNode.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewNode);
    return () => observer.disconnect();
  }, [viewNode]);

  const scopeCount = attribute
    ? valuesOf(selection, attribute.id).length
    : totalValues(selection);
  const triggerCount = totalValues(selection);

  const AttributeIcon = attribute?.icon;

  /** Los botones cuadrados de la cabecera bajan con la región: la escalera
   *  tiene un escalón propio para el botón de sólo ícono en cada paso. */
  const iconButtonSize = classes.variant === "compact" ? "icon-compact" : "icon";

  const placeholder = attribute
    ? (attribute.searchPlaceholder ??
      (attribute.type === "text"
        ? `${attribute.label} contiene…`
        : `Buscar en ${attribute.label.toLowerCase()}…`))
    : "Buscar atributos…";

  const panel = (
    <Popover.Root
      open={open}
      onOpenChange={(next, details) => {
        // Escape con búsqueda escrita o adentro de un atributo no cierra: eso
        // lo resuelve `onKeyDown`. Pero la tecla también llega por acá cuando
        // el foco está en la X o en el botón de limpiar, donde el handler del
        // campo no corre — de ahí el mismo corte del lado de Base UI.
        if (!next && details.reason === "escape-key" && (query || attribute)) {
          details.cancel();
          if (query) search("");
          else back();
          inputRef.current?.focus();
          return;
        }
        handleOpenChange(next);
      }}
      actionsRef={actionsRef}
      // Sin modal: la página sigue scrolleando y el positioner sigue al botón,
      // así el panel viaja con su ancla en vez de despegarse.
      modal={false}
    >
      {/* El botón va adentro de un contenedor inline y no suelto: `Popover.Root`
          no dibuja nada, así que sin esto el botón queda como hijo directo de
          lo que haya alrededor y una columna flex se lo estira de punta a
          punta. Es el mismo envoltorio que usa `ColorPickerPopover`. */}
      <div className="inline-flex">
        <Popover.Trigger
          render={
            <Button
              variant="tertiary"
              leadingIcon={ListFilter}
              size={size}
              active={open}
              className={className}
            />
          }
        >
          {/* Etiqueta y contador van en una misma caja inline con el aire de la
              escalera. No alcanza con ponerlos como dos hijos sueltos: el
              Button mete a todos sus hijos en el span de la etiqueta, y ahí
              adentro su `gap` no llega — el número terminaría pegado a la
              palabra. La caja es `inline-flex` por lo mismo que el contador:
              una de bloque se iría al renglón de abajo. */}
          {triggerCount > 0 ? (
            <span className={cn("inline-flex items-center", classes.gap)}>
              {label}
              <Count>{triggerCount}</Count>
            </span>
          ) : (
            label
          )}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align={align}
            sideOffset={6}
            className="z-50 outline-none"
          >
            <motion.div
              initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
              animate={
                open
                  ? { opacity: 1, y: 0, scaleY: 1 }
                  : { opacity: 0, y: -4, scaleY: 0.96 }
              }
              transition={open ? spring.moderate : spring.moderate.exit}
              style={{
                transformOrigin: align === "start" ? "top left" : "top right",
              }}
              onAnimationComplete={() => {
                if (!open) actionsRef.current?.unmount();
              }}
            >
              <Popover.Popup
                // El plano sale de `Elevated`: dos escalones sobre el sustrato
                // —lo que sube cualquier popover— y sombra fija en 3, así el
                // panel pesa lo mismo abierto sobre la página que adentro de un
                // diálogo, aunque su fondo siga al sustrato. Elevated además
                // vuelve a publicar el nivel, y por eso las filas y el pie de
                // acá adentro no necesitan saber sobre qué se abrió.
                render={<Elevated offset={2} shadowLevel={3} />}
                // El foco entra al buscador y no al panel: es el único lugar
                // desde donde se maneja todo lo demás.
                initialFocus={inputRef}
                aria-label={label}
                className={cn(
                  "flex flex-col overflow-hidden outline-none",
                  shape.container,
                )}
                style={{ width: PANEL_WIDTH }}
              >
                {/* Cabecera: título, vuelta y cierre. La vuelta y la X no
                    viajan con el contenido — son del panel, no del nivel.
                    El alto es una fila de la escalera más el aire del panel,
                    así la X cae en la misma grilla que las filas de abajo. */}
                {/* `z-10`: el nombre que viaja desde la fila se dibuja en el
                    DOM de la cabecera, y sin esto la lista —que va después—
                    le pasaría por encima durante el vuelo. */}
                <div
                  className="relative z-10 flex shrink-0 items-center gap-1 px-1.5"
                  style={{ height: classes.controlHeight + PANEL_PAD * 2 }}
                >
                  {/* La vuelta aparece con su ancho ya puesto y sólo se
                      revela: si el ancho creciera, el lugar de la cabecera al
                      que apunta el nombre se estaría moviendo mientras el
                      nombre viaja hacia él, y aterrizaría corrido. */}
                  {attribute && (
                    <motion.div
                      key="back"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={spring.moderate}
                    >
                      <Button
                        variant="ghost"
                        size={iconButtonSize}
                        aria-label="Volver a los atributos"
                        onClick={back}
                      >
                        <ChevronLeft />
                      </Button>
                    </motion.div>
                  )}

                  {/* El título no se corre: en el nivel de un atributo lo que
                      llega es el nombre volando desde su fila, y un
                      desplazamiento propio pelearía con ese viaje. Lo único
                      que hace acá el título de la raíz es cruzarse en opacidad
                      con el que llega. */}
                  <div className="relative flex min-w-0 flex-1 items-center">
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={attribute?.id ?? "__root__"}
                        variants={titleVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={spring.moderate}
                        className={cn(
                          "flex min-w-0 items-center px-1.5",
                          classes.gap,
                        )}
                      >
                        {attribute && AttributeIcon ? (
                          <>
                            <motion.span
                              layoutId={travelId(
                                listId,
                                trip,
                                "icon",
                                attribute.id,
                              )}
                              layout="position"
                              transition={spring.moderate}
                              className="shrink-0 text-muted-foreground"
                            >
                              <AttributeIcon
                                size={classes.icon}
                                strokeWidth={1.75}
                              />
                            </motion.span>
                            <motion.span
                              layoutId={travelId(
                                listId,
                                trip,
                                "label",
                                attribute.id,
                              )}
                              layout="position"
                              transition={spring.moderate}
                              style={{ fontSize: scale.subtitle }}
                              className="truncate font-medium text-foreground"
                            >
                              {attribute.label}
                            </motion.span>
                          </>
                        ) : (
                          <span
                            style={{ fontSize: scale.subtitle }}
                            className="truncate font-medium text-foreground"
                          >
                            {label}
                          </span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <Popover.Close
                    render={
                      <Button
                        variant="ghost"
                        size={iconButtonSize}
                        aria-label="Cerrar filtros"
                      />
                    }
                  >
                    <X />
                  </Popover.Close>
                </div>

                <span className="h-px shrink-0 bg-border" />

                {/* Buscador. Se pinta con `bg-hover` — una capa translúcida— y
                    no con un escalón fijo de la escalera: el panel se abre
                    sobre cualquier sustrato, y un `bg-surface-2` quedaría más
                    oscuro o más claro que su propio panel según dónde caiga.

                    No dibuja anillo de foco. Mientras el panel está abierto el
                    foco vive acá, así que un anillo permanente no informaría
                    nada; quien dice dónde estás parado es el resaltado de la
                    fila, que es lo que se mueve. */}
                <div
                  className="relative shrink-0"
                  style={{ margin: PANEL_PAD, marginBottom: 0 }}
                >
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => search(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    role="combobox"
                    aria-expanded
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                      highlighted >= 0 ? rowId(highlighted) : undefined
                    }
                    aria-label={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    // El padding de la derecha deja lugar a la lupa: el glifo
                    // de la escalera más el aire del campo de los dos lados.
                    style={{ paddingRight: classes.icon + PANEL_PAD * 2 }}
                    className={cn(
                      "w-full bg-hover text-foreground outline-none",
                      "placeholder:text-muted-foreground",
                      shape.input,
                      classes.control,
                      classes.px,
                      classes.text,
                    )}
                  />
                  <Search
                    size={classes.icon}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    style={{ right: PANEL_PAD * 2 }}
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>

                <motion.div
                  // `initial={false}`: en el primer render todavía no hay
                  // medida y el alto es `auto`; sin esto el panel se abriría
                  // animando de 0 a su alto por dentro, además de la entrada
                  // que ya hace por fuera.
                  initial={false}
                  animate={{ height: viewHeight ?? "auto" }}
                  transition={spring.moderate}
                  className="relative overflow-hidden"
                >
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={attribute?.id ?? "__root__"}
                      ref={attachView}
                      custom={direction}
                      variants={viewVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={spring.moderate}
                    >
                      {/* El scroll va por `ScrollArea` con `scroll-fade` en el
                          viewport y `scroll-divider` en el marco: el thumb del
                          sistema, el contenido que se disuelve hacia el borde
                          que todavía tiene más, y la línea que aparece cuando
                          hay algo pasando por arriba o por abajo. La línea no
                          puede ir en el mismo nodo que scrollea — la máscara
                          del fade se la comería.

                          El tope de alto viaja como variable CSS porque sale
                          de la escalera en tiempo de ejecución, y Tailwind sólo
                          genera clases que puede leer en el código. */}
                      <PanelList
                        listId={listId}
                        trip={trip}
                        rowId={rowId}
                        ariaLabel={attribute ? attribute.label : label}
                        multiselectable={
                          attribute ? !attribute.single : undefined
                        }
                        sections={sections}
                        isEmpty={!rows.length}
                        emptyMessage={
                          attribute?.type === "text"
                            ? "Escribí un texto y apretá Enter"
                            : "No hay nada con ese nombre"
                        }
                        selection={selection}
                        highlighted={highlighted}
                        onHighlight={setActiveIndex}
                        onActivate={activate}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Pie: aparece sólo cuando hay algo puesto en el nivel donde
                    estás, y limpia exactamente eso. */}
                <AnimatePresence initial={false}>
                  {scopeCount > 0 && (
                    <motion.div
                      key="footer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={spring.moderate}
                      className="shrink-0 overflow-hidden"
                    >
                      <span className="block h-px bg-border" />
                      <div
                        className="flex items-center justify-between pl-3 pr-1.5"
                        style={{ height: classes.controlHeight + PANEL_PAD * 2 }}
                      >
                        <span
                          style={{ fontSize: scale.caption }}
                          className="text-muted-foreground"
                        >
                          {scopeCount === 1
                            ? "1 filtro puesto"
                            : `${scopeCount} filtros puestos`}
                        </span>
                        {/* Sin `size`: el botón sigue al SizeProvider del panel
                            como cualquier otro control de la región. */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            commit(
                              attribute
                                ? clearAttribute(selection, attribute.id)
                                : {},
                            );
                            inputRef.current?.focus();
                          }}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Popover.Popup>
            </motion.div>
          </Popover.Positioner>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );

  return size ? <SizeProvider size={size}>{panel}</SizeProvider> : panel;
}

export { FilterMenu };
export type {
  FilterMenuProps,
  FilterAttribute,
  FilterGroup,
  FilterOption,
  FilterSelection,
};
