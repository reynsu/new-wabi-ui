import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SizeProvider, typeScale, sizeMap, type SizeVariant } from "@/lib/size-context";
import { spring } from "@/lib/springs";
import { Row, Section } from "./Shared";

const RELEASES = Array.from({ length: 24 }, (_, i) => `v1.${23 - i}.0 — maintenance release`);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function SpringTrack({ tier, label }: { tier: keyof typeof spring; label: string }) {
  const [at, setAt] = useState(0);
  const t = spring[tier];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-[12px] text-muted-foreground">
          {t.duration}s · bounce {t.bounce} · exit {t.exit.duration}s
        </span>
      </div>
      <button
        type="button"
        onClick={() => setAt((v) => (v === 0 ? 1 : 0))}
        className="relative h-9 w-full max-w-md rounded-full bg-surface-2 shadow-surface-1"
        aria-label={`Fire the ${label} spring`}
      >
        <motion.span
          className="absolute top-1/2 left-1 h-7 w-7 -translate-y-1/2 rounded-full bg-foreground"
          animate={{ x: at === 0 ? 0 : "calc(28rem - 3rem)" }}
          transition={at === 0 ? { ...t, duration: t.exit.duration } : t}
        />
      </button>
    </div>
  );
}

function SizeSample({ size }: { size: SizeVariant }) {
  return (
    <SizeProvider size={size}>
      <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-4 shadow-surface-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-medium capitalize">{size}</span>
          <span className="text-[12px] text-muted-foreground">{sizeMap[size].controlHeight}px</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button leadingIcon={Calendar}>New</Button>
          <Button variant="tertiary" trailingIcon={Search}>Search</Button>
          <Select defaultValue="a">
            <SelectTrigger className="w-40" placeholder="Filter" />
            <SelectContent>
              <SelectItem index={0} value="a">Last updated</SelectItem>
              <SelectItem index={1} value="b">Created</SelectItem>
            </SelectContent>
          </Select>
          <Badge color="violet">badge</Badge>
        </div>
      </div>
    </SizeProvider>
  );
}

export function SystemSection() {
  return (
    <div className="flex flex-col gap-14">
      <Section title="Motion" hint="Three speeds for everything. Hover and toggles use fast; dropdowns and tabs, moderate; dialogs and drawers, slow. The exit is always one step faster. Click a track to fire it.">
        <div className="flex flex-col gap-6">
          <SpringTrack tier="fast" label="fast" />
          <SpringTrack tier="moderate" label="moderate" />
          <SpringTrack tier="slow" label="slow" />
        </div>
        <p className="text-[12px] text-muted-foreground">
          The tree is wrapped in <code>&lt;MotionConfig reducedMotion="user"&gt;</code>, so with
          reduced-motion on the changes of position disappear and only the fades are left.
        </p>
      </Section>

      <Section title="Sizes" hint="Two steps: 36px by default and 28px compact. Density is a decision of the region — you wrap the block in a SizeProvider and everything inside follows it, menus included.">
        <div className="grid gap-4 md:grid-cols-2">
          <SizeSample size="default" />
          <SizeSample size="compact" />
        </div>

        <div className="max-w-2xl overflow-x-auto">
          <Table size="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Compact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(typeScale) as Array<keyof typeof typeScale>).map((role, i) => (
                <TableRow key={role} index={i}>
                  <TableCell className="capitalize">{role}</TableCell>
                  <TableCell>{typeScale[role].default}px</TableCell>
                  <TableCell>{typeScale[role].compact}px</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section title="Scrollbars" hint="The thumb rests narrow and low-contrast, and widens as you get closer. On top of that goes scroll-fade: a mask that dissolves the content towards whichever edge still has more to scroll.">
        <div className="flex flex-wrap gap-6">
          <div className="w-72 rounded-xl bg-surface-2 p-1 shadow-surface-1">
            <ScrollArea className="h-56" viewportClassName="scroll-fade px-3 py-2">
              <ul className="flex flex-col gap-1">
                {RELEASES.map((r) => (
                  <li key={r} className="py-1.5 text-[13px] text-muted-foreground">{r}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          <div className="w-96 self-start rounded-xl bg-surface-2 p-1 shadow-surface-1">
            <ScrollArea orientation="horizontal" viewportClassName="scroll-fade-x px-3 py-2">
              <div className="flex w-max gap-2">
                {MONTHS.map((m) => (
                  <span key={m} className="rounded-lg bg-surface-3 px-3 py-2 text-[13px] whitespace-nowrap shadow-surface-1">
                    {m}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground">
          On touch devices the component steps aside and leaves the native scroll: the platform's
          physics beats any custom bar.
        </p>
      </Section>

      <Section title="Table" hint="Rows with proximity highlighting; the border withdraws next to the active row.">
        <div className="max-w-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Primitive</TableHead>
                <TableHead>Spring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Dropdown", "@base-ui/react/menu", "moderate"],
                ["Dialog", "@base-ui/react/dialog", "slow"],
                ["Tooltip", "@base-ui/react/tooltip", "fast"],
                ["Select", "@base-ui/react/select", "moderate"],
              ].map(([name, prim, tier], i) => (
                <TableRow key={name} index={i}>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-muted-foreground">{prim}</TableCell>
                  <TableCell><Badge color="gray" size="compact">{tier}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Section title="Reference row">
        <Row>
          <Badge color="teal">30 components</Badge>
          <Badge color="indigo">Base UI</Badge>
          <Badge color="amber">4 system layers</Badge>
        </Row>
      </Section>
    </div>
  );
}
