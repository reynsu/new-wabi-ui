import { useState } from "react";
import {
  Bell,
  Grid3x3,
  Palette,
  Share2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MobileActionConfirmation,
  type ConfirmationStep,
} from "@/components/mobile-action-confirmation";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "./Shared";

/* Los pasos de una alta guiada: el caso donde la hoja no confirma una acción
   sino una secuencia. Ocho pasos a propósito — es el número que hace que el
   riel de puntos se retire y quede sólo el contador. */
const TOUR: ConfirmationStep[] = [
  {
    id: "library",
    icon: Grid3x3,
    title: "Shader library",
    description:
      "Browse and switch between every shader you've saved, without leaving the editor.",
  },
  {
    id: "palette",
    icon: Palette,
    title: "Shared palette",
    description:
      "One shader's colours travel to the rest: change the palette once and the whole set updates.",
  },
  {
    id: "presets",
    icon: Wand2,
    title: "Team presets",
    description: "Save a combination and share it with the rest of the team.",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Render notifications",
    description:
      "We let you know when a long render finishes, even with the app closed.",
  },
  {
    id: "share",
    icon: Share2,
    title: "Public links",
    description: "Publish a shader with a link that opens without an account.",
  },
  {
    id: "sync",
    icon: Sparkles,
    title: "Sync",
    description:
      "Everything you save on the phone shows up on the desktop when you open it.",
  },
  {
    id: "beta",
    icon: Sparkles,
    title: "Features in testing",
    description:
      "Turn on what we're still writing and tell us what breaks.",
  },
  {
    id: "ready",
    icon: Sparkles,
    title: "All set",
    description: "That's everything. You can see this guide again from Settings.",
  },
];

const DELETE_STEP: ConfirmationStep[] = [
  {
    id: "delete",
    icon: Trash2,
    title: "Delete the shader",
    description:
      "It's deleted from the library and from any projects using it. This can't be undone.",
  },
];

/* Una pantalla de teléfono dibujada: el marco es `relative` y `overflow:
   hidden`, que es lo que la hoja necesita para portalearse adentro en vez de
   sobre la ventana. Lo de adentro es relleno — está para que el velo tenga
   algo que oscurecer. */
function Phone({
  frame,
  children,
}: {
  frame: (node: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={frame}
      className="relative h-[520px] w-[300px] shrink-0 overflow-hidden rounded-[28px] bg-surface-1 shadow-surface-3"
    >
      <div className="flex h-full flex-col gap-3 p-4 opacity-60">
        <div className="h-6 w-24 rounded-md bg-accent" />
        <div className="h-32 rounded-xl bg-accent" />
        <div className="h-3 w-full rounded bg-accent" />
        <div className="h-3 w-4/5 rounded bg-accent" />
        <div className="h-3 w-2/3 rounded bg-accent" />
        <div className="mt-2 h-24 rounded-xl bg-accent" />
      </div>
      {children}
    </div>
  );
}

export function MobileActionConfirmationSection() {
  const [tourFrame, setTourFrame] = useState<HTMLDivElement | null>(null);
  const [deleteFrame, setDeleteFrame] = useState<HTMLDivElement | null>(null);
  const [compactFrame, setCompactFrame] = useState<HTMLDivElement | null>(null);

  const [tourOpen, setTourOpen] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(true);
  const [compactOpen, setCompactOpen] = useState(true);
  const [pending, setPending] = useState(false);

  const confirmDelete = () => {
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setDeleteOpen(false);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="MobileActionConfirmation"
        hint="The sheet that confirms an action on a phone screen: which action it is, what it involves and the two ways out, anchored to the floor where the thumb reaches. With several steps the same sheet carries the counter and the rail, and “Continue” advances instead of confirming."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Phone frame={setTourFrame}>
            <MobileActionConfirmation
              open={tourOpen}
              onOpenChange={setTourOpen}
              steps={TOUR}
              container={tourFrame}
              onSkip={() => setTourOpen(false)}
              onConfirm={() => setTourOpen(false)}
              finalConfirmLabel="Get started"
              tileClassName="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            />
          </Phone>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              Eight steps, which is just past the rail's cap: the dots withdraw
              and the counter is left. Drop two steps from the array and the rail
              comes back.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="tertiary"
                size="compact"
                onClick={() => setTourOpen(true)}
                disabled={tourOpen}
              >
                Open the guide
              </Button>
              <Button
                variant="ghost"
                size="compact"
                onClick={() => setTourOpen(false)}
                disabled={!tourOpen}
              >
                Close
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground">
              The veil and the sheet are portalled inside the frame, not over
              the window: that's the <code className="text-foreground">container</code>
              prop, the same escape hatch the registry's dialog has.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="A single action"
        hint="The common case: one step, with no counter and no rail, and the top exit isn't drawn because there's nothing to skip. The tile takes the destructive tone and the confirm goes into loading while the action is in flight."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Phone frame={setDeleteFrame}>
            <MobileActionConfirmation
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              steps={DELETE_STEP}
              container={deleteFrame}
              tone="destructive"
              pending={pending}
              confirmLabel="Delete"
              onConfirm={confirmDelete}
            />
          </Phone>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              Clicking outside doesn't close — it's an <code className="text-foreground">alertdialog</code>,
              one of the two exits has to be chosen. Escape does, which is the
              usual cancellation.
            </p>
            <Button
              variant="tertiary"
              size="compact"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteOpen}
            >
              Open it again
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Compact density"
        hint="On a real phone you don't have to ask for this: the sheet sees the coarse pointer and goes compact on its own. Here, with a mouse, it's forced with a SizeProvider so the step can be seen. The text and the glyph drop one and the sheet tightens, but the row of actions stays at 44px: the jump to the thumb is the same at both steps, so what shrinks is the air and never the touch target."
      >
        <div className="flex flex-wrap items-start gap-6">
          <SizeProvider size="compact">
            <Phone frame={setCompactFrame}>
              <MobileActionConfirmation
                open={compactOpen}
                onOpenChange={setCompactOpen}
                steps={TOUR.slice(0, 3)}
                container={compactFrame}
                placement="center"
                onSkip={() => setCompactOpen(false)}
                onConfirm={() => setCompactOpen(false)}
                finalConfirmLabel="Get started"
              />
            </Phone>
          </SizeProvider>

          <div className="flex min-w-[220px] flex-1 flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">
              Three steps: here the rail is drawn, and the active dot travels
              instead of switching on and off. It goes with{" "}
              <code className="text-foreground">placement="center"</code>, which
              is for when the frame's floor isn't the screen's floor.
            </p>
            <Button
              variant="tertiary"
              size="compact"
              onClick={() => setCompactOpen(true)}
              disabled={compactOpen}
            >
              Open it again
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
