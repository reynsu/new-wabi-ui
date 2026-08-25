import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Folder, FolderOpen, Inbox, Plus, Search, SearchX, Upload } from "lucide-react";

import {
  AnimatedEmpty,
  AnimatedEmptyContent,
  AnimatedEmptyDescription,
  AnimatedEmptyHeader,
  AnimatedEmptyMedia,
  AnimatedEmptyTitle,
} from "@/components/animated-empty";
import { Button } from "@/components/ui/button";
import { InputField, InputGroup } from "@/components/ui/input-group";
import { Elevated } from "@/lib/elevated";
import { SizeProvider } from "@/lib/size-context";
import { cn } from "@/lib/utils";
import { Section } from "./Shared";

/** El hueco donde se apoya el bloque. La demo necesita un marco con alto para
 *  que el vacío se vea centrado en algo; en una app ese marco es el panel.
 *
 *  Va con `Elevated` y no con un `bg-surface-*` a mano porque además de pintar
 *  el escalón lo publica hacia adentro: la placa de la media sube desde el
 *  marco que la contiene, que es lo que este componente promete. */
function Hueco({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Elevated offset={1} shadowLevel={1} className={cn("flex min-h-64 w-full rounded-xl", className)}>
      {children}
    </Elevated>
  );
}

/** Bloque de código, igual que en las otras páginas propias. */
function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-relaxed shadow-surface-1">
      <code className="font-mono">{children.trim()}</code>
    </pre>
  );
}

const PROYECTOS = ["Atlasflow", "Corriente", "Peral"];

/** Los dos vacíos que tiene una lista con buscador, que no son el mismo: uno
 *  dice "todavía no", el otro "acá no". Cambiar de uno al otro es lo que
 *  ejercita la salida. */
function BuscadorVacio() {
  const [query, setQuery] = useState("marmot");
  const [vacia, setVacia] = useState(false);

  const fuente = vacia ? [] : PROYECTOS;
  const resultados = fuente.filter((p) =>
    p.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="w-full max-w-sm">
          <InputField
            index={0}
            label="Search projects"
            labelHidden
            icon={Search}
            placeholder="Try Atlasflow, or anything at all"
            value={query}
            onChange={setQuery}
          />
        </InputGroup>
        <Button
          variant="tertiary"
          size="compact"
          onClick={() => setVacia((v) => !v)}
        >
          {vacia ? "Restore all 3" : "Empty the list"}
        </Button>
      </div>

      <Hueco>
        {/* `mode="wait"`: el que se va termina antes de que el que entra
            arranque. Con los dos a la vez, dos bloques centrados se pisan en el
            mismo lugar y el cruce se lee como un parpadeo. */}
        <AnimatePresence mode="wait" initial={false}>
          {resultados.length > 0 ? (
            <div
              key="lista"
              className="flex w-full flex-col gap-2 p-4 text-[13px]"
            >
              {resultados.map((p) => (
                <div
                  key={p}
                  className="rounded-lg bg-surface-3 px-3 py-2 shadow-surface-1"
                >
                  {p}
                </div>
              ))}
            </div>
          ) : (
            // La key separa los dos vacíos: sin ella React reusa el mismo
            // bloque y el texto cambiaría de golpe adentro de una figura que ya
            // está puesta, que es justo lo que este componente evita.
            <AnimatedEmpty key={query.trim() ? "sin-resultados" : "sin-nada"}>
              <AnimatedEmptyHeader>
                <AnimatedEmptyMedia variant="icon">
                  {query.trim() ? <SearchX /> : <FolderOpen />}
                </AnimatedEmptyMedia>
                <AnimatedEmptyTitle>
                  {query.trim() ? "No results" : "No projects yet"}
                </AnimatedEmptyTitle>
                <AnimatedEmptyDescription>
                  {query.trim()
                    ? `Nothing matches "${query.trim()}". Try fewer letters.`
                    : "Once you create the first one it shows up here."}
                </AnimatedEmptyDescription>
              </AnimatedEmptyHeader>
            </AnimatedEmpty>
          )}
        </AnimatePresence>
      </Hueco>
    </div>
  );
}

