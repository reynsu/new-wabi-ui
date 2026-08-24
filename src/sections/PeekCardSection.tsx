import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import {
  ChartLine,
  HandHeart,
  HeartPlus,
  History,
  Target,
  UserRound,
  VenetianMask,
  Wallet,
} from "lucide-react";

import { PeekCard, type PeekCardTab } from "@/components/peek-card";
import { Button } from "@/components/ui/button";
import type { IconComponent } from "@/lib/icon-context";
import { SizeProvider } from "@/lib/size-context";
import { cn } from "@/lib/utils";
import { Section } from "./Shared";

/* El bloque de la izquierda del card: un ícono en un disco de color, la
   etiqueta arriba y el número abajo. Dos de estos entran en un renglón de 320. */
function Stat({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: IconComponent;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: tint }}
      >
        <Icon size={16} strokeWidth={1.75} className="text-foreground" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[12px] text-muted-foreground">{label}</span>
        <span className="truncate text-[15px] font-medium">{value}</span>
      </span>
    </div>
  );
}

/* Las tres pestañas miden distinto a propósito: es lo que hace visible que el
   alto del card viaja en vez de saltar. El contenido en sí no es el punto —
   cambia con cada implementación. */
const MONTHS = [
  { label: "Feb", publico: 22, anonimo: 38 },
  { label: "Mar", publico: 34, anonimo: 62 },
  { label: "Abr", publico: 48, anonimo: 74 },
  { label: "May", publico: 92, anonimo: 55 },
  { label: "Jun", publico: 70, anonimo: 34 },
  { label: "Jul", publico: 41, anonimo: 22 },
];

