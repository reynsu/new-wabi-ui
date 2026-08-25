"use client";

/**
 * MobileActionConfirmation — confirming an action on a phone screen.
 *
 * A sheet anchored to the floor: which action this is —glyph and name—, what it
 * involves, and the two ways out. When the action isn't one but a sequence
 * —eight permissions, eight sign-up screens— the same sheet carries the counter
 * at the top, the rail of dots at the bottom, and "Continue" advances instead
 * of confirming.
 *
 * It's an `InsetDialog` with `placement="bottom"`: the step —glyph, name and
 * what it involves— goes in the card, and the counter, the top exit, the rail
 * and the two actions stay in the tray. That's what makes a single thing move
 * when the step changes: the frame is everything that doesn't change.
 *
 * Six decisions worth not undoing without looking at the rest:
 *
 * 1. **It goes to the floor, not the centre.** On a phone the thumb reaches the
 *    bottom and not the top; a centred sheet leaves the two actions in the
 *    middle of the screen, where the hand has to be rearranged to reach them.
 *    `placement` has `center` for when the component is shown in a small frame
 *    —the showcase— and the frame's floor isn't the screen's floor.
 *
 * 2. **The ladder climbs to the thumb with a single number.** 36px passes for a
 *    mouse but not for a finger: both platforms ask for 44px a side. Instead of
 *    writing 44 and 52 by hand, everything comes from `TOUCH_BUMP` added to the
 *    ladder, so the compact step and the default one both end up above the
 *    floor and the difference between densities can still be read. And for that
 *    same reason the step on a touch device is always the compact one: the only
 *    thing that goes down is the air — the action still measures 44px, which is
 *    the floor, not the ceiling.
 *
 * 3. **The height animates, the content crosses over.** Two steps with
 *    descriptions of different lengths change the card's height; since the
 *    sheet is anchored to the floor, that change would make it jump. The height
 *    travels with `spring.moderate` to the incoming step's measure, and the two
 *    steps coexist during the crossover —`popLayout` takes the outgoing one out
 *    of flow— so the incoming one already measures right before the other
 *    finishes leaving.
 *
 * 4. **The active dot travels, it doesn't switch on and off.** It's a single
 *    layer sliding along the rail, like `WorkspacePanel`'s selector. Here it
 *    can be a `transform`: the dot doesn't change size between positions, so
 *    there's no radius to distort. And the rail withdraws past `DOT_CAP` dots —
 *    twenty dots aren't counted at a glance, that's what the counter is for.
 *
 * 5. **The title and the description are labelled by hand.** During the
 *    crossover there are two steps mounted; with `Dialog.Title` both would
 *    publish their id on the same popup and `aria-labelledby` would end up
 *    pointing at the one that's leaving. Each step carries its own id and the
 *    popup points at the one coming in.
 *
 * 6. **Clicking outside doesn't close.** A confirmation gets answered: a click
 *    off to the side is neither of the two answers. It's what separates an
 *    `alertdialog` from a plain dialog, and `InsetDialog` brings it as a knob
 *    —`disablePointerDismissal`— together with the `role`, which goes on the
 *    content.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  InsetDialog,
  InsetDialogBody,
  InsetDialogContent,
  InsetDialogFooter,
  InsetDialogHeader,
} from "@/components/inset-dialog";
import { useTouchPrimary } from "@/hooks/use-touch-primary";
import { fontWeights } from "@/lib/font-weight";
import type { IconComponent } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import {
  SizeProvider,
  useSize,
  useSizeVariant,
  useTypeScale,
  type SizeVariant,
} from "@/lib/size-context";
import { exitFallbackMs, spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

/** The ladder's jump to the thumb. The row of actions climbs twice this number
 *  above the control height and the glyph's tile climbs it once, so the compact
 *  step (28) gives 44 and 36, and the default one (36) gives 52 and 44 — both
 *  above the 44px touch floor, without repeating literals across the file. */
const TOUCH_BUMP = 8;

/** The rail's dot and the air between dots. Equal on purpose: the rail reads as
 *  a sequence and not as pairs. */
const DOT = 6;
const DOT_GAP = 6;

