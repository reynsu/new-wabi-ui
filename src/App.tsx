import { useState } from "react";
import { Boxes, Layers, MessageSquare, Moon, Sliders, Sun, TextCursorInput } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tooltip } from "@/components/ui/tooltip";
import { AgentSection } from "@/sections/AgentSection";
import { ControlsSection } from "@/sections/ControlsSection";
import { InputsSection } from "@/sections/InputsSection";
import { SurfacesSection } from "@/sections/SurfacesSection";
import { SystemSection } from "@/sections/SystemSection";

const PAGES = [
  { id: "controls", label: "Controles", icon: Sliders, count: 12, render: () => <ControlsSection /> },
  { id: "inputs", label: "Entradas", icon: TextCursorInput, count: 5, render: () => <InputsSection /> },
  { id: "surfaces", label: "Superficies", icon: Layers, count: 5, render: () => <SurfacesSection /> },
  { id: "agent", label: "Agente", icon: MessageSquare, count: 4, render: () => <AgentSection /> },
  { id: "system", label: "Sistema", icon: Boxes, count: 4, render: () => <SystemSection /> },
] as const;

export default function App() {
  const [page, setPage] = useState<(typeof PAGES)[number]["id"]>("controls");
  const [dark, setDark] = useState(false);

  const active = PAGES.find((p) => p.id === page)!;

  const toggleTheme = () =>
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });

  return (
    <SidebarProvider defaultOpen className="h-screen overflow-hidden bg-surface-1">
      <Sidebar variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">
              FF
            </div>
            <span className="text-[13px] font-medium">Fluid Functionalism</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Showcase</SidebarGroupLabel>
            <SidebarMenu>
              {PAGES.map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton
                    icon={p.icon}
                    isActive={p.id === page}
                    onClick={() => setPage(p.id)}
                  >
                    {p.label}
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{p.count}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <p className="px-2 py-1 text-[12px] text-muted-foreground">
            30 componentes · Base UI
          </p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-3 border-b border-border px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-[15px] font-medium tracking-tight">{active.label}</h1>
          <div className="ml-auto">
            <Tooltip content={dark ? "Modo claro" : "Modo oscuro"}>
              <Button variant="tertiary" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
                {dark ? <Sun /> : <Moon />}
              </Button>
            </Tooltip>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-10">{active.render()}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
