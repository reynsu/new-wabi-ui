import { useRef, useState } from "react";
import { sileo, type SileoPosition } from "sileo";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Row, Section } from "./Shared";

const POSITIONS: SileoPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

/** Promesa de mentira para la demo: resuelve o rechaza a los 1.4s. */
function fakeRequest(shouldFail: boolean) {
  return new Promise<{ id: number }>((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error("El servidor no respondió"));
      else resolve({ id: 42 });
    }, 1400);
  });
}

export function SileoSection() {
  // Los ids que devuelve sileo, para poder descartar el último a mano.
  const lastId = useRef<string | null>(null);
  const [count, setCount] = useState(0);

  const remember = (id: string) => {
    lastId.current = id;
    setCount((c) => c + 1);
    return id;
  };

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="Los cinco tipos"
        hint="sileo.success / error / warning / info / action. Cada uno devuelve el id del toast, que sirve para descartarlo después."
      >
        <Row>
          <Button
            onClick={() =>
              remember(
                sileo.success({
                  title: "Componentes instalados",
                  description: "24 del registry, sobre Base UI.",
                })
              )
            }
          >
            Success
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              remember(
                sileo.error({
                  title: "No se pudo abrir la ventana",
                  description: "InvalidStateError: no window.",
                })
              )
            }
          >
            Error
          </Button>
          <Button
            variant="tertiary"
            onClick={() =>
              remember(
                sileo.warning({
                  title: "Faltan tokens de interacción",
                  description: "bg-hover no se generó; el resalte va invisible.",
                })
              )
            }
          >
            Warning
          </Button>
          <Button
            variant="tertiary"
            onClick={() =>
              remember(
                sileo.info({
                  title: "El registry publica dos sabores",
                  description: "Pedí siempre el prefijo base/.",
                })
              )
            }
          >
            Info
          </Button>
        </Row>
      </Section>

      <Section
        title="Con acción"
        hint="button: { title, onClick } agrega un botón dentro del toast. El toast queda abierto hasta que se resuelve."
      >
        <Row>
          <Button
            variant="secondary"
            onClick={() =>
              remember(
                sileo.action({
                  title: "Se borró la nota",
                  description: "Podés recuperarla antes de que se cierre.",
                  duration: 6000,
                  button: {
                    title: "Deshacer",
                    onClick: () =>
                      sileo.success({ title: "Nota recuperada" }),
                  },
                })
              )
            }
          >
            Toast con acción
          </Button>
        </Row>
      </Section>

      <Section
        title="Encadenado a una promesa"
        hint="sileo.promise encadena carga, éxito y error en un solo toast, y devuelve la promesa original para poder seguir encadenando."
      >
        <Row>
          <Button
            variant="secondary"
            onClick={() =>
              sileo
                .promise(fakeRequest(false), {
                  loading: { title: "Publicando el registry…" },
                  success: (data) => ({
                    title: "Publicado",
                    description: `Deploy #${data.id} en producción.`,
                  }),
                  error: (err) => ({
                    title: "Falló el deploy",
                    description: String(err),
                  }),
                })
                .catch(() => {
                  /* ya lo informa el toast */
                })
            }
          >
            Promesa que resuelve
          </Button>
          <Button
            variant="tertiary"
            onClick={() =>
              sileo
                .promise(fakeRequest(true), {
                  loading: { title: "Publicando el registry…" },
                  success: { title: "Publicado" },
                  error: (err) => ({
                    title: "Falló el deploy",
                    description: String(err),
                  }),
                })
                .catch(() => {
                  // promise() re-lanza el rechazo; sin este catch queda una
                  // promesa no manejada en consola.
                })
            }
          >
            Promesa que falla
          </Button>
        </Row>
      </Section>

      <Section
        title="Posiciones"
        hint="Seis. El Toaster de la app está en bottom-right, pero cada toast puede pedir la suya."
      >
        <Row>
          {POSITIONS.map((p) => (
            <Button
              key={p}
              variant="tertiary"
              size="compact"
              onClick={() =>
                remember(sileo.info({ title: p, position: p, duration: 2000 }))
              }
            >
              {p}
            </Button>
          ))}
        </Row>
      </Section>

      <Section
        title="Apariencia"
        hint="fill cambia el color de la píldora, roundness su radio y duration cuánto vive. Con duration: null se queda hasta que lo cierren."
      >
        <Row>
          <Button
            variant="tertiary"
            onClick={() =>
              remember(
                sileo.show({
                  title: "Relleno y radio propios",
                  fill: "#8b5cf6",
                  roundness: 24,
                })
              )
            }
          >
            fill + roundness
          </Button>
          <Button
            variant="tertiary"
            onClick={() =>
              remember(
                sileo.show({
                  title: "Este no se va solo",
                  description: "duration: null — descartalo con el botón de abajo.",
                  duration: null,
                })
              )
            }
          >
            Persistente
          </Button>
        </Row>
      </Section>

      <Section
        title="Control"
        hint="dismiss(id) cierra uno; clear() los cierra todos."
      >
        <Row>
          <Button
            variant="tertiary"
            onClick={() => lastId.current && sileo.dismiss(lastId.current)}
          >
            Descartar el último
          </Button>
          <Button variant="tertiary" onClick={() => sileo.clear()}>
            Limpiar todos
          </Button>
          <Badge color="teal" size="compact">
            {count} lanzados
          </Badge>
        </Row>
      </Section>

      <Section title="Nota de integración">
        <p className="text-[13px] text-muted-foreground">
          El <code>Toaster</code> se monta una vez en <code>App.tsx</code> y
          recibe <code>theme</code> explícito atado al toggle de la cabecera. Su
          modo <code>"system"</code> sigue al sistema operativo, que no es lo que
          decide el tema acá — lo decide la clase <code>.dark</code> en{" "}
          <code>&lt;html&gt;</code>, así que quedaría desincronizado.
        </p>
        <p className="text-[13px] text-muted-foreground">
          Sileo trae su propio CSS y lo inyecta solo en <code>document.head</code>
          , así que no hay ningún import de estilos que mantener.
        </p>
      </Section>
    </div>
  );
}
