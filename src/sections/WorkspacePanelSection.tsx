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
          Restore all {TABS.length}
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
            label: `Document ${n}`,
            icon: FileText,
            content: <Placeholder title={`Document ${n}`} />,
          });
          setN((v) => v + 1);
        }}
      >
        Open a document
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
        Open Avatars
      </Button>

      <span className="text-[12px] text-muted-foreground">
        {tabs.length} open · active: <code>{activeId ?? "—"}</code>
      </span>
    </div>
  );
}

export function WorkspacePanelSection() {
  return (
    <div className="flex flex-col gap-14">
      <Section
        title="Opening from anywhere"
        hint="With WorkspaceProvider the tabs rise to app level. The buttons below aren't inside the panel — they only share the provider — and they open tabs by calling openTab() from the useWorkspace() hook. “Open Avatars” always uses the same id: it doesn't duplicate, it just focuses."
      >
        <WorkspaceProvider defaultTabs={[TABS[0]]}>
          <div className="flex flex-col gap-4">
            <BarraDeAcciones />
            <WorkspaceOutlet className="h-[18rem]" />
          </div>
        </WorkspaceProvider>
      </Section>

      <Section
        title="Closing tabs"
        hint="Hovering a tab reveals its close button — only if more than one is left, because closing the last would leave the panel empty. If you close the active one, its neighbour takes over: the one on the right, or the one on the left if it was the last. The button holds its place from the start, invisible: if it only appeared on hover, the tab would change width and the row would jump under the cursor."
      >
        <CerrablePanel />
      </Section>

      <Section
        title="The panel"
        hint="It sits next to the sidebar and shows the app's content. The active tab isn't a loose pill: it shares a background with the area below and a pair of concave corners joins them, so it's clear the content belongs to that tab."
      >
        <WorkspacePanel tabs={TABS} className="h-[22rem]" />
      </Section>

      <Section
        title="The button on the left"
        hint="It's the one that shows and hides the sidebar — the same useSidebar() WindowControls uses. Press it and watch the panel rearrange itself."
      >
        <p className="text-[13px] text-muted-foreground">
          Its icon follows the state and the side the sidebar is mounted on:
          <code> PanelLeftClose</code> ⇄ <code>PanelLeftOpen</code>, or their
          right-hand equivalents. That's why the component has to live inside a
          <code>SidebarProvider</code>.
        </p>
      </Section>

      <Section
        title="Hover"
        hint="An inactive tab fills with a rounded rectangle; so does the sidebar button. The active one doesn't react to hover: it's already selected, and giving it one more state only adds noise."
      >
        <WorkspacePanel tabs={TABS} defaultValue="avatars" className="h-[18rem]" />
      </Section>

      <Section
        title="How it's used · on its own"
        hint="With no provider, the panel takes its tabs through props. Useful when they're fixed and only whoever renders it knows them."
      >
        <Snippet>{`import { WorkspacePanel } from "@/components/workspace-panel";
import { Box, UserCircle2 } from "lucide-react";

const TABS = [
  { id: "models",  label: "3D Models", icon: Box,         content: <Models /> },
  { id: "avatars", label: "Avatars",   icon: UserCircle2, content: <Avatars /> },
];

<WorkspacePanel tabs={TABS} className="h-full" />`}</Snippet>

        <p className="text-[13px] text-muted-foreground">
          To make them closable as well, the array moves into state and the
          panel reports through <code>onTabClose</code> — it doesn't own the
          list, it only draws it:
        </p>

        <Snippet>{`const [tabs, setTabs] = useState(TABS);

<WorkspacePanel
  tabs={tabs}
  onTabClose={(id) => setTabs((t) => t.filter((x) => x.id !== id))}
/>`}</Snippet>
      </Section>

      <Section
        title="How it's used · with a provider"
        hint="For when any part of the app has to be able to open a tab. The provider raises the state, so nobody needs to thread callbacks through props all the way to the panel."
      >
        <p className="text-[13px] text-muted-foreground">
          Once, as high up as makes sense:
        </p>
        <Snippet>{`import { WorkspaceProvider } from "@/components/workspace-context";

<WorkspaceProvider defaultTabs={[INITIAL]}>
  <App />
</WorkspaceProvider>`}</Snippet>

        <p className="text-[13px] text-muted-foreground">
          Where the panel is drawn — usually just one, next to the sidebar:
        </p>
        <Snippet>{`import { WorkspaceOutlet } from "@/components/workspace-context";

<WorkspaceOutlet className="h-full" />`}</Snippet>

        <p className="text-[13px] text-muted-foreground">
          And from any component below the provider, no matter how far it is
          from the panel:
        </p>
        <Snippet>{`import { useWorkspace } from "@/components/workspace-context";
import { FileText } from "lucide-react";

function OpenDocument({ doc }) {
  const { openTab } = useWorkspace();

  return (
    <button
      onClick={() =>
        openTab({
          id: "doc-" + doc.id,
          label: doc.name,
          icon: FileText,
          content: <Document id={doc.id} />,
        })
      }
    >
      Open
    </button>
  );
}`}</Snippet>
      </Section>

      <Section
        title="Reference"
        hint="What each piece exposes."
      >
        <Snippet>{`WorkspaceTab
  id        string          unique and stable — the active tab resolves by it
  label     string
  icon?     IconComponent   any lucide icon works
  content   ReactNode       what's shown below

WorkspacePanel
  tabs            WorkspaceTab[]
  value?          string          active tab (controlled)
  defaultValue?   string          initial active tab; only read on mount
  onValueChange?  (id) => void
  onTabClose?     (id) => void    without this the close button isn't rendered
  size?           "default" | "compact"
  as?             "div" | "main"  the panel taking the place of the app's
                                  content is its <main>; div by default, because
                                  one page can show several at once

WorkspaceProvider
  defaultTabs?      WorkspaceTab[]
  defaultActiveId?  string

useWorkspace()
  tabs          WorkspaceTab[]
  activeId      string | undefined
  openTab       (tab, { focus? }) => void   repeated id: focuses, doesn't
                                            duplicate
  closeTab      (id) => void                if it was active, the neighbour
                                            takes over
  activateTab   (id) => void`}</Snippet>
      </Section>

      <Section
        title="Compact"
        hint="Inside a compact SizeProvider the bar drops a step: 28px tabs and 12px text, in line with the rest of the controls."
      >
        <SizeProvider size="compact">
          <WorkspacePanel tabs={TABS} className="h-[18rem]" />
        </SizeProvider>
      </Section>
    </div>
  );
}
