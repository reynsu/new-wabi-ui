import { useState } from "react";

import { DatePicker, DateTimePicker } from "@/components/calendar";
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

const HOY = new Date();

const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Controlado, para mostrar lo que sale: un solo `Date`, con hora o sin ella. */
function UnDia() {
  const [day, setDay] = useState<Date | null>(addDays(HOY, 2));

  return (
    <div className="flex flex-col gap-3">
      <DatePicker title="Due date" value={day} onValueChange={setDay} />
      <p className="text-[12px] text-muted-foreground">
        {day
          ? new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(day)
          : "—"}
      </p>
    </div>
  );
}

/** La cara con hora. El mismo `Date` lleva las dos mitades de la respuesta. */
function UnMomento() {
  const [moment, setMoment] = useState<Date | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <DateTimePicker
        title="Schedule call"
        label="Day"
        value={moment}
        onValueChange={setMoment}
        timeRange={[9 * 60, 18 * 60]}
      />
      <p className="text-[12px] text-muted-foreground">
        {moment
          ? new Intl.DateTimeFormat("en-US", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(moment)
          : "—"}
      </p>
    </div>
  );
}

export function DatePickerSection() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="DatePicker"
        hint="One end instead of two: no band, no preview, and the counter says what the day is —today, tomorrow, a Saturday— because a single day has no length. Everything else is the same month."
      >
        <UnDia />
      </Section>

      <Section
        title="DateTimePicker"
        hint="Picking the day advances to the hour exactly as the check-in advances to the check-out, and the plane goes with it. The columns are the whole clock —00 to 12, 00 to 59, AM or PM— and what the picker doesn't offer is greyed: here the day runs 9 to 18, so the rest of the hours are out."
      >
        <UnMomento />
      </Section>

      <Section
        title="Times that aren't a step"
        hint="When the times are a list and not a rhythm —departures, showings, the four times a doctor is in— they're passed outright, in minutes from midnight. The clock stays whole; only those four are live."
      >
        <DateTimePicker
          title="Book a viewing"
          label="Day"
          times={[10 * 60, 11 * 60 + 30, 15 * 60, 16 * 60 + 45]}
          presets={false}
        />
      </Section>

      <Section
        title="A clock with twenty-four hours"
        hint="Whether there's a half-of-the-day column is the locale's answer, not a prop: in a 24-hour locale the hours run 0 to 23 and the third column doesn't exist. Same component, same set of times."
      >
        <DateTimePicker
          title="Agendar llamada"
          label="Día"
          timeLabel="Hora"
          hourLabel="Hora"
          minuteLabel="Min"
          placeholder="Elegir día"
          timePlaceholder="Elegir hora"
          clearLabel="Borrar"
          locale="es-ES"
          timeRange={[9 * 60, 18 * 60]}
          presets={false}
        />
      </Section>

      <Section
        title="Just the month"
        hint="Without the fields and without the presets the picker is the grid on its own, with one circle that travels between days."
      >
        <DatePicker
          title="Day"
          fields={false}
          presets={false}
          className="max-w-xs"
        />
      </Section>

      <Section
        title="Compact"
        hint="The same ladder as everything else: inside a SizeProvider the cells, the rows and the type step down together. Left alone the clock is whole and every minute of it can be picked."
      >
        <SizeProvider size="compact">
          <DateTimePicker title="Schedule call" label="Day" />
        </SizeProvider>
      </Section>

      <Section title="How it's used" hint="Un solo Date de ida y de vuelta, con hora o sin ella.">
        <Snippet>{`
<DatePicker value={day} onValueChange={setDay} />

<DateTimePicker
  value={moment}
  onValueChange={setMoment}
  timeRange={[9 * 60, 18 * 60]}
  timeStep={15}
/>
`}</Snippet>
      </Section>
    </div>
  );
}
