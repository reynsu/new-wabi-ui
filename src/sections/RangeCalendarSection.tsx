import { useState } from "react";

import { RangeCalendar, type DateRange, type RangePreset } from "@/components/calendar";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "./Shared";

/** Bloque de código, igual que en las otras páginas propias. */
function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-relaxed shadow-surface-1">
      <code className="font-mono">{children.trim()}</code>
    </pre>
  );
}

/* La demo arranca con el check-in puesto y el check-out abierto, que es el
   estado donde el componente muestra todo lo que sabe hacer: la banda sigue al
   puntero, el contador cuenta y el subrayado ya está en el campo de la derecha.
   El mes de la demo es fijo —septiembre— para que el ejemplo no dependa de
   cuándo se lo mire. */
const HOY = new Date();
const SEPTIEMBRE = new Date(HOY.getFullYear(), 8, 1);
const CHECK_IN = new Date(HOY.getFullYear(), 8, 5);

const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** El rango de un reporte: los mismos dos extremos contando otra cosa. Cuenta
 *  días y no noches, mira para atrás y sus atajos son los de un tablero. */
const ATAJOS_REPORTE: RangePreset[] = [
  {
    label: "Last 7 days",
    range: () => ({ start: addDays(HOY, -6), end: HOY }),
  },
  {
    label: "Last 30 days",
    range: () => ({ start: addDays(HOY, -29), end: HOY }),
  },
  {
    label: "This month",
    range: () => ({
      start: new Date(HOY.getFullYear(), HOY.getMonth(), 1),
      end: HOY,
    }),
  },
];

/** Controlado, para mostrar lo que sale del componente mientras se lo usa. */
function Viaje() {
  const [range, setRange] = useState<DateRange>({ start: CHECK_IN, end: null });

  const format = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d) : "—";

  return (
    <div className="flex flex-col gap-3">
      <RangeCalendar
        title="Trip Dates"
        value={range}
        onValueChange={setRange}
        defaultMonth={SEPTIEMBRE}
        minDate={null}
      />
      <p className="text-[12px] text-muted-foreground">
        {format(range.start)} → {format(range.end)}
      </p>
    </div>
  );
}

export function RangeCalendarSection() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="RangeCalendar"
        hint="Picking a stay, not two dates: the month, the two fields and the presets say the same thing three ways. Hover the grid with the check-out open — the band grows to the day under the pointer and the counter reads it."
      >
        <Viaje />
      </Section>

      <Section
        title="Just the month"
        hint="Without the fields and without the presets it's the grid on its own — the shape to drop inside a popover that already has its own trigger and its own footer."
      >
        <RangeCalendar
          title="Stay"
          fields={false}
          presets={false}
          defaultMonth={SEPTIEMBRE}
          className="max-w-xs"
        />
      </Section>

      <Section
        title="Another thing to count"
        hint="The same two ends counting days instead of nights, reaching backwards and with a dashboard's shortcuts. Nothing about the range is specific to a trip: what's specific is the unit and the presets, and both are props."
      >
        <RangeCalendar
          title="Report range"
          startLabel="From"
          endLabel="To"
          placeholder="Pick a day"
          countLabel={(n) => `${n + 1} ${n === 0 ? "day" : "days"}`}
          presets={ATAJOS_REPORTE}
          minDate={null}
          maxDate={HOY}
        />
      </Section>

      <Section
        title="Compact"
        hint="Inside a SizeProvider the whole thing steps down together — the cells, the type and the chips. It's the same ladder every control in the system rides."
      >
        <SizeProvider size="compact">
          <RangeCalendar title="Trip Dates" defaultMonth={SEPTIEMBRE} minDate={null} />
        </SizeProvider>
      </Section>

      <Section title="How it's used" hint="Uncontrolled it needs nothing; controlled it's a value and its setter.">
        <Snippet>{`
<RangeCalendar
  title="Trip Dates"
  value={range}
  onValueChange={setRange}
  countLabel={(n) => \`\${n} \${n === 1 ? "night" : "nights"}\`}
/>
`}</Snippet>
      </Section>
    </div>
  );
}
