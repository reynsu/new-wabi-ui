import { useState } from "react";
import {
  Bell,
  Palette,
  PanelRight,
  PenSquare,
  MoreHorizontal,
  Rocket,
  Search,
  Sparkles,
  Users,
  Copy,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group";
import {
  Dropdown,
  DropdownContent,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TabItem, TabPanel, Tabs, TabsList } from "@/components/ui/tabs";
import { TabsSubtle, TabsSubtleItem, TabsSubtlePanel } from "@/components/ui/tabs-subtle";
import { Tooltip } from "@/components/ui/tooltip";
import { TravelTooltip, TravelTooltipItem } from "@/components/travel-tooltip";
import { Row, Section } from "./Shared";

const BADGE_COLORS = ["green", "amber", "rose", "blue", "violet", "teal"] as const;

export function ControlsSection() {
  const [checked, setChecked] = useState(new Set([0, 2]));
  const [radio, setRadio] = useState(1);
  const [tabsSubtle, setTabsSubtle] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [density, setDensity] = useState(60);
  const [range, setRange] = useState<[number, number]>([20, 70]);
  const [menuChecked, setMenuChecked] = useState(0);

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col gap-14">
      <Section title="Button" hint="Cuatro variantes, dos pasos de la escalera de tamaños, iconos y estado de carga.">
        <Row>
          <Button leadingIcon={Sparkles}>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="tertiary" trailingIcon={Search}>Terciario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Cargando</Button>
          <Button size="icon" variant="tertiary" aria-label="Buscar">
            <Search />
          </Button>
          <Button size="compact" variant="tertiary">Compact</Button>
          <Button disabled>Deshabilitado</Button>
        </Row>
      </Section>

      <Section title="Badge" hint="Variante sólida y de punto, sobre la paleta Tailwind.">
        <Row>
          {BADGE_COLORS.map((c) => (
            <Badge key={c} color={c}>{c}</Badge>
          ))}
          <Badge color="amber" variant="dot">pendiente</Badge>
          <Badge color="blue" size="compact">compact</Badge>
        </Row>
      </Section>

      <Section title="Tabs" hint="El indicador viaja con spring.moderate y salta de forma optimista al hacer click.">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabItem value="overview" label="Resumen" icon={Sparkles} />
            <TabItem value="team" label="Equipo" icon={Users} />
            <TabItem value="alerts" label="Alertas" icon={Bell} />
          </TabsList>
          <TabPanel value="overview" className="pt-4 text-[13px] text-muted-foreground">
            Pasá el cursor entre pestañas — el resalte sigue al puntero antes del click.
          </TabPanel>
          <TabPanel value="team" className="pt-4 text-[13px] text-muted-foreground">
            Tres personas en este espacio de trabajo.
          </TabPanel>
          <TabPanel value="alerts" className="pt-4 text-[13px] text-muted-foreground">
            Sin alertas abiertas.
          </TabPanel>
        </Tabs>
      </Section>

      <Section title="TabsSubtle" hint="La variante sin fondo: con activeLabel sólo la pestaña activa muestra su texto.">
        <TabsSubtle selectedIndex={tabsSubtle} onSelect={setTabsSubtle} idPrefix="subtle" activeLabel>
          <TabsSubtleItem index={0} label="Diseño" icon={Palette} />
          <TabsSubtleItem index={1} label="Equipo" icon={Users} />
          <TabsSubtleItem index={2} label="Deploy" icon={Rocket} />
        </TabsSubtle>
        <TabsSubtlePanel index={0} selectedIndex={tabsSubtle} idPrefix="subtle" className="text-[13px] text-muted-foreground">
          Tokens, radios y superficies.
        </TabsSubtlePanel>
        <TabsSubtlePanel index={1} selectedIndex={tabsSubtle} idPrefix="subtle" className="text-[13px] text-muted-foreground">
          Permisos e invitaciones.
        </TabsSubtlePanel>
        <TabsSubtlePanel index={2} selectedIndex={tabsSubtle} idPrefix="subtle" className="text-[13px] text-muted-foreground">
          Pipeline del registry.
        </TabsSubtlePanel>
      </Section>

      <Section title="Select · Dropdown · Tooltip" hint="El popup se eleva sobre su sustrato y sus filas comparten altura con el trigger.">
        <Row>
          <Select defaultValue="moderate">
            <SelectTrigger className="w-52" placeholder="Elegí un spring" />
            <SelectContent>
              <SelectItem index={0} value="fast">Fast · 0.08s</SelectItem>
              <SelectItem index={1} value="moderate">Moderate · 0.16s</SelectItem>
              <SelectItem index={2} value="slow">Slow · 0.24s</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownTrigger render={<Button variant="tertiary" trailingIcon={Sparkles} />}>
              Acciones
            </DropdownTrigger>
            <DropdownContent checkedIndex={menuChecked}>
              <DropdownLabel>Ordenar por</DropdownLabel>
              <MenuItem index={0} label="Más reciente" checked={menuChecked === 0} onSelect={() => setMenuChecked(0)} />
              <MenuItem index={1} label="Alfabético" checked={menuChecked === 1} onSelect={() => setMenuChecked(1)} />
              <DropdownSeparator />
              <MenuItem index={2} icon={Search} label="Buscar en el registry" />
            </DropdownContent>
          </DropdownMenu>

          <Tooltip content="Sigue al cursor sobre triggers anchos" followCursor="x">
            <Button variant="ghost">Hover para tooltip</Button>
          </Tooltip>
        </Row>

        <div className="max-w-xs">
          <Dropdown checkedIndex={menuChecked}>
            <DropdownLabel>Panel inline (mismo componente, sin portal)</DropdownLabel>
            <MenuItem index={0} label="Más reciente" checked={menuChecked === 0} onSelect={() => setMenuChecked(0)} />
            <MenuItem index={1} label="Alfabético" checked={menuChecked === 1} onSelect={() => setMenuChecked(1)} />
          </Dropdown>
        </div>
      </Section>

      <Section
        title="TravelTooltip"
        hint="Componente propio, no del registry. Una sola píldora para todo el grupo: al pasar de un botón al vecino se traslada y ajusta su ancho al texto nuevo en vez de desaparecer y reaparecer. El caret llega antes que el cuerpo."
      >
        <div className="flex w-full justify-end pb-16">
          <div className="rounded-full bg-surface-3 p-1 shadow-surface-2">
            <TravelTooltip side="bottom">
              <TravelTooltipItem label="Nueva nota">
                <Button variant="ghost" size="icon" aria-label="Nueva nota">
                  <PenSquare />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Usar ventana flotante">
                <Button variant="ghost" size="icon" aria-label="Usar ventana flotante">
                  <Copy />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Más…">
                <Button variant="ghost" size="icon" aria-label="Más opciones">
                  <MoreHorizontal />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Alternar panel lateral">
                <Button variant="ghost" size="icon" aria-label="Alternar panel lateral">
                  <PanelRight />
                </Button>
              </TravelTooltipItem>
            </TravelTooltip>
          </div>
        </div>
      </Section>

      <Section title="Switch · Slider" hint="El thumb del switch se estira al hover y se aplasta al presionar; el slider acepta valor simple o rango.">
        <Row>
          <Switch label="Notificaciones" checked={notifications} onToggle={() => setNotifications((v) => !v)} />
          <Switch label="Compacto" checked={false} onToggle={() => {}} disabled />
        </Row>
        <div className="flex max-w-sm flex-col gap-6">
          <Slider label="Densidad" value={density} onChange={(v) => setDensity(v as number)} min={0} max={100} />
          <Slider
            label="Rango"
            value={range}
            onChange={(v) => setRange(v as [number, number])}
            min={0}
            max={100}
            showValue
          />
        </div>
      </Section>

      <Section title="CheckboxGroup · RadioGroup" hint="Las selecciones contiguas funden su fondo en una sola pieza (use-merge-split).">
        <div className="flex flex-wrap gap-10">
          <CheckboxGroup checkedIndices={checked} className="w-64">
            {["Motion", "Scrollbars", "Sizes", "Surfaces"].map((label, i) => (
              <CheckboxItem key={label} index={i} label={label} checked={checked.has(i)} onToggle={() => toggle(i)} />
            ))}
          </CheckboxGroup>

          <RadioGroup selectedIndex={radio} className="w-64">
            {["Fast spring", "Moderate spring", "Slow spring", "Sin animación"].map((label, i) => (
              <RadioItem key={label} index={i} label={label} selected={radio === i} onSelect={() => setRadio(i)} />
            ))}
          </RadioGroup>
        </div>
      </Section>

      <Section title="Accordion" hint="La altura se anima a un valor medido, no a height:auto — no sobrepasa bajo un ancestro escalado.">
        <AccordionGroup type="single" defaultValue="a" className="max-w-lg">
          <Accordion type="single" collapsible defaultValue="a">
            <AccordionItem value="a" index={0}>
              <AccordionTrigger>¿Qué instala el registry?</AccordionTrigger>
              <AccordionContent className="text-[13px] text-muted-foreground">
                El código fuente de cada componente, más los libs y hooks del sistema.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b" index={1}>
              <AccordionTrigger>¿Y las primitivas?</AccordionTrigger>
              <AccordionContent className="text-[13px] text-muted-foreground">
                Este proyecto usa el sabor Base UI de cada componente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionGroup>
      </Section>
    </div>
  );
}
