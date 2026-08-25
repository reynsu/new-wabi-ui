import { useState } from "react";
import { Bell, Palette, Rocket, Search, Sparkles, Users } from "lucide-react";

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
      <Section title="Button" hint="Four variants, two steps of the size ladder, icons and a loading state.">
        <Row>
          <Button leadingIcon={Sparkles}>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary" trailingIcon={Search}>Tertiary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button size="icon" variant="tertiary" aria-label="Search">
            <Search />
          </Button>
          <Button size="compact" variant="tertiary">Compact</Button>
          <Button disabled>Disabled</Button>
        </Row>
      </Section>

      <Section title="Badge" hint="Solid and dot variants, over the Tailwind palette.">
        <Row>
          {BADGE_COLORS.map((c) => (
            <Badge key={c} color={c}>{c}</Badge>
          ))}
          <Badge color="amber" variant="dot">pending</Badge>
          <Badge color="blue" size="compact">compact</Badge>
        </Row>
      </Section>

      <Section title="Tabs" hint="The indicator travels with spring.moderate and jumps optimistically on click.">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabItem value="overview" label="Overview" icon={Sparkles} />
            <TabItem value="team" label="Team" icon={Users} />
            <TabItem value="alerts" label="Alerts" icon={Bell} />
          </TabsList>
          <TabPanel value="overview" className="pt-4 text-[13px] text-muted-foreground">
            Move the cursor across the tabs — the highlight follows the pointer before the click.
          </TabPanel>
          <TabPanel value="team" className="pt-4 text-[13px] text-muted-foreground">
            Three people in this workspace.
          </TabPanel>
          <TabPanel value="alerts" className="pt-4 text-[13px] text-muted-foreground">
            No open alerts.
          </TabPanel>
        </Tabs>
      </Section>

      <Section title="TabsSubtle" hint="The backgroundless variant: with activeLabel only the active tab shows its text.">
        <TabsSubtle selectedIndex={tabsSubtle} onSelect={setTabsSubtle} idPrefix="subtle" activeLabel>
          <TabsSubtleItem index={0} label="Design" icon={Palette} />
          <TabsSubtleItem index={1} label="Team" icon={Users} />
          <TabsSubtleItem index={2} label="Deploy" icon={Rocket} />
        </TabsSubtle>
        <TabsSubtlePanel index={0} selectedIndex={tabsSubtle} idPrefix="subtle" className="text-[13px] text-muted-foreground">
          Tokens, radii and surfaces.
        </TabsSubtlePanel>
        <TabsSubtlePanel index={1} selectedIndex={tabsSubtle} idPrefix="subtle" className="text-[13px] text-muted-foreground">
          Permissions and invitations.
        </TabsSubtlePanel>
        <TabsSubtlePanel index={2} selectedIndex={tabsSubtle} idPrefix="subtle" className="text-[13px] text-muted-foreground">
          The registry's pipeline.
        </TabsSubtlePanel>
      </Section>

      <Section title="Select · Dropdown · Tooltip" hint="The popup rises over its substrate and its rows share their height with the trigger.">
        <Row>
          <Select defaultValue="moderate">
            <SelectTrigger className="w-52" placeholder="Pick a spring" />
            <SelectContent>
              <SelectItem index={0} value="fast">Fast · 0.08s</SelectItem>
              <SelectItem index={1} value="moderate">Moderate · 0.16s</SelectItem>
              <SelectItem index={2} value="slow">Slow · 0.24s</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownTrigger render={<Button variant="tertiary" trailingIcon={Sparkles} />}>
              Actions
            </DropdownTrigger>
            <DropdownContent checkedIndex={menuChecked}>
              <DropdownLabel>Sort by</DropdownLabel>
              <MenuItem index={0} label="Most recent" checked={menuChecked === 0} onSelect={() => setMenuChecked(0)} />
              <MenuItem index={1} label="Alphabetical" checked={menuChecked === 1} onSelect={() => setMenuChecked(1)} />
              <DropdownSeparator />
              <MenuItem index={2} icon={Search} label="Search the registry" />
            </DropdownContent>
          </DropdownMenu>

          <Tooltip content="It follows the cursor over wide triggers" followCursor="x">
            <Button variant="ghost">Hover for a tooltip</Button>
          </Tooltip>
        </Row>

        <div className="max-w-xs">
          <Dropdown checkedIndex={menuChecked}>
            <DropdownLabel>Inline panel (same component, no portal)</DropdownLabel>
            <MenuItem index={0} label="Most recent" checked={menuChecked === 0} onSelect={() => setMenuChecked(0)} />
            <MenuItem index={1} label="Alphabetical" checked={menuChecked === 1} onSelect={() => setMenuChecked(1)} />
          </Dropdown>
        </div>
      </Section>

      <Section title="Switch · Slider" hint="The switch's thumb stretches on hover and squashes on press; the slider takes a single value or a range.">
        <Row>
          <Switch label="Notifications" checked={notifications} onToggle={() => setNotifications((v) => !v)} />
          <Switch label="Compact" checked={false} onToggle={() => {}} disabled />
        </Row>
        <div className="flex max-w-sm flex-col gap-6">
          <Slider label="Density" value={density} onChange={(v) => setDensity(v as number)} min={0} max={100} />
          <Slider
            label="Range"
            value={range}
            onChange={(v) => setRange(v as [number, number])}
            min={0}
            max={100}
            showValue
          />
        </div>
      </Section>

      <Section title="CheckboxGroup · RadioGroup" hint="Contiguous selections merge their background into a single piece (use-merge-split).">
        <div className="flex flex-wrap gap-10">
          <CheckboxGroup checkedIndices={checked} className="w-64">
            {["Motion", "Scrollbars", "Sizes", "Surfaces"].map((label, i) => (
              <CheckboxItem key={label} index={i} label={label} checked={checked.has(i)} onToggle={() => toggle(i)} />
            ))}
          </CheckboxGroup>

          <RadioGroup selectedIndex={radio} className="w-64">
            {["Fast spring", "Moderate spring", "Slow spring", "No animation"].map((label, i) => (
              <RadioItem key={label} index={i} label={label} selected={radio === i} onSelect={() => setRadio(i)} />
            ))}
          </RadioGroup>
        </div>
      </Section>

      <Section title="Accordion" hint="The height animates to a measured value, not to height:auto — it doesn't overshoot under a scaled ancestor.">
        <AccordionGroup type="single" defaultValue="a" className="max-w-lg">
          <Accordion type="single" collapsible defaultValue="a">
            <AccordionItem value="a" index={0}>
              <AccordionTrigger>What does the registry install?</AccordionTrigger>
              <AccordionContent className="text-[13px] text-muted-foreground">
                Each component's source code, plus the system's libs and hooks.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b" index={1}>
              <AccordionTrigger>And the primitives?</AccordionTrigger>
              <AccordionContent className="text-[13px] text-muted-foreground">
                This project uses the Base UI flavour of each component.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionGroup>
      </Section>
    </div>
  );
}
