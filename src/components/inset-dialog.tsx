"use client";

/**
 * InsetDialog — the dialog with its content inset into a card of its own.
 *
 * The registry's `Dialog` rests everything on a single plane: header, content
 * and footer share a background, and what separates the three zones is air.
 * Here the content is lifted into a card and what's left around it —header and
 * footer— is the frame that holds it. It's useful when the content is a piece
 * in its own right (a long list, a table, a log that scrolls, one step of a
 * sequence) and the frame is what's stable: title on top, actions at the
 * bottom, and something moving in between.
 *
 * It's the dialog base for the in-house components: `MobileActionConfirmation`
 * is an `InsetDialog` anchored to the floor.
 *
 * Five decisions worth not undoing without looking at the rest:
 *
 * 1. **The dialog doesn't climb: it lowers its frame.** The card stays on the
 *    usual step —substrate + 4, the same one the registry's dialog publishes
 *    inwards—, so a popover opened inside keeps rising from where it used to
 *    rise. What moves is the tray, four steps down. The other way around —tray
 *    in place and card higher— can't be done: in light the ladder is flattened
 *    to white from step 3 up, so both planes would end up the same colour.
 *    Downwards is where the light theme still has room to move: #FAFAFA against
 *    #FFFFFF.
 *
 * 2. **The tray takes its background from one step and its shadow from
 *    another.** The background drops to the foot of the ladder but the shadow
 *    weighs a dialog's, which is what lifts it off the veil. It's the same
 *    split between background and weight that `FilterMenu` uses with
 *    `Elevated`.
 *
 * 3. **The card carries the ring and not the whole shadow.** It doesn't float:
 *    it's inset. In dark, colour lifts it —#333333 over #171717— and in light,
 *    where both are almost the same white, the line is drawn entirely by
 *    `shadow-surface-2`'s ring. Without it, #FFFFFF against #FAFAFA is barely
 *    distinguishable.
 *
 * 4. **Two anchors, two motion steps.** Centred it's a dialog and comes in with
 *    `spring.slow`, the dialogs' step. Anchored to the floor it's a sheet and
 *    goes with `moderate`, which is critically damped: a sheet stuck to the
 *    edge that bounces goes off the bottom of the screen and comes back. It's
 *    the same reason `MobileDrawer` uses it.
 *
 * 5. **The × stays at `right-3 top-3`.** It's the corner of every dialog in the
 *    app; moving it to the tray's rail would put this close in a different
 *    place from the rest. Instead of moving it, the header leaves the rail free
 *    and whatever goes to the right of the title starts earlier.
 *
 * From the portal to the popup it's the same dance the registry's
 * `DialogContent` does —veil, `transitionStatus` so the exit is seen in full,
 * the `container` escape hatch, the ladder's widths—, with the two things its
 * own doesn't expose and this base needs: the anchor to the floor and the click
 * outside that doesn't close.
 */

import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIcon } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import { spring } from "@/lib/springs";
import { SURFACE_BG, SURFACE_SHADOW } from "@/lib/surface-classes";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

/** Steps the tray drops relative to the card. Four is what it takes for it to
 *  fall, in light, from the flat white (step 3 and up) to the part of the
 *  ladder where there's still some grey. */
const TRAY_DROP = 4;

/** The card's shadow, fixed. It doesn't follow its step because it doesn't
 *  float: all it needs is the ring that cuts it out against the tray. */
const CARD_SHADOW = 2;

/** The lane the header leaves for the ×: the anchor's 12px, plus its 28px box,
 *  plus air. */
const CLOSE_LANE = 48;

/** Air between a floor-anchored tray and the edge of the screen. */
const FLOOR_INSET = 16;

/** The registry dialog's widths: the ladder narrows it by one step in compact
 *  regions — the width, not the padding. */
const MAX_WIDTH = {
  sm: { default: 400, compact: 360 },
  lg: { default: 540, compact: 480 },
} as const;

/** The tray's air around the card, and the extra inset the header and footer
 *  take so the title doesn't start flush against the edge. */
function useInsetMetrics() {
  const compact = useSize().variant === "compact";
  const pad = compact ? 12 : 16;
  return { pad, rail: pad / 2, compact };
}

/** Props framer redefines with a different signature: they can't travel from
 *  Base UI's payload into a `motion.div`. */
type MotionSafeDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

interface InsetDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Traps focus and blocks the scroll behind it. Switch it off to show the
   *  dialog inside a frame, together with `container` on the content. */
  modal?: boolean;
  /** Clicking outside doesn't close. A dialog like this is usually a working
   *  surface —a long list, a log that scrolls— or a question that has to be
   *  answered, and not something you dismiss in passing: losing it to a click
   *  off to the side is losing the place you were in. The registry's `Dialog`
   *  doesn't expose this Base UI knob, and it's one of the two reasons this
   *  base sits on the primitive and not on theirs. */
  disablePointerDismissal?: boolean;
  children?: ReactNode;
}

function InsetDialog({
  open,
  defaultOpen,
  onOpenChange,
  modal,
  disablePointerDismissal,
  children,
}: InsetDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(next)}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

