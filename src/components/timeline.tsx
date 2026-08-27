"use client";

/**
 * Timeline — what happened, in the order it happened.
 *
 * Two things get called a timeline and they're the same object: a list of
 * **milestones**, where each one is somewhere along a road and the question is
 * how far we got; and a **feed**, where each entry is something somebody did
 * and the question is what's new. Same anatomy —a rail, a node on it, a line
 * of text and sometimes a body— and what changes is where the time goes: under
 * the title when the row is a paragraph, against the right edge when the row
 * is one sentence. That's the `variant`.
 *
 * Six decisions worth not undoing without looking at the rest:
 *
 * 1. **Each item draws its own piece of rail, and the list draws none.** The
 *    obvious implementation is one line behind everything, positioned from the
 *    first node to the last. It breaks the moment the list changes: an entry
 *    that arrives has to grow the line under it, and a line that belongs to
 *    the container can only jump. Here the segment goes from a node to the
 *    next one and belongs to the item above it, so a new entry brings its own
 *    and the one that was last stops being last — `group-last` hides it, no
 *    index arithmetic and no cloning children to tell them where they are.
 *
 * 2. **The line is drawn, not faded in.** The segment scales from its top, so
 *    the timeline reads as being written downwards instead of appearing whole.
 *    It's the one place this component asks for a beat of its own: the item's
 *    text lands first and the line reaches the next node after it, which is
 *    the order the eye reads them in anyway.
 *
 * 3. **The state is weight, not colour.** `done`, `current` and `upcoming` are
 *    the same circle at three weights —a ring, a filled dot with a halo, a
 *    hairline outline— and the whole upcoming row steps back to
 *    `text-muted-foreground`. Colour is a thing this system spends on badges,
 *    where it means a category; spending it on three states as well leaves the
 *    reader deciding which of the two a green circle is talking about. Whoever
 *    needs it puts a `Badge` in `badge`, which is where the system's colour
 *    lives.
 *
 * 4. **An icon wins over the state.** A feed entry says what kind of thing
 *    happened —a comment, a tag, a merge— and that's an icon in a bubble, not
 *    a point on a road. So `icon` replaces the dot instead of joining it: two
 *    marks in the same 28px would be one mark too many, and the state of a
 *    thing somebody already did is always `done`.
 *
 * 5. **The body is a plane, not a quote.** What hangs off an entry —the text
 *    of a comment, the branch that got merged— goes in `TimelineNote`, which
 *    is a step up with `Elevated` and not a left border or an italic. It's the
 *    same reason the rest of the system uses steps: a quotation mark is a
 *    convention you have to know, a plane is a thing you can see.
 *
 * 6. **It's an `<ol>`.** The order is the content — a timeline whose items can
 *    be read in any order isn't one. Anything driving by keyboard or by voice
 *    gets "list, 6 items" and each item's number for free, which no `div` with
 *    a line down its left side will ever say.
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";

import { Elevated } from "@/lib/elevated";
import type { IconComponent } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { useSizeVariant, useTypeScale } from "@/lib/size-context";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

/* ── The steps ─────────────────────────────────────────────────────────── */

/**
 * The presentation's own beats.
 *
 * `lib/springs` has three and they're for **reactions**: something the pointer
 * touched that has to answer now. A list writing itself out is the other
 * thing, and at a reaction's speed a six-item cascade reads as one flicker.
 * The item still lands on the system's tier —it's a line of text, it doesn't
 * need its own physics— and what gets a beat of its own is the line being
 * drawn, which is longer than the text it follows and starts after it.
 */
const draw = { type: "spring" as const, duration: 0.42, bounce: 0, delay: 0.06 };

/** The list hands out turns and animates nothing itself. `delayChildren` is
 *  the breath before the first item: without it the first one comes in on the
 *  frame the list mounts and there's no cascade to see. */
const listVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.05, staggerChildren: 0.07 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: spring.moderate },
  /** Faster than the entry, like everything else in the house. */
  exit: { opacity: 0, y: -4, transition: spring.fast.exit },
} as const;

