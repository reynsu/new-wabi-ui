"use client";

/**
 * MobileAuthBlock — the same sign-in screen, for the shape held in one hand.
 *
 * `LoginBlock` splits the screen in two: a brand plane that asks for nothing on
 * the left, and the only column where there's something to do on the right.
 * That asymmetry is what steers the eye, and on a phone there's no room for it
 * — two columns become two screens' worth of scrolling, and the plane, which
 * exists to accompany, ends up above the fold competing with the form.
 *
 * So the split stops being horizontal and becomes depth: the plane takes the
 * **whole** screen —edge to edge, and under everything— and what's actionable
 * comes together on a card that floats at the floor, with the plane running
 * under it and out its sides. Same product, same pieces —the same fields,
 * the same notice, the same providers, the same theme knobs— and it is a
 * variant and not a redesign: they're imported from `LoginBlock`, so a change
 * to a field lands on both screens at once.
 *
 * Five decisions worth not undoing without looking at the rest:
 *
 * 1. **The card sits at the floor, and floats.** At the floor because that's
 *    where the thumb reaches —the same reason `MobileActionConfirmation` lands
 *    there— and a form centred on a 700px-tall screen puts its submit button in
 *    the one place the hand has to be rearranged to touch. Floating, with the
 *    plane running under it and out its sides, because the plane *is* the
 *    screen here: a sheet welded to the bottom edge cuts the image in half and
 *    what's left reads as a header over a form, which is the two-column split
 *    again, stacked.
 *
 * 2. **The background is `LoginBlock`'s plane, edge to edge.** The same
 *    gradient the desktop block paints on its left-hand side, in the same two
 *    keys — they're siblings, and siblings that don't look alike are two
 *    products. It covers the whole screen and every other layer sits on it.
 *    `background` swaps it for anything else —an `<img>`, a video, a canvas—
 *    and whatever lands there gets the scrims, because the ink above is white
 *    and a photograph isn't a promise about its own brightness.
 *
 * 3. **The hero gives, the card doesn't.** What's above —the logo, the
 *    headline, the sentence— is the part that can lose room on a short screen,
 *    and it's what shrinks. The card keeps its size until it hits its ceiling
 *    and only then scrolls inside itself: the form is the reason the screen
 *    exists.
 *
 * 4. **No grab handle.** The card doesn't drag —there's nothing under it and
 *    nowhere to send it— and a handle is a promise of a gesture. The house
 *    rule, the same one that keeps a board with no `onReorder` from drawing a
 *    grab cursor: an affordance that leads nowhere is worse than no affordance.
 *
 * 5. **It paints itself in its own theme**, like its sibling: the `.light` /
 *    `.dark` class goes on the block's root and the tokens cascade inwards, so
 *    not one `dark:` utility is used inside — that variant is `&:is(.dark *)`
 *    and a light block hanging off a dark app would keep matching it.
 */

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  ERROR_GLOW,
  ErrorMark,
  Field,
  GitHubMark,
  PANEL_ART,
  PANEL_INK,
  THEME_OPTIONS,
  useSystemScheme,
  type LoginBlockProps,
  type LoginBlockTheme,
} from "@/components/login-block";
import { useMeasuredHeight } from "@/hooks/use-measured-height";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

/**
 * The scrim: one layer over the whole screen, and it never ends where anyone
 * can see it end.
 *
 * It has to do two jobs at two heights —the logo against the ceiling, the
 * headline just above the card— and in between it has to let go, or the image
 * stops being an image. The obvious way to get the second one is a gradient
 * anchored to the hero, which is what this did for a while: it reached its
 * darkest exactly at the hero's bottom edge and stopped there, and since the
 * plane keeps going underneath, that step printed **a line across the screen**
 * at the card's top edge. The card stopped floating and started being the
 * bottom half of a split.
 *
 * So the layer covers everything and the ramp is placed against the card's
 * measured height: it darkens over the 140px above the card —where the
 * headline lives, whatever the card measures— and then *stays* at that value
 * down to the floor, where it's behind the card and beside it, and there's no
 * edge left to see.
 *
 * Black and not a tint, so it doesn't argue with the colour of what it falls on.
 */
const scrimFor = (foot: number) =>
  [
    "linear-gradient(180deg,",
    "rgba(0,0,0,0.46) 0px,",
    "rgba(0,0,0,0.10) 24%,",
    `rgba(0,0,0,0.10) calc(100% - ${foot}px - 140px),`,
    `rgba(0,0,0,0.48) calc(100% - ${foot}px),`,
    "rgba(0,0,0,0.48) 100%)",
  ].join(" ");

/** The air around the card. Small on purpose: enough for the plane to be seen
 *  running past the card's edges —which is what says the screen is one image
 *  with a card on it— and not so much that the card reads as a dialog dropped
 *  on a page. The floor's own inset takes the home bar into account on top of
 *  this.
 *
 *  One number, used by the layout and by the scrim's ramp: if they disagreed,
 *  the ramp would land a few pixels off the card's edge and the seam it exists
 *  to avoid would be back. */
const CARD_INSET = 8;

interface MobileAuthBlockProps extends LoginBlockProps {
  /** What goes behind everything. Left alone it's the same plane the desktop
   *  block paints on its left-hand side. */
  background?: ReactNode;
}

