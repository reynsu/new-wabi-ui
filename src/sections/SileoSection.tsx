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
      if (shouldFail) reject(new Error("The server didn't respond"));
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
        hint="sileo.success / error / warning / info / action. Each returns the toast's id, which is what you dismiss it with later."
      >
        <Row>
          <Button
            onClick={() =>
              remember(
                sileo.success({
                  title: "Components installed",
                  description: "24 from the registry, on top of Base UI.",
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
                  title: "The window couldn't be opened",
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
                  title: "Interaction tokens are missing",
                  description: "bg-hover wasn't generated; the highlight paints invisible.",
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
                  title: "The registry publishes two flavours",
                  description: "Always ask for the base/ prefix.",
                })
              )
            }
          >
            Info
          </Button>
        </Row>
      </Section>

      <Section
        title="With an action"
        hint="button: { title, onClick } adds a button inside the toast. The toast stays open until it's dealt with."
      >
        <Row>
          <Button
            variant="secondary"
            onClick={() =>
              remember(
                sileo.action({
                  title: "The note was deleted",
                  description: "You can get it back before this closes.",
                  duration: 6000,
                  button: {
                    title: "Undo",
                    onClick: () =>
                      sileo.success({ title: "Note restored" }),
                  },
                })
              )
            }
          >
            Toast with an action
          </Button>
        </Row>
      </Section>

      <Section
        title="Chained to a promise"
        hint="sileo.promise chains loading, success and error into a single toast, and returns the original promise so you can keep chaining."
      >
        <Row>
          <Button
            variant="secondary"
            onClick={() =>
              sileo
                .promise(fakeRequest(false), {
                  loading: { title: "Publishing the registry…" },
                  success: (data) => ({
                    title: "Published",
                    description: `Deploy #${data.id} is in production.`,
                  }),
                  error: (err) => ({
                    title: "The deploy failed",
                    description: String(err),
                  }),
                })
                .catch(() => {
                  /* the toast already reports it */
                })
            }
          >
            A promise that resolves
          </Button>
          <Button
            variant="tertiary"
            onClick={() =>
              sileo
                .promise(fakeRequest(true), {
                  loading: { title: "Publishing the registry…" },
                  success: { title: "Published" },
                  error: (err) => ({
                    title: "The deploy failed",
                    description: String(err),
                  }),
                })
                .catch(() => {
                  // promise() re-lanza el rechazo; sin este catch queda una
                  // promesa no manejada en consola.
                })
            }
          >
            A promise that fails
          </Button>
        </Row>
      </Section>

      <Section
        title="Positions"
        hint="Six of them. The app's Toaster is at bottom-right, but every toast can ask for its own."
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
        title="Appearance"
        hint="fill changes the pill's colour, roundness its radius and duration how long it lives. With duration: null it stays until it's closed."
      >
        <Row>
          <Button
            variant="tertiary"
            onClick={() =>
              remember(
                sileo.show({
                  title: "Its own fill and radius",
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
                  title: "This one doesn't leave on its own",
                  description: "duration: null — dismiss it with the button below.",
                  duration: null,
                })
              )
            }
          >
            Persistent
          </Button>
        </Row>
      </Section>

      <Section
        title="Control"
        hint="dismiss(id) closes one; clear() closes them all."
      >
        <Row>
          <Button
            variant="tertiary"
            onClick={() => lastId.current && sileo.dismiss(lastId.current)}
          >
            Dismiss the last one
          </Button>
          <Button variant="tertiary" onClick={() => sileo.clear()}>
            Clear them all
          </Button>
          <Badge color="teal" size="compact">
            {count} fired
          </Badge>
        </Row>
      </Section>

      <Section title="A note on integration">
        <p className="text-[13px] text-muted-foreground">
          The <code>Toaster</code> is mounted once in <code>App.tsx</code> and
          takes an explicit <code>theme</code> tied to the header's toggle. Its
          <code>"system"</code> mode follows the operating system, which isn't
          what decides the theme here — the <code>.dark</code> class on{" "}
          <code>&lt;html&gt;</code> does, so it would drift out of sync.
        </p>
        <p className="text-[13px] text-muted-foreground">
          Sileo brings its own CSS and injects it into <code>document.head</code>
          {" "}by itself, so there's no style import to maintain.
        </p>
      </Section>
    </div>
  );
}