const railVariants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: draw },
  exit: { opacity: 0, transition: spring.fast.exit },
} as const;

/* ── Types ─────────────────────────────────────────────────────────────── */

/** Where the time goes, which is the only thing the two shapes disagree on.
 *  `milestones`: under the title, because the row is a paragraph.
 *  `feed`: against the right edge, because the row is a sentence. */
type TimelineVariant = "milestones" | "feed";

/** How far along the road this one is — drawn as weight, see decision 3. */
type TimelineState = "done" | "current" | "upcoming";

interface TimelineContextValue {
  variant: TimelineVariant;
}

const TimelineContext = createContext<TimelineContextValue>({
  variant: "milestones",
});

interface TimelineProps {
  variant?: TimelineVariant;
  children: ReactNode;
  className?: string;
}

/**
 * The list. It writes itself out top to bottom on mount and hands out the
 * turns; an item that arrives later isn't part of that round and comes in on
 * its own, which is what an entry landing on a feed should look like.
 */
function Timeline({ variant = "milestones", children, className }: TimelineProps) {
  return (
    <TimelineContext.Provider value={{ variant }}>
      <motion.ol
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className={cn("flex flex-col", className)}
      >
        {children}
      </motion.ol>
    </TimelineContext.Provider>
  );
}

interface TimelineItemProps {
  /** Ignored when there's an `icon` — see decision 4. @default "done" */
  state?: TimelineState;
  /** What kind of thing happened. Drawn in a bubble, in place of the dot. */
  icon?: IconComponent;
  /** The row itself: a milestone's name, or the whole sentence of an entry.
   *  A node so a feed can set the actor in `font-medium` and leave the verb
   *  in the muted weight, which is how a sentence like that is read. */
  title: ReactNode;
  /** The date, the time, the "2 days ago". */
  meta?: ReactNode;
  /** Next to the title. A `Badge` from the registry, usually. */
  badge?: ReactNode;
  /** The description, or a `TimelineNote`. */
  children?: ReactNode;
  className?: string;
}

function TimelineItem({
  state = "done",
  icon: Icon,
  title,
  meta,
  badge,
  children,
  className,
}: TimelineItemProps) {
  const { variant } = useContext(TimelineContext);
  const compact = useSizeVariant() === "compact";
  const type = useTypeScale();

  /* The node's box is also the rail's column, so the text of every row lines
     up whether the node is a 10px dot or a 28px bubble. */
  const node = Icon ? (compact ? 24 : 28) : compact ? 10 : 12;
  /* The air under a row, which is also how much rail there is between one node
     and the next. A feed is a list of lines and breathes less than a list of
     paragraphs. */
  const gap = variant === "feed" ? (compact ? 16 : 20) : compact ? 18 : 24;

  const upcoming = !Icon && state === "upcoming";

  /* Where the rail starts and stops: under the mark and above the next one,
     with a breath at each end. A dot takes the nudge that puts it on the
     title's optical centre; a bubble doesn't —it's tall enough to line up with
     the text on its own— and it gets the tighter breath, because a bubble that
     tall against a one-line row leaves little between one and the next and
     what's left has to read as a line. */
  const railTop = Icon ? node + 1 : node + 6;
  const railBottom = Icon ? 1 : 2;

  return (
    <motion.li
      variants={itemVariants}
      /* An item that arrives with the list already mounted makes its own room:
         the ones under it slide down instead of jumping. */
      layout="position"
      className={cn("group/item relative grid gap-x-3", className)}
      style={{
        gridTemplateColumns: `${node}px minmax(0, 1fr)`,
        // A variable and not a padding on the row: the air has to live *inside*
        // the grid or the node's column can't stretch over it, and then the
        // rail stops short of the next node. It hangs off the row so both
        // columns can read it. See the note on the content column.
        ["--tl-gap" as string]: `${gap}px`,
      }}
    >
      {/* The node's column. It stretches to the whole row —air included— which
          is what lets the rail reach the node underneath. */}
      <div className="relative flex justify-center">
        <TimelineNode state={state} icon={Icon} size={node} />

        {/* The segment down to the next node. It belongs to this item —
            decision 1— so the last one simply doesn't draw it. */}
        <motion.span
          aria-hidden
          variants={railVariants}
          className={cn(
            "absolute w-px origin-top bg-border",
            "group-last/item:hidden"
          )}
          style={{ top: railTop, bottom: railBottom, left: "50%", translateX: "-50%" }}
        />
      </div>

      {/* The row, and the air under it — which is the padding that was on the
          item and had to come inside. `min-w-0` so a long title truncates
          instead of pushing the time off the edge. The last row drops it: a
          timeline that ends in air ends twice. */}
      <div className="flex min-w-0 flex-col gap-1 pb-[var(--tl-gap)] group-last/item:pb-0">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "min-w-0 font-medium",
              upcoming && "text-muted-foreground"
            )}
            style={{ fontSize: type.body }}
          >
            {title}
          </span>
          {badge}

          {/* In a feed the time is part of the line and goes to the far end;
              in a list of milestones it's a caption of its own, below. */}
          {meta && variant === "feed" && (
            <span
              className="ml-auto shrink-0 whitespace-nowrap text-muted-foreground"
              style={{ fontSize: type.caption }}
            >
              {meta}
            </span>
          )}
        </div>

        {meta && variant === "milestones" && (
          <span
            className="text-muted-foreground"
            style={{ fontSize: type.caption }}
          >
            {meta}
          </span>
        )}

        {children && (
          <div
            className={cn("text-muted-foreground", upcoming && "opacity-70")}
            style={{ fontSize: type.body }}
          >
            {children}
          </div>
        )}
      </div>
    </motion.li>
  );
}

