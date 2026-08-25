import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { LoginBlock, type LoginBlockTheme } from "@/components/login-block";
import { Section } from "./Shared";

/* La marca de un producto inventado, para que el block se vea con algo adentro
   en vez de con un cuadrado gris. Dos barras que suben, la segunda más corta y
   corrida: el logo hereda currentColor, así que el plano lo pinta de blanco. */
function AtlasflowMark() {
  return (
    <svg viewBox="0 0 38 30" className="h-7 w-auto" aria-label="Atlasflow" role="img">
      <path fill="currentColor" d="M14.1 1.6 0 29.1h8.6L22.7 1.6z" />
      <path fill="currentColor" d="M27.4 12.2 18.8 29.1h8.6L36 12.2z" />
    </svg>
  );
}

const WRONG_CREDENTIALS = "Invalid email or password";

const COPY = {
  title: "Welcome to Atlasflow",
  description:
    "Atlasflow builds, deploys and runs your application on infrastructure we operate ourselves, fast and reliable from your first user to your millionth.",
};

export function LoginBlockSection() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [theme, setTheme] = useState<LoginBlockTheme>("system");
  const [fullscreen, setFullscreen] = useState(false);
  const timer = useRef<number | null>(null);
  const opener = useRef<HTMLButtonElement>(null);

  // El timer del envío simulado sobrevive al desmontaje si no se limpia, y al
  // cambiar de página del showcase el componente se va sin avisar.
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  // Escape cierra, y el foco vuelve al botón que abrió: si se quedara en un
  // nodo que se acaba de desmontar, el tabulador reempieza desde el <body>.
  const close = useCallback(() => {
    setFullscreen(false);
    opener.current?.focus();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      // Por `close` y no por `setFullscreen`: las dos salidas — la tecla y el
      // botón — tienen que devolver el foco al mismo lugar.
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, close]);

  const attempt = () => {
    setError(null);
    setPending(true);
    timer.current = window.setTimeout(() => {
      setPending(false);
      setError(WRONG_CREDENTIALS);
    }, 700);
  };

  const block = (
    <LoginBlock
      logo={<AtlasflowMark />}
      title={COPY.title}
      description={COPY.description}
      theme={theme}
      onThemeChange={setTheme}
      error={error}
      pending={pending}
      onSubmit={attempt}
      onGitHub={attempt}
    />
  );

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="LoginBlock"
        hint="A whole sign-in screen: the brand plane on the left, the only actionable column on the right. It measures its container with container queries, so the frame below and a full screen are the same code."
      >
        <div className="flex flex-col gap-4">
          {/* El block está pensado para ocupar una pantalla; el marco le da una
              del tamaño que entra en la columna del showcase. */}
          <div className="relative">
            <div className="h-[560px] overflow-hidden rounded-xl bg-surface-1 shadow-surface-2">
              {block}
            </div>
            <div className="absolute right-3 top-3">
              <Tooltip content="Open full screen">
                <Button
                  ref={opener}
                  variant="secondary"
                  size="icon-compact"
                  aria-label="Open full screen"
                  onClick={() => setFullscreen(true)}
                >
                  <Maximize2 />
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="tertiary" size="compact" onClick={attempt} disabled={pending}>
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
            <p className="text-[12px] text-muted-foreground">
              The plane's theme selector paints the block only — try it with the
              app in the opposite theme.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Narrow"
        hint="Below 672px of container the brand plane withdraws and the sign-in column is left on its own. It isn't that it shrinks: in a phone-width column the plane would compete with the form."
      >
        <div className="h-[560px] w-[360px] overflow-hidden rounded-xl bg-surface-1 shadow-surface-2">
          <LoginBlock
            logo={<AtlasflowMark />}
            title={COPY.title}
            description="Atlasflow builds, deploys and runs your application."
            defaultTheme="dark"
          />
        </div>
      </Section>

      {/* A pantalla completa el block mide el viewport, así que las container
          queries se resuelven contra el ancho real y el reparto queda como en
          una pantalla de acceso de verdad. Va montado aparte del marco en vez
          de mudarse: así el marco no queda vacío detrás y lo que ya estaba
          tipeado sigue ahí al cerrar. */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="LoginBlock full screen"
          className="fixed inset-0 z-50 bg-surface-1"
        >
          {block}
          <div className="absolute right-4 top-4">
            <Tooltip content="Close — Esc">
              <Button
                autoFocus
                variant="secondary"
                size="icon-compact"
                aria-label="Close full screen"
                onClick={close}
              >
                <X />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
