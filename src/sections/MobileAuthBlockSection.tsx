import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LoginBlock } from "@/components/login-block";
import { MobileAuthBlock } from "@/components/mobile-auth-block";
import { cn } from "@/lib/utils";
import { Section } from "./Shared";

/* La marca del producto inventado, la misma que usa LoginBlock: los dos blocks
   son la misma pantalla y tienen que verse hermanos. Hereda currentColor, así
   que el fondo lo pinta de blanco. */
function AtlasflowMark() {
  return (
    <svg viewBox="0 0 38 30" className="h-7 w-auto" aria-label="Atlasflow" role="img">
      <path fill="currentColor" d="M14.1 1.6 0 29.1h8.6L22.7 1.6z" />
      <path fill="currentColor" d="M27.4 12.2 18.8 29.1h8.6L36 12.2z" />
    </svg>
  );
}

const COPY = {
  title: "Welcome to Atlasflow",
  description: "Ship from your first user to your millionth.",
};

const WRONG_CREDENTIALS = "Invalid email or password";

/* Una «foto» dibujada acá adentro y servida como data URI. No es decoración
   caprichosa: lo que la demo tiene que probar es que `background` toma un
   <img> de verdad —con su object-cover y su recorte— y no otro degradado, que
   es lo que el block ya pinta solo.

   El motivo va en el tercio de arriba a propósito: la hoja tapa la mitad de
   abajo de la pantalla, así que una foto con el horizonte al medio no se ve, y
   la demo terminaría probando lo que no quería probar. */
const PHOTO = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="720" viewBox="0 0 360 720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16233f"/>
      <stop offset="34%" stop-color="#5b4470"/>
      <stop offset="52%" stop-color="#c97e6a"/>
      <stop offset="64%" stop-color="#e2a173"/>
      <stop offset="100%" stop-color="#241d2e"/>
    </linearGradient>
    <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b3355"/>
      <stop offset="100%" stop-color="#221c33"/>
    </linearGradient>
  </defs>
  <rect width="360" height="720" fill="url(#sky)"/>
  <circle cx="262" cy="236" r="52" fill="#f6c48d" opacity="0.9"/>
  <path d="M0 300 L78 214 L142 286 L206 206 L286 300 L360 250 L360 720 L0 720 Z" fill="url(#ridge)" opacity="0.72"/>
  <path d="M0 372 L70 306 L164 382 L242 324 L360 398 L360 720 L0 720 Z" fill="#1b1628"/>
</svg>`)}`;

export function MobileAuthBlockSection() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const timer = useRef<number | null>(null);

  // El timer del envío simulado sobrevive al desmontaje si no se limpia, y al
  // cambiar de página del showcase el componente se va sin avisar.
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const attempt = () => {
    setError(null);
    setPending(true);
    timer.current = window.setTimeout(() => {
      setPending(false);
      setError(WRONG_CREDENTIALS);
    }, 700);
  };

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="MobileAuthBlock"
        hint="The same sign-in screen for the shape held in one hand: LoginBlock's plane runs the whole screen, edge to edge, and what's actionable comes together on a card floating at the floor, where the thumb reaches — with the plane running under it and out its sides. The pieces are LoginBlock's own — same fields, same notice, same providers — so a change to a field lands on both screens."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Phone>
            <MobileAuthBlock
              logo={<AtlasflowMark />}
              title={COPY.title}
              description={COPY.description}
              error={error}
              pending={pending}
              onSubmit={attempt}
              onGitHub={attempt}
            />
          </Phone>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              The notice pushes the form down instead of covering it — the same
              rule as its sibling, and the reason it lands inside the frame and
              not on top of the fields that need fixing.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="tertiary"
                size="compact"
                onClick={attempt}
                disabled={pending}
              >
                Simulate a failed attempt
              </Button>
              <Button
                variant="ghost"
                size="compact"
                onClick={() => setError(null)}
                disabled={!error}
              >
                Dismiss the error
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground">
              The three knobs paint the block and nothing else: the theme class
              goes on its root, so it can stand in the opposite key to the app
              around it.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="The plane runs the whole screen"
        hint="It's LoginBlock's own — the same gradient, in the same two keys — edge to edge, with the card floating on it. In its light key the plane climbs several steps above near-black so it doesn't turn into a black hole beside a light app: that decision is the sibling's, and it travels with the art."
      >
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex flex-col gap-2">
            <Phone>
              <MobileAuthBlock
                logo={<AtlasflowMark />}
                title={COPY.title}
                description={COPY.description}
                defaultTheme="light"
              />
            </Phone>
            <p className="text-center text-[12px] text-muted-foreground">
              Light key
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Phone>
              <MobileAuthBlock
                logo={<AtlasflowMark />}
                title={COPY.title}
                description={COPY.description}
                defaultTheme="dark"
              />
            </Phone>
            <p className="text-center text-[12px] text-muted-foreground">
              Dark key
            </p>
          </div>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              `background` swaps the plane for anything else — an image, a
              video, a canvas — and it lands in the same place: under
              everything, edge to edge, with the scrims over it.
            </p>
            <Phone className="h-[320px] w-[150px]">
              <MobileAuthBlock
                logo={<AtlasflowMark />}
                title="Every deploy"
                description="From anywhere."
                defaultTheme="dark"
                background={<img src={PHOTO} alt="" />}
              />
            </Phone>
          </div>
        </div>
      </Section>

      <Section
        title="Why it exists"
        hint="Its sibling at the same width: below 672px of container LoginBlock withdraws the brand plane, because in a phone-width column it would compete with the form instead of accompanying it. What's left is right, and it's a form on a page. The mobile block keeps the plane by moving the split from side to side into depth — the plane underneath, the card on top."
      >
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex flex-col gap-2">
            <Phone>
              <LoginBlock
                logo={<AtlasflowMark />}
                title={COPY.title}
                description={COPY.description}
                defaultTheme="dark"
              />
            </Phone>
            <p className="text-center text-[12px] text-muted-foreground">
              LoginBlock, narrow
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Phone>
              <MobileAuthBlock
                logo={<AtlasflowMark />}
                title={COPY.title}
                description={COPY.description}
                defaultTheme="dark"
              />
            </Phone>
            <p className="text-center text-[12px] text-muted-foreground">
              MobileAuthBlock
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

/** El marco que le da al block una pantalla del tamaño que entra en la columna
 *  del showcase. Las proporciones son las de un teléfono de hoy —cerca de
 *  19.5:9— porque la decisión que el block toma, qué cede cuando falta alto, no
 *  se ve en un rectángulo cómodo. */
function Phone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[640px] w-[300px] shrink-0 overflow-hidden rounded-[28px] bg-surface-1 shadow-surface-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
