import { useState } from "react";
import { Box, Compass, FileText, Plus, RotateCcw, UserCircle2 } from "lucide-react";

import { WorkspacePanel } from "@/components/workspace-panel";
import {
  WorkspaceOutlet,
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace-context";
import { Button } from "@/components/ui/button";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "./Shared";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-56 flex-col gap-3 p-6">
      <p className="text-[15px] font-medium">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-xl bg-surface-4 shadow-surface-1"
          />
        ))}
      </div>
    </div>
  );
}

/** Bloque de código. El registry no trae uno, y para cuatro ejemplos no vale
 *  la pena más que esto: monospace sobre surface-2 y scroll horizontal propio,
 *  para que una línea larga no ensanche la página. */
function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-relaxed shadow-surface-1">
      <code className="font-mono">{children.trim()}</code>
    </pre>
  );
}

const TABS = [
  { id: "models", label: "3D Models", icon: Box, content: <Placeholder title="3D Models" /> },
  { id: "avatars", label: "Avatars", icon: UserCircle2, content: <Placeholder title="Avatars" /> },
  { id: "scenes", label: "Scenes", icon: Compass, content: <Placeholder title="Scenes" /> },
];

/** El panel no es dueño de sus pestañas: avisa con onTabClose y quien lo usa
 *  las saca del array. Acá ese array es estado local. */
function CerrablePanel() {
  const [abiertas, setAbiertas] = useState(TABS);

  return (
    <div className="flex flex-col items-start gap-3">
      <WorkspacePanel
        tabs={abiertas}
        onTabClose={(id) => setAbiertas((t) => t.filter((x) => x.id !== id))}
        className="h-[18rem] w-full"
      />
      {abiertas.length < TABS.length && (
        <Button
          variant="tertiary"
          size="compact"
          leadingIcon={RotateCcw}
          onClick={() => setAbiertas(TABS)}
        >
          Restaurar las {TABS.length}
        </Button>
      )}
    </div>
  );
}

/** Vive FUERA del panel y ni siquiera es hermano suyo: sólo comparte el
 *  provider. Es todo lo que hace falta para abrir una pestaña desde cualquier
 *  punto del árbol. */
function BarraDeAcciones() {
  const { openTab, tabs, activeId } = useWorkspace();
  const [n, setN] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        leadingIcon={Plus}
        size="compact"
        onClick={() => {
          openTab({
            id: `doc-${n}`,
            label: `Documento ${n}`,
            icon: FileText,
            content: <Placeholder title={`Documento ${n}`} />,
          });
          setN((v) => v + 1);
        }}
      >
        Abrir documento
      </Button>

      <Button
        variant="tertiary"
        size="compact"
        onClick={() =>
          openTab({
            id: "avatars",
            label: "Avatars",
            icon: UserCircle2,
            content: <Placeholder title="Avatars" />,
          })
        }
      >
        Abrir Avatars
      </Button>

      <span className="text-[12px] text-muted-foreground">
        {tabs.length} abiertas · activa: <code>{activeId ?? "—"}</code>
      </span>
    </div>
  );
}

