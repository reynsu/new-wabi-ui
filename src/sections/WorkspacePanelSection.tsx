import { Box, Compass, UserCircle2 } from "lucide-react";

import { WorkspacePanel } from "@/components/workspace-panel";
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

const TABS = [
  { id: "models", label: "3D Models", icon: Box, content: <Placeholder title="3D Models" /> },
  { id: "avatars", label: "Avatars", icon: UserCircle2, content: <Placeholder title="Avatars" /> },
  { id: "scenes", label: "Scenes", icon: Compass, content: <Placeholder title="Scenes" /> },
];

export function WorkspacePanelSection() {
  return (
    <div className="flex flex-col gap-14">
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
        hint="Una pestaña inactiva revela su silueta al hover, y no es simétrica: se abre hacia abajo sólo por el lado que mira a la activa, encajando contra ella, y cierra el otro con una esquina redondeada. Cambiá de pestaña y el lado de la curva se invierte. La activa no reacciona al hover: ya está seleccionada."
      >
        <WorkspacePanel tabs={TABS} defaultValue="avatars" className="h-[18rem]" />
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