const InsetDialogTrigger = DialogTrigger;
const InsetDialogClose = DialogClose;
const InsetDialogTitle = DialogTitle;
const InsetDialogDescription = DialogDescription;

// ---------------------------------------------------------------------------
// The tray
// ---------------------------------------------------------------------------

interface InsetDialogContentProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "lg";
  /** Where the tray stands. Centred it's a dialog; on the floor it's a sheet,
   *  and there the air below respects the phone's gesture bar. */
  placement?: "center" | "bottom";
  /** The close ×. On by default when centred and off when it goes to the
   *  floor: an anchored sheet usually carries its two exits in the footer, and
   *  an × on top would be a third. */
  showClose?: boolean;
  /** The frame it's portalled into, to show it inside a bounded region. It goes
   *  with `<InsetDialog modal={false}>`; the frame has to be `relative` and
   *  `overflow: hidden`. */
  container?: HTMLElement | null;
  /** What takes focus on open. Without this, the first tabbable. */
  initialFocus?: boolean | RefObject<HTMLElement | null>;
  /** Where focus returns on close. */
  finalFocus?: boolean | RefObject<HTMLElement | null>;
}

const InsetDialogContent = forwardRef<HTMLDivElement, InsetDialogContentProps>(
  (
    {
      className,
      children,
      size = "sm",
      placement = "center",
      showClose,
      container,
      initialFocus,
      finalFocus,
      style,
      ...props
    },
    ref
  ) => {
    const XIcon = useIcon("x");
    const shape = useShape();
    const compact = useSize().variant === "compact";
    // The substrate out here: the card climbs the usual 4 and the tray comes
    // from the same number, so both move together if the dialog opens over a
    // higher substrate.
    const substrate = useSurface();
    const card = Math.min(substrate + 4, 8);
    const tray = Math.max(card - TRAY_DROP, 1);

    const floor = placement === "bottom";
    const withClose = showClose ?? !floor;
    const tier = floor ? spring.moderate : spring.slow;

    // No `if (!open) return null`: `DialogPrimitive.Popup` unmounts on its own
    // and waits for the exit animation to finish —it sees it through
    // `element.getAnimations()`— before taking itself out of the DOM.
    const popup = (
      <DialogPrimitive.Popup
        ref={ref}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        render={(popupProps, state) => {
          const exiting = state.transitionStatus === "ending";
          const { style: baseStyle, ...rest } =
            popupProps as HTMLAttributes<HTMLDivElement>;
          return (
            <motion.div
              // Base UI's first (role, refs, data attrs)…
              {...(rest as MotionSafeDivProps)}
              // …and the consumer's after, which lands on the tray.
              {...(props as MotionSafeDivProps)}
              className={cn(
                floor
                  ? "pointer-events-auto w-full"
                  : cn(
                      container ? "absolute" : "fixed",
                      "left-1/2 top-1/2 z-50 w-[calc(100%-2rem)]"
                    ),
                // `p-0` and `flex-col`: here the padding doesn't belong to the
                // dialog but to each zone, and the card reaches the edge minus
                // its air.
                "flex max-h-[85%] flex-col overflow-hidden p-0 focus:outline-none",
                SURFACE_BG[tray],
                SURFACE_SHADOW[card],
                shape.container,
                className
              )}
              style={{
                ...(baseStyle as CSSProperties | undefined),
                maxWidth: MAX_WIDTH[size][compact ? "compact" : "default"],
                ...(style as CSSProperties | undefined),
              }}
              initial={
                floor
                  ? { opacity: 0, y: 24 }
                  : { opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }
              }
              animate={
                floor
                  ? { opacity: exiting ? 0 : 1, y: exiting ? 24 : 0 }
                  : {
                      opacity: exiting ? 0 : 1,
                      scale: exiting ? 0.97 : 1,
                      x: "-50%",
                      y: "-50%",
                    }
              }
              transition={exiting ? tier.exit : tier}
            >
              {/* What gets published inwards is the card's level and not the
                  tray's: the one that moved was the frame, and a popover opened
                  in here has to keep rising from where it rose in any other
                  dialog. */}
              <SurfaceProvider value={card}>
                {children}
                {withClose && (
                  <DialogPrimitive.Close
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-3 top-3"
                      >
                        <XIcon />
                        <span className="sr-only">Close</span>
                      </Button>
                    }
                  />
                )}
              </SurfaceProvider>
            </motion.div>
          );
        }}
      />
    );

    return (
      <DialogPrimitive.Portal container={container ?? undefined}>
        {/* The same veil as the library's dialogs: a black at 40% that stays
            visible for anyone whose system is in dark —the `dark:` variant only
            matches the explicit class— and goes up to 80% in dark. */}
        <DialogPrimitive.Backdrop
          render={(backdropProps, state) => {
            const exiting = state.transitionStatus === "ending";
            const { style: _style, ...rest } =
              backdropProps as HTMLAttributes<HTMLDivElement>;
            return (
              <motion.div
                {...(rest as MotionSafeDivProps)}
                className={cn(
                  container ? "absolute" : "fixed",
                  "inset-0 z-50 bg-black/40 dark:bg-black/80"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: exiting ? 0 : 1 }}
                transition={exiting ? tier.exit : tier}
              />
            );
          }}
        />

        {floor ? (
          // The layer that places the sheet against the floor. It takes no
          // pointer: the only touchable thing up here is the sheet, and the veil
          // below has to keep receiving the click Base UI listens for.
          <div
            className={cn(
              container ? "absolute" : "fixed",
              "pointer-events-none inset-0 z-50 flex items-end justify-center"
            )}
            style={{
              padding: FLOOR_INSET,
              // A phone's floor isn't the edge of the screen: the gesture bar
              // is down there. `max()` leaves the normal air where there's no
              // bar and pushes it up where there is.
              paddingBottom: `max(${FLOOR_INSET}px, env(safe-area-inset-bottom))`,
            }}
          >
            {popup}
          </div>
        ) : (
          popup
        )}
      </DialogPrimitive.Portal>
    );
  }
);
InsetDialogContent.displayName = "InsetDialogContent";