/**
 * The mark on the rail: a bubble when the item says what kind of thing
 * happened, and one of three weights of the same circle when it says how far
 * along it is.
 */
function TimelineNode({
  state,
  icon: Icon,
  size,
}: {
  state: TimelineState;
  icon?: IconComponent;
  size: number;
}) {
  if (Icon) {
    return (
      <Elevated
        offset={1}
        className="flex shrink-0 items-center justify-center rounded-full text-muted-foreground"
        style={{ width: size, height: size }}
      >
        <Icon size={Math.round(size * 0.5)} strokeWidth={1.75} />
      </Elevated>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "mt-1 shrink-0 rounded-full",
        /* done — a ring: the thing closed and the road went through it.
           current — filled, with a halo of the interaction token so it reads
           as the live one without spending a colour on it.
           upcoming — a hairline, the same weight as the rail it sits on. */
        /* The centre is left transparent on purpose: a ring's hole is whatever
           plane the timeline landed on, and naming a colour there —`background`,
           say— guesses at a substrate that in this system is a ladder. */
        state === "done" && "border-[1.5px] border-foreground",
        state === "current" &&
          "bg-foreground shadow-[0_0_0_4px_var(--hover),0_0_0_5px_var(--active)]",
        state === "upcoming" && "border border-border"
      )}
      style={{ width: size, height: size }}
    />
  );
}

interface TimelineNoteProps {
  /** For what was written by a machine and not by a person: a branch, a
   *  command, an id. */
  mono?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * What hangs off an entry, on its own plane — decision 5. It's `Elevated` and
 * not a fixed surface class so it keeps working wherever the timeline lands:
 * on a page, inside a card, inside a dialog.
 */
function TimelineNote({ mono = false, children, className }: TimelineNoteProps) {
  const shape = useShape();
  const type = useTypeScale();

  return (
    <Elevated
      offset={1}
      className={cn(
        "mt-1 px-3 py-2 text-foreground",
        mono && "font-mono",
        shape.bg,
        className
      )}
      style={{ fontSize: mono ? type.caption : type.body }}
    >
      {children}
    </Elevated>
  );
}

export { Timeline, TimelineItem, TimelineNote };
export type {
  TimelineProps,
  TimelineItemProps,
  TimelineNoteProps,
  TimelineVariant,
  TimelineState,
};
