"use client";

/**
 * WidgetBoard — the grid of tiles, and where the views come from.
 *
 * It's every widget's `glance` step at once: the screen you look at without
 * opening anything. Three decisions:
 *
 * 1. **It measures its container, not the window.** The board lives inside the
 *    panel, whose width changes with the sidebar: a viewport `md:` would give
 *    it four columns with the sidebar open and those same four squeezed once
 *    it closes. With `@container` the split comes from what the board actually
 *    measures, same as `LoginBlock`.
 *
 * 2. **Rows have a fixed height.** That's what makes the size ladder mean
 *    something: a `2x2` takes exactly two rows and two columns, not however
 *    much its content wants. A board where every tile is as tall as it likes is
 *    a list of cards, not a grid.
 *
 * 3. **The empty state is `AnimatedEmpty`.** A board with no widgets is the
 *    normal state of a freshly opened app, not an error: it comes in
 *    choreographed and with the figure floating, which is exactly the case
 *    `float` exists for.
 */

import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { LayoutPanelTop, Plus } from "lucide-react";

import {
  AnimatedEmpty,
  AnimatedEmptyContent,
  AnimatedEmptyDescription,
  AnimatedEmptyHeader,
  AnimatedEmptyMedia,
  AnimatedEmptyTitle,
} from "@/components/animated-empty";
import { WidgetTile, type WidgetDefinition, type WidgetSpan } from "@/components/widget";
import { useTypeScale } from "@/lib/size-context";
import { cn } from "@/lib/utils";

/** The ladder's classes, written out literally because Tailwind can't compile a
 *  class built from an expression. Spans only kick in at `@md`: below that the
 *  board is a single column and every tile is the same size. */
const SPAN: Record<WidgetSpan, string> = {
  "1x1": "@md:col-span-1 @md:row-span-1",
  "2x1": "@md:col-span-2 @md:row-span-1",
  "2x2": "@md:col-span-2 @md:row-span-2",
};

/**
 * A row's height. A `2x2` is two of these plus the gap in between.
 *
 * It isn't a number picked by eye: it's what has to fit in the base cell
 * without the plane's `overflow-hidden` eating anything. The densest glance the
 * system invites you to write —a label and five lines— asks for 186px in a
 * narrow rail, where the right-hand column wraps "2 days ago" onto two lines.
 * At 168 the last line came out clipped.
 */
const ROW = 192;

/** The air between cells, and the air the board leaves against its container.
 *  The same number for both: if the inner gap differed from the outer edge, the
 *  grid would read as off-centre inside the rail. */
const GAP = 16;

interface WidgetBoardProps {
  widgets: WidgetDefinition[];
  /** Removes a widget from the board. The board doesn't own the array —it takes
   *  it through props—, so it only reports: whoever uses it drops the widget
   *  from `widgets`. Without this callback the tiles have no close button, same
   *  as the panel's tabs. */
  onWidgetClose?: (id: string) => void;
  /** What goes at the top right of the empty state or of the board — the button
   *  that adds a widget, usually. */
  action?: ReactNode;
  /** Closes the whole board. The board doesn't own its place —whoever mounts it
   *  does—, so it only reports. Without this callback there's no close button.
   *
   *  It's there whether the board is full or empty: a board with no widgets
   *  still takes up a column, and not being able to remove it exactly when it
   *  shows nothing would be the worst moment for it. */
  onClose?: () => void;
  className?: string;
}

function WidgetBoard({
  widgets,
  onWidgetClose,
  onClose,
  action,
  className,
}: WidgetBoardProps) {
  const typeScale = useTypeScale();

  return (
    <div
      className={cn("@container flex h-full min-h-0 flex-col", className)}
      style={{ padding: GAP }}
    >
      {/* The board's header: for now just the close button, against the right
          edge. It sits outside the `AnimatePresence` so it doesn't cross paths
          with the content when the board empties out — what changes is what's
          below, and the button stays where it was.

          Always visible, unlike the tiles': those are four, and one per card
          would be noise; this one is a single button and the only way to get
          the column back. */}
      {onClose && (
        <header
          className="flex shrink-0 justify-end"
          style={{ paddingBottom: GAP / 2 }}
        >
          {/* The word and not an ×. A lone glyph above a grid of cards —which
              already carry an × of their own— reads as one more card missing
              its body; the word says what's being talked about without having
              to deduce it from size or position.

              No `aria-label`: the accessible name is the visible text, which is
              what's right when there is one. A label different from the visible
              one leaves anyone driving by voice asking for something that isn't
              written anywhere. */}
          <button
            type="button"
            onClick={onClose}
            style={{ fontSize: typeScale.caption }}
            className={cn(
              "-mt-1 -mr-1 inline-flex shrink-0 items-center justify-center",
              "cursor-pointer rounded-md px-1.5 py-0.5 outline-none",
              "text-muted-foreground transition-colors duration-80 hover:bg-hover hover:text-foreground",
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
            )}
          >
            Close
          </button>
        </header>
      )}

      <div className="min-h-0 flex-1">
      <AnimatePresence mode="wait" initial={false}>
        {widgets.length === 0 ? (
          <AnimatedEmpty key="empty" variant="dashed" className="h-full">
            <AnimatedEmptyHeader>
              <AnimatedEmptyMedia variant="figure" badge={<Plus />} float>
                <LayoutPanelTop />
              </AnimatedEmptyMedia>
              <AnimatedEmptyTitle>The board is empty</AnimatedEmptyTitle>
              <AnimatedEmptyDescription>
                Add a widget and it shows up here, with its glance. Tapping it
                opens the whole thing.
              </AnimatedEmptyDescription>
            </AnimatedEmptyHeader>
            {/* Wrapped and not bare: `AnimatedEmptyContent` is what gives it its
                turn in the cascade. As a plain child the button carries no
                variants, so it appears whole from the first frame while
                everything else is still coming in. */}
            {action && <AnimatedEmptyContent>{action}</AnimatedEmptyContent>}
          </AnimatedEmpty>
        ) : (
          <div
            key="grid"
            className="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-4"
            style={{ gridAutoRows: `${ROW}px`, gap: GAP }}
          >
            {widgets.map((w) => (
              <WidgetTile
                key={w.id}
                widget={w}
                onClose={onWidgetClose && (() => onWidgetClose(w.id))}
                className={SPAN[w.span ?? "1x1"]}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

export { WidgetBoard };
export type { WidgetBoardProps };