// ---------------------------------------------------------------------------
// The three zones
// ---------------------------------------------------------------------------

interface InsetDialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Keeps the ×'s lane free. Switch it off when the content goes with
   *  `showClose={false}`, so the title uses the full width again. */
  withClose?: boolean;
}

/** The top zone, on the tray: the title, and to the right whatever comes with
 *  it —a counter, a status, an identifier—. */
function InsetDialogHeader({
  className,
  style,
  withClose = true,
  ...props
}: InsetDialogHeaderProps) {
  const { pad, rail } = useInsetMetrics();
  return (
    <div
      className={cn("flex shrink-0 items-center gap-3", className)}
      style={{
        paddingLeft: pad + rail,
        paddingRight: withClose ? Math.max(pad + rail, CLOSE_LANE) : pad + rail,
        paddingTop: pad + rail,
        paddingBottom: pad,
        ...style,
      }}
      {...props}
    />
  );
}

/** The bottom zone, on the tray: status on the left and actions on the right.
 *  It's the same plane as the header, which is why the two read as the frame of
 *  a single piece. */
function InsetDialogFooter({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { pad, rail } = useInsetMetrics();
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2", className)}
      style={{
        paddingInline: pad + rail,
        paddingTop: pad,
        paddingBottom: pad + rail,
        ...style,
      }}
      {...props}
    />
  );
}

interface InsetDialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** The content scrolls inside the card. Switch it off when what's inside
   *  already handles its own scroll or when there's nothing to scroll. */
  scrollable?: boolean;
  /** Classes for the scrolling viewport — that's where the content's padding
   *  goes, not on the card: with the padding outside, the text would cut against
   *  the edge while scrolling instead of dissolving under the `scroll-fade`. */
  viewportClassName?: string;
}

/** The card: the content lifted onto the tray. */
const InsetDialogBody = forwardRef<HTMLDivElement, InsetDialogBodyProps>(
  (
    { className, viewportClassName, scrollable = true, children, style, ...props },
    ref
  ) => {
    // The level the tray published: the usual one for a dialog. The card stays
    // there and doesn't climb again — the one that moved was the frame.
    const level = useSurface();
    const shape = useShape();
    const { pad } = useInsetMetrics();

    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          SURFACE_BG[level],
          SURFACE_SHADOW[CARD_SHADOW],
          shape.item,
          className
        )}
        style={{ marginInline: pad, ...style }}
        {...props}
      >
        {scrollable ? (
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName={cn("scroll-fade", viewportClassName)}
          >
            {children}
          </ScrollArea>
        ) : (
          children
        )}
      </div>
    );
  }
);
InsetDialogBody.displayName = "InsetDialogBody";

/** A block of the card, with its label and its own thing on the right. The
 *  divider is dashed and not solid: inside the card it separates zones of the
 *  same piece, whereas a solid line would read as two planes. */
function InsetDialogGroup({
  label,
  aside,
  className,
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  label?: ReactNode;
  aside?: ReactNode;
}) {
  const { pad, rail, compact } = useInsetMetrics();
  return (
    <div
      className={cn(
        "flex flex-col border-b border-dashed border-border last:border-b-0",
        className
      )}
      style={{ padding: pad + rail, ...style }}
      {...props}
    >
      {(label || aside) && (
        <div className="flex items-center justify-between gap-3">
          {label && (
            <span
              className={cn(
                "uppercase tracking-[0.08em] text-muted-foreground",
                compact ? "text-[11px]" : "text-[12px]"
              )}
            >
              {label}
            </span>
          )}
          {aside && (
            <span
              className={cn(
                "text-muted-foreground tabular-nums",
                compact ? "text-[11px]" : "text-[12px]"
              )}
            >
              {aside}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export {
  InsetDialog,
  InsetDialogTrigger,
  InsetDialogContent,
  InsetDialogHeader,
  InsetDialogBody,
  InsetDialogGroup,
  InsetDialogFooter,
  InsetDialogTitle,
  InsetDialogDescription,
  InsetDialogClose,
};
export type {
  InsetDialogProps,
  InsetDialogContentProps,
  InsetDialogHeaderProps,
  InsetDialogBodyProps,
};
