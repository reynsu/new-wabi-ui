import { useRef, useState } from "react";

import { WindowControls } from "@/components/window-controls";
import { MenuItem } from "@/components/ui/menu-item";
import { useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Section } from "./Shared";

/** Lo que se ve dentro de la ventana flotante. Es React normal: va por un
 *  portal al documento de la ventana nueva, con los estilos clonados. */
function FloatingPanel() {
  return (
    <div className="flex h-full flex-col justify-between bg-surface-1 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-medium">Fluid Functionalism</p>
        <p className="text-[12px] text-muted-foreground">
          Esto vive en otra ventana del sistema operativo, pero sigue siendo el
          mismo árbol de React.
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Cerrala desde su cruz o desde el botón de la barra.
      </p>
    </div>
  );
}

/** Espejo del estado del sidebar, para comprobar que el botón opera sobre el
 *  de verdad y no sobre una copia local. */
function SidebarState() {
  const { state, open, isMobile, side, shortcut } = useSidebar();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge color={open ? "green" : "gray"} size="compact">
        {state}
      </Badge>
      <Badge color="blue" size="compact">
        lado: {side}
      </Badge>
      <Badge color="violet" size="compact">
        {isMobile ? "móvil" : "escritorio"}
      </Badge>
      {shortcut && (
        <span className="text-[12px] text-muted-foreground">
          atajo: <kbd className="font-mono">{shortcut}</kbd>
        </span>
      )}
    </div>
  );
}

export function WindowControlsSection() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { setWidth } = useSidebar();
  const [notas, setNotas] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="La barra"
        hint="Cuatro controles con un único TravelTooltip, que siempre abre hacia abajo. Nueva nota, ventana flotante por Document Picture-in-Picture, un menú «Más…» y el panel lateral por useSidebar()."
      >
        <div className="pb-20">
          <WindowControls
            floatingContent={<FloatingPanel />}
            onCompose={() => setNotas((n) => [...n, `Nota ${n.length + 1}`])}
            moreItems={(i) => (
              <>
                <MenuItem
                  index={i}
                  label="Restablecer ancho del panel"
                  onSelect={() => setWidth("16rem")}
                />
                <MenuItem
                  index={i + 1}
                  label="Vaciar notas"
                  disabled={notas.length === 0}
                  onSelect={() => setNotas([])}
                />
              </>
            )}
          />
        </div>

        <SidebarState />

        {notas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notas.map((n) => (
              <Badge key={n} color="teal" size="compact">
                {n}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="El menú «Más…»"
        hint="Pantalla completa y ventana flotante viven acá dentro; los items extra los pone quien usa el componente con moreItems, que recibe el índice desde el que seguir."
      >
        <p className="text-[13px] text-muted-foreground">
          Mientras el menú está abierto ese item se silencia
          (<code>suppressed</code>): el popup se despliega justo donde iría la
          píldora, y como aparece bajo el cursor nunca llegaría un mouseleave
          que la cerrara sola.
        </p>
      </Section>

      <Section
        title="La etiqueta sigue al estado"
        hint="Cada etiqueta refleja el estado actual: «Usar» ⇄ «Cerrar», «Ocultar» ⇄ «Mostrar». Al cambiar el texto la píldora se remide y anima su ancho, el mismo mecanismo del traslado pero disparado por estado en vez de por el puntero."
      >
        <p className="text-[13px] text-muted-foreground">
          Es lo que obligó a mover los labels de un ref a estado en
          TravelTooltip: en un ref, cambiar el texto de un item no
          re-renderizaba al padre y la píldora se quedaba con el anterior.
        </p>
        <p className="text-[13px] text-muted-foreground">
          Si el tooltip sigue abierto tras pulsar depende del botón, no del
          componente: el de la ventana flotante no mueve nada y la píldora se
          reajusta en el sitio, mientras que el del panel lateral reacomoda la
          página y el botón se va de debajo del cursor, así que el tooltip se
          cierra — como debe.
        </p>
      </Section>

      <Section
        title="Pantalla completa acotada"
        hint="fullscreenTarget apunta a un elemento concreto en vez del documento entero: sólo esta tarjeta pasa a pantalla completa. Está en el menú «Más…»."
      >
        <div
          ref={panelRef}
          className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-6 shadow-surface-2"
        >
          <p className="text-[13px] text-muted-foreground">
            Esta tarjeta es el objetivo. En pantalla completa ocupa todo, con el
            resto de la página fuera.
          </p>
          <div className="pb-20">
            <WindowControls
              sidebar={false}
              fullscreenTarget={() => panelRef.current}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Sin sidebar"
        hint="sidebar={false} omite ese botón y, con él, la llamada a useSidebar() — que lanza fuera de un SidebarProvider. Por eso ese botón vive en un subcomponente propio."
      >
        <div className="pb-20">
          <WindowControls sidebar={false} size="compact" />
        </div>
      </Section>
    </div>
  );
}