export function WorkspacePanelSection() {
  return (
    <div className="flex flex-col gap-14">
      <Section
        title="Abrir desde cualquier parte"
        hint="Con WorkspaceProvider las pestañas suben al nivel de la app. Los botones de abajo no están dentro del panel — sólo comparten el provider — y abren pestañas llamando a openTab() del hook useWorkspace(). «Abrir Avatars» usa siempre el mismo id: no duplica, sólo la enfoca."
      >
        <WorkspaceProvider defaultTabs={[TABS[0]]}>
          <div className="flex flex-col gap-4">
            <BarraDeAcciones />
            <WorkspaceOutlet className="h-[18rem]" />
          </div>
        </WorkspaceProvider>
      </Section>

      <Section
        title="Cerrar pestañas"
        hint="Al pasar el cursor sobre una pestaña aparece su botón de cerrar — sólo si queda más de una, porque cerrar la última dejaría el panel vacío. Si cerrás la activa, el relevo lo toma su vecina: la de la derecha, o la de la izquierda si era la última. El botón ocupa su sitio desde el principio, invisible: si apareciera recién al hover, la pestaña cambiaría de ancho y la fila saltaría bajo el cursor."
      >
        <CerrablePanel />
      </Section>

      <Section
        title="El panel"
        hint="Va al lado del sidebar y muestra el contenido de la app. La pestaña activa no es una píldora suelta: comparte fondo con el área de abajo y las une un par de esquinas cóncavas, así queda claro que el contenido es el de esa pestaña."
      >
        <WorkspacePanel tabs={TABS} className="h-[22rem]" />
      </Section>

      <Section
        title="El botón de la izquierda"
        hint="Es el que muestra y oculta el sidebar — el mismo useSidebar() que usa WindowControls. Pulsalo y mirá cómo se recoloca el panel."
      >
        <p className="text-[13px] text-muted-foreground">
          Su icono sigue al estado y al lado en el que esté montado el sidebar:
          <code> PanelLeftClose</code> ⇄ <code>PanelLeftOpen</code>, o sus
          equivalentes de la derecha. Por eso el componente tiene que vivir
          dentro de un <code>SidebarProvider</code>.
        </p>
      </Section>

      <Section
        title="Hover"
        hint="Una pestaña inactiva se rellena con un rectángulo redondeado; el botón del sidebar, igual. La activa no reacciona al hover: ya está seleccionada, y darle un estado más sólo agrega ruido."
      >
        <WorkspacePanel tabs={TABS} defaultValue="avatars" className="h-[18rem]" />
      </Section>

      <Section
        title="Cómo se usa · suelto"
        hint="Sin provider, el panel recibe sus pestañas por props. Sirve cuando son fijas y sólo las conoce quien lo renderiza."
      >
        <Snippet>{`import { WorkspacePanel } from "@/components/workspace-panel";
import { Box, UserCircle2 } from "lucide-react";

const TABS = [
  { id: "models",  label: "3D Models", icon: Box,         content: <Models /> },
  { id: "avatars", label: "Avatars",   icon: UserCircle2, content: <Avatars /> },
];

<WorkspacePanel tabs={TABS} className="h-full" />`}</Snippet>

        <p className="text-[13px] text-muted-foreground">
          Para que además se puedan cerrar, el array pasa a estado y el panel
          avisa por <code>onTabClose</code> — no es dueño de la lista, sólo la
          dibuja:
        </p>

        <Snippet>{`const [tabs, setTabs] = useState(TABS);

<WorkspacePanel
  tabs={tabs}
  onTabClose={(id) => setTabs((t) => t.filter((x) => x.id !== id))}
/>`}</Snippet>
      </Section>

      <Section
        title="Cómo se usa · con provider"
        hint="Cuando cualquier parte de la app tiene que poder abrir una pestaña. El provider sube el estado, y así nadie necesita pasarse callbacks por props hasta llegar al panel."
      >
        <p className="text-[13px] text-muted-foreground">
          Una vez, lo más arriba que tenga sentido:
        </p>
        <Snippet>{`import { WorkspaceProvider } from "@/components/workspace-context";

<WorkspaceProvider defaultTabs={[INICIAL]}>
  <App />
</WorkspaceProvider>`}</Snippet>

        <p className="text-[13px] text-muted-foreground">
          Donde el panel se dibuja — normalmente uno solo, al lado del sidebar:
        </p>
        <Snippet>{`import { WorkspaceOutlet } from "@/components/workspace-context";

<WorkspaceOutlet className="h-full" />`}</Snippet>

        <p className="text-[13px] text-muted-foreground">
          Y desde cualquier componente por debajo del provider, sin importar
          cuán lejos esté del panel:
        </p>
        <Snippet>{`import { useWorkspace } from "@/components/workspace-context";
import { FileText } from "lucide-react";

function AbrirDocumento({ doc }) {
  const { openTab } = useWorkspace();

  return (
    <button
      onClick={() =>
        openTab({
          id: "doc-" + doc.id,
          label: doc.nombre,
          icon: FileText,
          content: <Documento id={doc.id} />,
        })
      }
    >
      Abrir
    </button>
  );
}`}</Snippet>
      </Section>

      <Section
        title="Referencia"
        hint="Lo que expone cada pieza."
      >
        <Snippet>{`WorkspaceTab
  id        string          único y estable — con él se resuelve la activa
  label     string
  icon?     IconComponent   cualquier icono de lucide sirve
  content   ReactNode       lo que se muestra abajo

WorkspacePanel
  tabs            WorkspaceTab[]
  value?          string          activa (controlado)
  defaultValue?   string          activa inicial; sólo se lee al montar
  onValueChange?  (id) => void
  onTabClose?     (id) => void    sin esto no se renderiza el botón de cerrar
  size?           "default" | "compact"

WorkspaceProvider
  defaultTabs?      WorkspaceTab[]
  defaultActiveId?  string

useWorkspace()
  tabs          WorkspaceTab[]
  activeId      string | undefined
  openTab       (tab, { focus? }) => void   id repetido: enfoca, no duplica
  closeTab      (id) => void                si era la activa, pasa a la vecina
  activateTab   (id) => void`}</Snippet>
      </Section>

      <Section
        title="Compacto"
        hint="Dentro de un SizeProvider compacto la barra baja un escalón: pestañas de 28px y texto de 12px, en línea con el resto de los controles."
      >
        <SizeProvider size="compact">
          <WorkspacePanel tabs={TABS} className="h-[18rem]" />
        </SizeProvider>
      </Section>
    </div>
  );
}