export function AnimatedEmptySection() {
  const [vuelta, setVuelta] = useState(0);

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="The block"
        hint="The figure settles with a tilt that straightens as it lands, then the glyph appears, then the stamp in the corner, and only then the title, the description and the action. Mount it again to watch it once more."
      >
        <div className="flex flex-col items-start gap-3">
          <Hueco className="min-h-96">
            <AnimatedEmpty key={vuelta}>
              <AnimatedEmptyHeader>
                <AnimatedEmptyMedia variant="figure" badge={<Plus />}>
                  <Folder />
                </AnimatedEmptyMedia>
                <AnimatedEmptyTitle>Create your first folder</AnimatedEmptyTitle>
                <AnimatedEmptyDescription>
                  There are no files in this workspace. To carry on, create a
                  folder.
                </AnimatedEmptyDescription>
              </AnimatedEmptyHeader>
              <AnimatedEmptyContent>
                <Button variant="secondary" leadingIcon={Plus}>
                  New folder
                </Button>
              </AnimatedEmptyContent>
            </AnimatedEmpty>
          </Hueco>
          <Button
            variant="tertiary"
            size="compact"
            onClick={() => setVuelta((v) => v + 1)}
          >
            Mount it again
          </Button>
        </div>
      </Section>

      <Section
        title="When the emptiness changes"
        hint="The two empty states of a list with a search box, which aren't the same: one says “not here”, the other “not yet”. Type something that doesn't exist, then empty the list with the field blank. The one leaving goes from the bottom up and faster than it came in."
      >
        <BuscadorVacio />
      </Section>

      <Section
        title="The dashed frame"
        hint="variant='dashed' encloses the gap when the emptiness has a shape —a card, a cell, a panel that gets filled later—. The radius comes from the shape system, same as the cards'."
      >
        <div className="w-full max-w-md">
          <AnimatedEmpty variant="dashed">
            <AnimatedEmptyHeader>
              <AnimatedEmptyMedia variant="icon">
                <Upload />
              </AnimatedEmptyMedia>
              <AnimatedEmptyTitle>Drop the files here</AnimatedEmptyTitle>
              <AnimatedEmptyDescription>
                PDF, PNG or JPG, up to 10&nbsp;MB each.
              </AnimatedEmptyDescription>
            </AnimatedEmptyHeader>
            <AnimatedEmptyContent>
              <Button variant="secondary">Choose from disk</Button>
            </AnimatedEmptyContent>
          </AnimatedEmpty>
        </div>
      </Section>

      <Section
        title="The figure breathes"
        hint="float makes the whole drawing —plate, glyph and stamp— float, very slowly and very little. It's off by default: it's useful when the emptiness is the screen's normal state, not when it's the result of a search. With reduced motion it never starts."
      >
        <Hueco className="min-h-80">
          <AnimatedEmpty>
            <AnimatedEmptyHeader>
              <AnimatedEmptyMedia variant="figure" float>
                <Inbox />
              </AnimatedEmptyMedia>
              <AnimatedEmptyTitle>Nothing new</AnimatedEmptyTitle>
              <AnimatedEmptyDescription>
                We'll let you know when something happens.
              </AnimatedEmptyDescription>
            </AnimatedEmptyHeader>
          </AnimatedEmpty>
        </Hueco>
      </Section>

      <Section
        title="Compact"
        hint="Inside a compact SizeProvider the plate, the text and the air all step down — and the footer's button steps down with them, because density travels through context and not through props."
      >
        <SizeProvider size="compact">
          <Hueco className="min-h-56">
            <AnimatedEmpty>
              <AnimatedEmptyHeader>
                <AnimatedEmptyMedia variant="icon">
                  <FolderOpen />
                </AnimatedEmptyMedia>
                <AnimatedEmptyTitle>Empty folder</AnimatedEmptyTitle>
                <AnimatedEmptyDescription>
                  Move something here and it shows up in the list.
                </AnimatedEmptyDescription>
              </AnimatedEmptyHeader>
              <AnimatedEmptyContent>
                <Button variant="secondary">Move files</Button>
              </AnimatedEmptyContent>
            </AnimatedEmpty>
          </Hueco>
        </SizeProvider>
      </Section>

      <Section title="Reference" hint="What each piece exposes.">
        <Snippet>{`AnimatedEmpty
  variant?   "plain" | "dashed"      dashed draws the dotted frame
  size?      "default" | "compact"   and publishes it inwards

AnimatedEmptyHeader     media + title + description, what's read in one go
AnimatedEmptyMedia
  variant?   "default" | "icon" | "figure"
             icon    the small plate, the size of a control
             figure  the big plate, when the emptiness is the whole screen
             default no background, for a custom illustration
  badge?     ReactNode               glyph in the figure's corner; comes in last
  float?     boolean                 the figure floats; off by default
AnimatedEmptyTitle
AnimatedEmptyDescription
AnimatedEmptyContent    the footer: comes in last, it's the way out of the empty

// The entry happens on its own. The exit needs AnimatePresence above:
<AnimatePresence mode="wait" initial={false}>
  {empty && <AnimatedEmpty key={reason}> … </AnimatedEmpty>}
</AnimatePresence>`}</Snippet>
      </Section>
    </div>
  );
}