/** Past this many steps the rail withdraws and only the counter is left: twenty
 *  dots aren't counted at a glance. */
const DOT_CAP = 7;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

interface ConfirmationStep {
  /** Stable across renders: it's the crossover's key and the root of the ids
   *  that label the dialog. */
  id: string;
  icon: IconComponent;
  title: string;
  description: ReactNode;
  /** Label for the next action, for this step only. Without it, the
   *  component's. */
  confirmLabel?: string;
}

interface MobileActionConfirmationProps {
  open: boolean;
  /** Close. It also arrives via Escape; clicking outside doesn't close —one of
   *  the two exits has to be chosen. */
  onOpenChange: (open: boolean) => void;
  /** One for a plain confirmation, several for a sequence. */
  steps: ConfirmationStep[];
  /** Active step, to drive it from outside. Without this the component keeps it
   *  and rewinds to the first one once the sheet finishes leaving. */
  step?: number;
  onStepChange?: (step: number) => void;
  /** Confirm. In a sequence, only on the last step. */
  onConfirm: () => void;
  /** Going back on the first step. Without this, it closes. */
  onCancel?: () => void;
  /** The exit at the top right. Without this it isn't drawn: a sequence you
   *  can't leave shouldn't offer it. */
  onSkip?: () => void;
  confirmLabel?: string;
  /** Label for confirming on a sequence's last step. Without this, the same as
   *  on the others. */
  finalConfirmLabel?: string;
  /** The first step's way out — closing without doing anything. */
  cancelLabel?: string;
  /** Going back to the previous step. It's a different label from
   *  `cancelLabel` because it's a different thing: one undoes a step, the other
   *  walks away. */
  backLabel?: string;
  skipLabel?: string;
  /** The confirm goes into loading and both exits are blocked. */
  pending?: boolean;
  /** How the glyph's tile is painted. */
  tone?: "neutral" | "destructive";
  /** The only place a brand colour gets in: the tile. The rest of the sheet
   *  comes from the theme's tokens. */
  tileClassName?: string;
  placement?: "bottom" | "center";
  /** Where focus returns on close. */
  triggerRef?: RefObject<HTMLElement | null>;
  /** Traps focus and blocks the scroll behind it. On by default, unless the
   *  sheet is portalled into a frame (`container`): there it's a sample inside
   *  a page that's still in use, and the trap would take focus away from
   *  everything around it. */
  modal?: boolean;
  /** The frame it's portalled into. With this the sheet positions itself
   *  `absolute` inside the element instead of over the window — useful for
   *  showing it inside a drawn phone screen. The frame has to be `relative` and
   *  `overflow: hidden`. */
  container?: HTMLElement | null;
  /** Pins the sheet's density for a fine pointer. Without this it follows the
   *  `SizeProvider` above. On a touch device it isn't read: there the density is
   *  always compact. */
  size?: SizeVariant;
}

// ---------------------------------------------------------------------------
// The crossover between steps
// ---------------------------------------------------------------------------

/* The direction is set by whoever fires the change: forward comes in from the
   right, back from the left. Without that both directions of travel look the
   same and going back can't be told apart from moving on. */
const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 12 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -12 }),
};

/** Measures the mounted step's height. Returns a stable ref and the height in
 *  px.
 *
 *  The ref is the same callback on every render —a new one per render makes
 *  React unmount and remount the ref, and each round trip invalidates the
 *  measurement—, and it doesn't release the observer when called with `null`:
 *  during the crossover both steps are mounted, so the outgoing node would call
 *  it with `null` after the incoming one has already signed up, and would drop
 *  the measurement of the one that's staying. */
function useMeasuredHeight() {
  const [height, setHeight] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    observer.current?.disconnect();
    const next = new ResizeObserver(() => setHeight(node.offsetHeight));
    next.observe(node);
    observer.current = next;
    setHeight(node.offsetHeight);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, height] as const;
}

// ---------------------------------------------------------------------------

