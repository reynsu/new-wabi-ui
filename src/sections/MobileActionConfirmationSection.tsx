import { useState } from "react";
import {
  Bell,
  Grid3x3,
  Palette,
  Share2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MobileActionConfirmation,
  type ConfirmationStep,
} from "@/components/mobile-action-confirmation";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "./Shared";

/* Los pasos de una alta guiada: el caso donde la hoja no confirma una acción
   sino una secuencia. Ocho pasos a propósito — es el número que hace que el
   riel de puntos se retire y quede sólo el contador. */
const TOUR: ConfirmationStep[] = [
  {
    id: "library",
    icon: Grid3x3,
    title: "Biblioteca de shaders",
    description:
      "Recorré y cambiá entre todos los shaders que tenés guardados, sin salir del editor.",
  },
  {
    id: "palette",
    icon: Palette,
    title: "Paleta compartida",
    description:
      "Los colores de un shader viajan a los demás: cambiás la paleta una vez y se actualiza todo el set.",
  },
  {
    id: "presets",
    icon: Wand2,
    title: "Presets del equipo",
    description: "Guardá una combinación y compartila con el resto del equipo.",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Avisos de render",
    description:
      "Te avisamos cuando termina un render largo, aunque tengas la aplicación cerrada.",
  },
  {
    id: "share",
    icon: Share2,
    title: "Enlaces públicos",
    description: "Publicá un shader con un enlace que se abre sin cuenta.",
  },
  {
    id: "sync",
    icon: Sparkles,
    title: "Sincronización",
    description:
      "Todo lo que guardás en el teléfono aparece en el escritorio al abrirlo.",
  },
  {
    id: "beta",
    icon: Sparkles,
    title: "Funciones en prueba",
    description:
      "Activá lo que todavía estamos escribiendo y contanos qué se rompe.",
  },
  {
    id: "ready",
    icon: Sparkles,
    title: "Listo",
    description: "Eso es todo. Podés volver a ver esta guía desde Ajustes.",
  },
];

const DELETE_STEP: ConfirmationStep[] = [
  {
    id: "delete",
    icon: Trash2,
    title: "Borrar el shader",
    description:
      "Se borra de la biblioteca y de los proyectos donde lo estés usando. No se puede deshacer.",
  },
];

/* Una pantalla de teléfono dibujada: el marco es `relative` y `overflow:
   hidden`, que es lo que la hoja necesita para portalearse adentro en vez de
   sobre la ventana. Lo de adentro es relleno — está para que el velo tenga
   algo que oscurecer. */
function Phone({
  frame,
  children,
}: {
  frame: (node: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={frame}
      className="relative h-[520px] w-[300px] shrink-0 overflow-hidden rounded-[28px] bg-surface-1 shadow-surface-3"
    >
      <div className="flex h-full flex-col gap-3 p-4 opacity-60">
        <div className="h-6 w-24 rounded-md bg-accent" />
        <div className="h-32 rounded-xl bg-accent" />
        <div className="h-3 w-full rounded bg-accent" />
        <div className="h-3 w-4/5 rounded bg-accent" />
        <div className="h-3 w-2/3 rounded bg-accent" />
        <div className="mt-2 h-24 rounded-xl bg-accent" />
      </div>
      {children}
    </div>
  );
}

export function MobileActionConfirmationSection() {
  const [tourFrame, setTourFrame] = useState<HTMLDivElement | null>(null);
  const [deleteFrame, setDeleteFrame] = useState<HTMLDivElement | null>(null);
  const [compactFrame, setCompactFrame] = useState<HTMLDivElement | null>(null);

  const [tourOpen, setTourOpen] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(true);
  const [compactOpen, setCompactOpen] = useState(true);
  const [pending, setPending] = useState(false);

  const confirmDelete = () => {
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setDeleteOpen(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="MobileActionConfirmation"
        hint="La hoja que confirma una acción en pantalla de teléfono: qué acción es, qué implica y las dos salidas, ancladas al piso donde llega el pulgar. Con varios pasos la misma hoja lleva el contador y el riel, y «Continuar» avanza en vez de confirmar."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Phone frame={setTourFrame}>
            <MobileActionConfirmation
              open={tourOpen}
              onOpenChange={setTourOpen}
              steps={TOUR}
              container={tourFrame}
              onSkip={() => setTourOpen(false)}
              onConfirm={() => setTourOpen(false)}
              finalConfirmLabel="Empezar"
              tileClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            />
          </Phone>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              Ocho pasos, que es justo pasado el tope del riel: los puntos se
              retiran y queda el contador. Sacá dos pasos del arreglo y el riel
              vuelve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="tertiary"
                size="compact"
                onClick={() => setTourOpen(true)}
                disabled={tourOpen}
              >
                Abrir la guía
              </Button>
              <Button
                variant="ghost"
                size="compact"
                onClick={() => setTourOpen(false)}
                disabled={!tourOpen}
              >
                Cerrar
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground">
              El velo y la hoja se portalean adentro del marco, no sobre la
              ventana: es la prop <code className="text-foreground">container</code>,
              la misma escotilla que tiene el diálogo del registry.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Una sola acción"
        hint="El caso común: un paso, sin contador ni riel, y la salida de arriba no se dibuja porque no hay nada que saltear. El tile toma el tono destructivo y el confirmar queda cargando mientras la acción viaja."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Phone frame={setDeleteFrame}>
            <MobileActionConfirmation
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              steps={DELETE_STEP}
              container={deleteFrame}
              tone="destructive"
              pending={pending}
              confirmLabel="Borrar"
              onConfirm={confirmDelete}
            />
          </Phone>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              El clic afuera no cierra — es un <code className="text-foreground">alertdialog</code>,
              hay que elegir una de las dos salidas. Escape sí, que es la
              cancelación de siempre.
            </p>
            <Button
              variant="tertiary"
              size="compact"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteOpen}
            >
              Volver a abrir
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Densidad compacta"
        hint="En un teléfono de verdad esto no hay que pedirlo: la hoja ve el puntero grueso y se pone compacta sola. Acá, con mouse, se fuerza con un SizeProvider para ver el escalón. Los textos y el glifo bajan uno y la hoja se cierra, pero la fila de acciones queda en 44px: el salto al pulgar es el mismo en los dos escalones, así que lo que se achica es el aire y nunca el objetivo táctil."
      >
        <div className="flex flex-wrap items-start gap-6">
          <SizeProvider size="compact">
            <Phone frame={setCompactFrame}>
              <MobileActionConfirmation
                open={compactOpen}
                onOpenChange={setCompactOpen}
                steps={TOUR.slice(0, 3)}
                container={compactFrame}
                placement="center"
                onSkip={() => setCompactOpen(false)}
                onConfirm={() => setCompactOpen(false)}
                finalConfirmLabel="Empezar"
              />
            </Phone>
          </SizeProvider>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              Tres pasos: acá el riel sí se dibuja, y el punto activo viaja en
              vez de prenderse y apagarse. Va con{" "}
              <code className="text-foreground">placement="center"</code>, que es
              para cuando el piso del marco no es el piso de la pantalla.
            </p>
            <Button
              variant="tertiary"
              size="compact"
              onClick={() => setCompactOpen(true)}
              disabled={compactOpen}
            >
              Volver a abrir
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