const TABS: PeekCardTab[] = [
  {
    label: "Resumen",
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Stat
            icon={UserRound}
            tint="color-mix(in oklab, #f59e0b 22%, transparent)"
            label="Público"
            value="$38.000"
          />
          <Stat
            icon={VenetianMask}
            tint="color-mix(in oklab, #6b97ff 22%, transparent)"
            label="Anónimo"
            value="$45.000"
          />
        </div>
        <p className="text-[13px] text-muted-foreground">
          142 aportes en los últimos seis meses.
        </p>
      </div>
    ),
  },
  {
    label: "Meta",
    content: (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted-foreground">Meta del año</span>
          <span className="text-[13px] font-medium">$83.000 / $120.000</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-[69%] rounded-full bg-foreground" />
        </div>
        <p className="text-[13px] text-muted-foreground">
          Faltan $37.000 y quedan cinco meses.
        </p>
      </div>
    ),
  },
  {
    label: "Estadísticas",
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            Público
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6b97ff]" />
            Anónimo
          </span>
        </div>
        <div className="flex h-24 items-end gap-2">
          {MONTHS.map((month) => (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-20 w-full items-end justify-center gap-1">
                <span
                  className="w-1.5 rounded-full bg-[#f59e0b]"
                  style={{ height: `${month.publico}%` }}
                />
                <span
                  className="w-1.5 rounded-full bg-[#6b97ff]"
                  style={{ height: `${month.anonimo}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{month.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const ACTION = (
  <Button variant="tertiary" size="compact" leadingIcon={HeartPlus}>
    Donar
  </Button>
);

const FOOTER = (
  <Button variant="tertiary" leadingIcon={History} className="w-full">
    Ver el historial
  </Button>
);

/* Un avatar cualquiera como disparador: el hover no necesita que lo que
   dispara sea un botón, pero sí que se pueda alcanzar con el teclado, así que
   sigue siendo un `<button>`.

   Reenvía props y ref porque es el trigger: ahí es donde `PeekCard` cuelga el
   hover, el clic y el ancla. Un componente propio que no las pase deja la
   tarjeta sin nada que la abra — un elemento suelto en el JSX no tiene el
   problema, porque ahí las props llegan al nodo directo. */
const Avatar = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & { initials: string }
>(({ initials, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={`Perfil de ${initials}`}
    className={cn(
      "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface-3 text-[12px] font-medium shadow-surface-2 outline-none transition-shadow duration-100 hover:shadow-surface-3 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]",
      className
    )}
    {...props}
  >
    {initials}
  </button>
));

Avatar.displayName = "Avatar";

export function PeekCardSection() {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="El gesto"
        hint="Un botón abre el card pegado a él. Adentro está el reparto del InsetDialog: el título con su acción y el riel de Tabs en el marco, y el cuerpo de la pestaña embutido en su propia tarjeta. Cambiar de pestaña cruza lo de adentro y lleva el alto a la medida de la que entra, así el borde de abajo no salta contra el ancla."
      >
        <div className="flex">
          <PeekCard
            title="Perfil de donación"
            icon={HandHeart}
            action={ACTION}
            footer={FOOTER}
            tabs={TABS}
          >
            <Button variant="secondary" leadingIcon={Wallet}>
              Ver el perfil
            </Button>
          </PeekCard>
        </div>
      </Section>

      <Section
        title="El otro gesto"
        hint="El mismo card con openOn=&quot;hover&quot;: aparece al pasar por encima y espera 120ms al salir, que es lo que tarda el puntero en cruzar el hueco hasta el card. El foco no se mueve — sólo entra si lo abrió el teclado."
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            {[
              { initials: "CF", title: "Camila Ferreyra" },
              { initials: "BS", title: "Bruno Salas" },
              { initials: "LO", title: "Lucía Otero" },
            ].map((person) => (
              <PeekCard
                key={person.initials}
                openOn="hover"
                title={person.title}
                icon={HandHeart}
                action={ACTION}
                tabs={TABS}
              >
                <Avatar initials={person.initials} />
              </PeekCard>
            ))}
          </div>

          <p className="max-w-lg text-[13px] text-muted-foreground">
            También sirve sobre texto corrido: la campaña la lleva{" "}
            <PeekCard
              openOn="hover"
              side="top"
              title="Fondo Marmota"
              icon={Target}
              footer={FOOTER}
              tabs={TABS}
            >
              <button
                type="button"
                className="cursor-pointer text-foreground underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
              >
                Fondo Marmota
              </button>
            </PeekCard>{" "}
            desde marzo, y ya pasó dos tercios de la meta del año.
          </p>
        </div>
      </Section>

      <Section
        title="Contra el borde"
        hint="Alineado al final del trigger y abriendo hacia arriba. Base UI da vuelta el lado solo cuando no entra, y el card sigue al ancla si la página scrollea: no es modal."
      >
        <div className="flex justify-end">
          <PeekCard
            title="Perfil de donación"
            icon={HandHeart}
            action={ACTION}
            footer={FOOTER}
            tabs={TABS}
            side="top"
            align="end"
          >
            <Button variant="tertiary" leadingIcon={ChartLine}>
              Ver los números
            </Button>
          </PeekCard>
        </div>
      </Section>

      <Section
        title="Controlado y compacto"
        hint="La pestaña se puede manejar desde afuera — los botones de acá abajo mueven la del card — y dentro de un SizeProvider compacto bajan el título, las pestañas, los botones y el aire del marco. El ancho también: 360 pasa a 320, un escalón más angosto."
      >
        <SizeProvider size="compact">
          <div className="flex flex-wrap items-center gap-2">
            <PeekCard
              title="Perfil de donación"
              icon={HandHeart}
              action={ACTION}
              footer={FOOTER}
              tabs={TABS}
              tab={tab}
              onTabChange={setTab}
              defaultOpen
            >
              <Button variant="secondary" leadingIcon={Wallet}>
                Ver el perfil
              </Button>
            </PeekCard>

            {TABS.map((item, index) => (
              <Button
                key={item.label}
                variant={index === tab ? "primary" : "tertiary"}
                onClick={() => setTab(index)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </SizeProvider>
      </Section>
    </div>
  );
}