function MobileAuthBlock({
  logo,
  title,
  description,
  background,
  error = null,
  pending = false,
  theme: themeProp,
  defaultTheme = "system",
  onThemeChange,
  onSubmit,
  onGitHub,
  onForgotPassword,
  onSignUp,
  className,
}: MobileAuthBlockProps) {
  const [uncontrolledTheme, setUncontrolledTheme] =
    useState<LoginBlockTheme>(defaultTheme);
  const theme = themeProp ?? uncontrolledTheme;
  const systemScheme = useSystemScheme();
  const resolved = theme === "system" ? systemScheme : theme;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fieldId = useId();

  /* Where the card starts, which is what the scrim's ramp is placed against —
     see the note on `scrimFor`. Measured and not guessed: the card's height is
     the form's, and the form is whatever whoever uses this put in it. */
  const [cardRef, cardHeight] = useMeasuredHeight<HTMLDivElement>();
  const foot = (cardHeight ?? 0) + CARD_INSET;

  const selectTheme = (next: LoginBlockTheme) => {
    if (themeProp === undefined) setUncontrolledTheme(next);
    onThemeChange?.(next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <div
      className={cn(
        resolved,
        "relative isolate flex h-full flex-col overflow-hidden bg-surface-1 text-foreground",
        className,
      )}
    >
      {/* The background, and the scrim that makes the ink above it legible —
          decision 2. Both are `-z-10` and not a parent of the content: an
          `<img>` that had to contain the screen would need the screen to know
          it's an image. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
        style={background ? undefined : { background: PANEL_ART[resolved] }}
      >
        {background}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: scrimFor(foot) }}
      />

      {/* The hero. `min-h-0` is what makes it the one that gives on a short
          screen — decision 3. It carries no `aria-hidden`: the theme knobs are
          focusable, and marking a container with controls as hidden lets the
          tab key land on something the screen reader doesn't announce. */}
      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-hidden p-6 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className={PANEL_INK.ink}>{logo}</div>

          <div className="flex shrink-0 items-center gap-1">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={active}
                  onClick={() => selectTheme(option.value)}
                  className={cn(
                    "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg",
                    "outline-none transition-colors duration-100",
                    "focus-visible:ring-1",
                    PANEL_INK.focus,
                    active ? PANEL_INK.knobOn : PANEL_INK.knobOff,
                  )}
                >
                  {active && (
                    <motion.span
                      /* One background travelling between the three, as in the
                         desktop block. The id carries this instance's, so two
                         blocks on the same screen aren't read as one object in
                         two places. */
                      layoutId={`mobile-auth-theme-${fieldId}`}
                      transition={spring.moderate}
                      className={cn(
                        "absolute inset-0 rounded-lg ring-1 ring-inset",
                        PANEL_INK.knobBg,
                      )}
                    />
                  )}
                  <Icon className="relative h-[15px] w-[15px]" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex max-w-[24ch] flex-col gap-2">
          <h2
            className={cn(
              "text-balance font-medium leading-[1.08] tracking-[-0.03em]",
              PANEL_INK.ink,
            )}
            style={{ fontSize: "clamp(1.5rem, 8cqi, 2rem)" }}
          >
            {title}
          </h2>
          <p className={cn("text-[13px] leading-relaxed", PANEL_INK.body)}>
            {description}
          </p>
        </div>
      </div>

      {/* The card. It comes up on `spring.slow`, the step this system keeps for
          a change of context — the same one the mobile sheet and the dialog
          take. */}
      <motion.div
        ref={cardRef}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring.slow}
        style={{
          marginInline: CARD_INSET,
          // The floor's inset is the same air, unless the device asks for more:
          // on a phone with a home bar the bottom of the screen isn't the
          // bottom of the screen.
          marginBottom: `max(${CARD_INSET}px, env(safe-area-inset-bottom))`,
        }}
        className={cn(
          "relative flex max-h-[86%] shrink-0 flex-col",
          // No plane of its own: this is the group —the card and the line under
          // it— and the plane has to keep running behind both. Its sibling's
          // frame is a surface because over there it sits on the page; here
          // anything opaque at this level is a hole in the image.
        )}
      >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] bg-surface-3 shadow-surface-6">
        {/* The notice pushes, it doesn't cover: it lands at the top of the card
            and moves the form down. A toast would leave on its own and a modal
            would cover the fields that need fixing. It's inside the card and
            not above it because above it there's no surface any more — only the
            plane, and a notice printed on a photograph is a caption. */}
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key="error"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring.moderate}
              className="overflow-hidden"
            >
              <div className="relative flex items-center justify-center gap-2 px-4 py-3">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -top-8 bottom-0"
                  style={{ background: ERROR_GLOW }}
                />
                <ErrorMark className="relative h-4 w-4 shrink-0 text-destructive" />
                <p
                  role="alert"
                  className="relative text-[13px] font-medium text-destructive"
                >
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* What scrolls when the card runs out of room. */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-fade">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 px-5 pt-5 pb-4"
          >
            <Field
              id={`${fieldId}-email`}
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />

            <Field
              id={`${fieldId}-password`}
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              action={
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="cursor-pointer rounded text-[13px] text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  Forgot your password?
                </button>
              }
            />

            <Button type="submit" className="mt-1 w-full" disabled={pending}>
              {pending ? "Signing in…" : "Continue"}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
                OR
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              leadingIcon={GitHubMark}
              onClick={onGitHub}
              disabled={pending}
            >
              Continue with GitHub
            </Button>
          </form>
        </div>

        {/* The way to the other half of the product, and it stays on the card:
            outside there's only the plane, and a line of text printed on a
            photograph is a caption — the same reason the notice lives in here.
            Below the scroller and not inside it, so it doesn't scroll away with
            the form. */}
        <p className="shrink-0 px-4 pb-4 text-center text-[13px] text-muted-foreground">
          Don't have an account yet?{" "}
          <button
            type="button"
            onClick={onSignUp}
            className="cursor-pointer rounded font-medium text-foreground outline-none transition-opacity duration-100 hover:opacity-70 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
          >
            Sign up
          </button>
        </p>
      </div>
      </motion.div>
    </div>
  );
}

export { MobileAuthBlock };
export type { MobileAuthBlockProps };
