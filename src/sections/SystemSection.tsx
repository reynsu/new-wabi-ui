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

const RELEASES = Array.from({ length: 24 }, (_, i) => `v1.${23 - i}.0 — release de mantenimiento`);

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function SpringTrack({ tier, label }: { tier: keyof typeof spring; label: string }) {
  const [at, setAt] = useState(0);
  const t = spring[tier];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-[12px] text-muted-foreground">
          {t.duration}s · bounce {t.bounce} · salida {t.exit.duration}s
        </span>
      </div>
      <button
        type="button"
        onClick={() => setAt((v) => (v === 0 ? 1 : 0))}
        className="relative h-9 w-full max-w-md rounded-full bg-surface-2 shadow-surface-1"
        aria-label={`Disparar el spring ${label}`}
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
          <Button leadingIcon={Calendar}>Nuevo</Button>
          <Button variant="tertiary" trailingIcon={Search}>Buscar</Button>
          <Select defaultValue="a">
            <SelectTrigger className="w-40" placeholder="Filtrar" />
            <SelectContent>
              <SelectItem index={0} value="a">Última actualización</SelectItem>
              <SelectItem index={1} value="b">Creación</SelectItem>
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
      <Section title="Motion" hint="Tres velocidades para todo. Hover y toggles usan fast; dropdowns y tabs, moderate; diálogos y drawers, slow. La salida siempre es un escalón más rápida. Click en una pista para dispararla.">
        <div className="flex flex-col gap-6">
          <SpringTrack tier="fast" label="fast" />
          <SpringTrack tier="moderate" label="moderate" />
          <SpringTrack tier="slow" label="slow" />
        </div>
        <p className="text-[12px] text-muted-foreground">
          El árbol está envuelto en <code>&lt;MotionConfig reducedMotion="user"&gt;</code>, así que con
          reduced-motion activo desaparecen los cambios de posición y sólo quedan los fades.
        </p>
      </Section>

      <Section title="Sizes" hint="Dos escalones: 36px por defecto y 28px compacto. La densidad es una decisión de región — envolvés el bloque en un SizeProvider y todo lo de adentro lo sigue, menús incluidos.">
        <div className="grid gap-4 md:grid-cols-2">
          <SizeSample size="default" />
          <SizeSample size="compact" />
        </div>

        <div className="max-w-2xl overflow-x-auto">
          <Table size="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
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

      <Section title="Scrollbars" hint="El thumb descansa angosto y de bajo contraste, y se ensancha al acercarte. Encima va scroll-fade: una máscara que disuelve el contenido hacia el borde que todavía tiene más para scrollear.">
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
          En dispositivos táctiles el componente se aparta y deja el scroll nativo: la física de la
          plataforma le gana a cualquier barra custom.
        </p>
      </Section>

      <Section title="Table" hint="Filas con resalte por proximidad; el borde se retira junto a la fila activa.">
        <div className="max-w-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Primitiva</TableHead>
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

      <Section title="Row de referencia">
        <Row>
          <Badge color="teal">30 componentes</Badge>
          <Badge color="indigo">Base UI</Badge>
          <Badge color="amber">4 capas de sistema</Badge>
        </Row>
      </Section>
    </div>
  );
}
