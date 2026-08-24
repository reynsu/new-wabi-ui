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

const WRONG_CREDENTIALS = "Email o contraseña inválidos";

const COPY = {
  title: "Bienvenido a Atlasflow",
  description:
    "Atlasflow compila, despliega y corre tu aplicación sobre infraestructura que operamos nosotros, rápida y confiable desde tu primer usuario hasta el millón.",
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
        hint="Una pantalla de acceso entera: plano de marca a la izquierda, la única columna accionable a la derecha. Mide su contenedor con container queries, así que el marco de acá abajo y una pantalla completa son el mismo código."
      >
        <div className="flex flex-col gap-4">
          {/* El block está pensado para ocupar una pantalla; el marco le da una
              del tamaño que entra en la columna del showcase. */}
          <div className="relative">
            <div className="h-[560px] overflow-hidden rounded-xl bg-surface-1 shadow-surface-2">
              {block}
            </div>
            <div className="absolute right-3 top-3">
              <Tooltip content="Abrir en pantalla completa">
                <Button
                  ref={opener}
                  variant="secondary"
                  size="icon-compact"
                  aria-label="Abrir en pantalla completa"
                  onClick={() => setFullscreen(true)}
                >
                  <Maximize2 />
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="tertiary" size="compact" onClick={attempt} disabled={pending}>
              Simular intento fallido
            </Button>
            <Button
              variant="ghost"
              size="compact"
              onClick={() => setError(null)}
              disabled={!error}
            >
              Descartar el error
            </Button>
            <p className="text-[12px] text-muted-foreground">
              El selector de tema del plano pinta sólo el block — probalo con la
              app en el tema contrario.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Angosto"
        hint="Por debajo de los 672px de contenedor el plano de marca se retira y queda la columna de acceso sola. No es que se achique: en una columna de teléfono el plano competiría con el formulario."
      >
        <div className="h-[560px] w-[360px] overflow-hidden rounded-xl bg-surface-1 shadow-surface-2">
          <LoginBlock
            logo={<AtlasflowMark />}
            title={COPY.title}
            description="Atlasflow compila, despliega y corre tu aplicación."
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
          aria-label="LoginBlock a pantalla completa"
          className="fixed inset-0 z-50 bg-surface-1"
        >
          {block}
          <div className="absolute right-4 top-4">
            <Tooltip content="Cerrar — Esc">
              <Button
                autoFocus
                variant="secondary"
                size="icon-compact"
                aria-label="Cerrar la pantalla completa"
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