export function MobileActionConfirmation({
  open,
  onOpenChange,
  steps,
  step,
  onStepChange,
  onConfirm,
  onCancel,
  onSkip,
  confirmLabel,
  finalConfirmLabel,
  cancelLabel = "Cancel",
  backLabel = "Back",
  skipLabel = "Skip",
  pending = false,
  tone = "neutral",
  tileClassName,
  placement = "bottom",
  triggerRef,
  container,
  modal,
  size,
}: MobileActionConfirmationProps) {
  // On a phone the density isn't negotiable: compact, whatever wins outside. A
  // default step in a 360px column leaves the description at twice the lines
  // and pushes the actions below the thumb's fold, and the jump to the thumb
  // keeps compact giving a 44px action — meaning what shrinks is the air, never
  // the touch target.
  const touch = useTouchPrimary();
  const requested = useSizeVariant(size);
  const variant = touch ? "compact" : requested;
  const classes = useSize(variant);
  const type = useTypeScale(variant);
  const shape = useShape();
  const baseId = useId();

  const [internalStep, setInternalStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [bodyRef, bodyHeight] = useMeasuredHeight();

  const confirmRef = useRef<HTMLButtonElement>(null);

  const total = steps.length;
  const index = Math.min(step ?? internalStep, Math.max(total - 1, 0));
  const first = index === 0;
  const last = index === total - 1;

  // The step rewinds to the first one only once the sheet has finished
  // leaving; doing it on close would show step 1 during the exit, which isn't
  // where the person who closed it was. The portal unmounts on its own —that's
  // `InsetDialog`'s job—, so this timer frees nothing: it only picks the moment
  // to rewind.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      setInternalStep(0);
      setDirection(1);
    }, exitFallbackMs(spring.moderate));
    return () => clearTimeout(id);
  }, [open]);

  const goTo = (next: number, towards: number) => {
    setDirection(towards);
    if (step === undefined) setInternalStep(next);
    onStepChange?.(next);
  };

  const advance = () => {
    if (last) {
      onConfirm();
      return;
    }
    goTo(index + 1, 1);
  };

  const retreat = () => {
    if (first) {
      if (onCancel) onCancel();
      else onOpenChange(false);
      return;
    }
    goTo(index - 1, -1);
  };

  if (total === 0) return null;

  const current = steps[index];
  const Glyph = current.icon;

  // The sheet's three measurements come from the ladder plus the thumb jump.
  const action = classes.controlHeight + TOUCH_BUMP * 2; // 52 / 44
  const tile = classes.controlHeight + TOUCH_BUMP; //        44 / 36
  const glyph = classes.icon + TOUCH_BUMP / 2; //            20 / 18
  const compact = variant === "compact";
  const stack = compact ? 12 : 16;

  const confirmText = last
    ? current.confirmLabel ?? finalConfirmLabel ?? confirmLabel ?? "Confirm"
    : current.confirmLabel ?? confirmLabel ?? "Continue";

  const titleId = `${baseId}-${current.id}-title`;
  const descriptionId = `${baseId}-${current.id}-description`;
  const showCounter = total > 1;
  const showRail = total > 1 && total <= DOT_CAP;

  return (
    <InsetDialog
      open={open}
      onOpenChange={onOpenChange}
      modal={modal ?? !container}
      disablePointerDismissal
    >
      <InsetDialogContent
        placement={placement}
        container={container}
        // The sheet asks and waits for an answer: `alertdialog` is what tells
        // the screen reader to interrupt and read the title and the description
        // in one go, without waiting for focus to walk through.
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        // Focus lands on the confirm and not on the first tabbable: the sheet
        // asks one thing and that's the expected answer.
        initialFocus={confirmRef}
        finalFocus={triggerRef}
        // Both exits are in the footer; an × at the top would be a third.
        showClose={false}
      >
        <SizeProvider size={variant}>
          {(showCounter || onSkip) && (
            <InsetDialogHeader withClose={false} style={{ height: tile }}>
              <span
                className="text-muted-foreground"
                style={{ fontSize: type.caption }}
              >
                {showCounter ? `${index + 1} of ${total}` : ""}
              </span>
              {onSkip && (
                <Button
                  variant="ghost"
                  className="ml-auto"
                  onClick={onSkip}
                  disabled={pending}
                  style={{
                    height: tile,
                    // The button pushes its own padding outwards: that way what
                    // lines up with the tray's rail is the word and not the
                    // invisible box around it.
                    marginRight: compact ? -12 : -16,
                  }}
                >
                  {skipLabel}
                </Button>
              )}
            </InsetDialogHeader>
          )}

          {/* The step goes in the card and doesn't scroll: what changes height
              is the step itself, and that change is animated. */}
          <InsetDialogBody scrollable={false}>
            {/* The card's padding is the same air that separates the tile from
                the title, and not `InsetDialogGroup`'s: the group is made for a
                card with several blocks and its inset, added to the tray's,
                eats forty pixels of line from a phone-width column. In here
                there's a single block. */}
            <div style={{ padding: stack }}>
              {/* Without `initial` the first opening would animate the height
                  from zero, which looks like a sheet unfolding. */}
              <motion.div
                className="relative overflow-hidden"
                initial={false}
                animate={{ height: bodyHeight ?? "auto" }}
                transition={spring.moderate}
                // The incoming step brings a new title: without this the screen
                // reader stays on the one it announced when opening.
                aria-live="polite"
              >
                <AnimatePresence
                  initial={false}
                  mode="popLayout"
                  custom={direction}
                >
                  <motion.div
                    key={current.id}
                    ref={bodyRef}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={spring.moderate}
                    className="flex flex-col"
                    style={{ gap: stack * 0.75 }}
                  >
                    <div
                      className="flex items-center"
                      style={{ gap: compact ? 10 : 12 }}
                    >
                      <span
                        className={cn(
                          "flex shrink-0 items-center justify-center",
                          shape.item,
                          tone === "destructive"
                            ? "bg-destructive-light text-destructive"
                            : "bg-accent text-foreground",
                          tileClassName
                        )}
                        style={{ width: tile, height: tile }}
                      >
                        <Glyph size={glyph} strokeWidth={1.75} />
                      </span>
                      <h2
                        id={titleId}
                        className="min-w-0 text-foreground leading-tight"
                        style={{
                          fontSize: type.title,
                          fontVariationSettings: fontWeights.bold,
                        }}
                      >
                        {current.title}
                      </h2>
                    </div>
                    <p
                      id={descriptionId}
                      className="text-muted-foreground"
                      style={{ fontSize: type.body, lineHeight: 1.45 }}
                    >
                      {current.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </InsetDialogBody>

          {/* The rail and the actions are the footer's two rows: both belong to
              the frame, not to the step, which is why they share the tray's
              plane. */}
          <InsetDialogFooter className="flex-col items-stretch gap-3">
            {showRail && (
              <div
                aria-hidden
                className="relative mx-auto"
                style={{
                  height: DOT,
                  width: total * DOT + (total - 1) * DOT_GAP,
                }}
              >
                <div
                  className="flex h-full items-center"
                  style={{ gap: DOT_GAP }}
                >
                  {steps.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-border"
                      style={{ width: DOT, height: DOT }}
                    />
                  ))}
                </div>
                {/* A single travelling layer, like WorkspacePanel's selector.
                    Here the trip can be a `transform`: the dot doesn't change
                    size between positions, so there's no radius to distort. */}
                <motion.span
                  className="absolute left-0 top-0 rounded-full bg-foreground"
                  style={{ width: DOT, height: DOT }}
                  initial={false}
                  animate={{ x: index * (DOT + DOT_GAP) }}
                  transition={spring.moderate}
                />
              </div>
            )}

            {/* The two ways out, with the one that carries on weighing more:
                the proportion says which is expected before the labels get
                read. */}
            <div className={cn("flex", classes.gap)}>
              <Button
                variant="tertiary"
                className="flex-1"
                style={{ height: action }}
                onClick={retreat}
                disabled={pending}
              >
                {first ? cancelLabel : backLabel}
              </Button>
              <Button
                ref={confirmRef}
                className="flex-[1.6]"
                style={{ height: action }}
                onClick={advance}
                loading={pending}
              >
                {confirmText}
              </Button>
            </div>
          </InsetDialogFooter>
        </SizeProvider>
      </InsetDialogContent>
    </InsetDialog>
  );
}

export type { ConfirmationStep, MobileActionConfirmationProps };
