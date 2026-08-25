import { useRef, useState } from "react";

import { WindowControls } from "@/components/window-controls";
import { MenuItem } from "@/components/ui/menu-item";
import { useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Section } from "./Shared";

/** Lo que se ve dentro de la ventana flotante. Es React normal: va por un
 *  portal al documento de la ventana nueva, con los estilos clonados. */
function FloatingPanel() {
  return (
    <div className="flex h-full flex-col justify-between bg-surface-1 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-medium">Fluid Functionalism</p>
        <p className="text-[12px] text-muted-foreground">
          This lives in another window of the operating system, but it's still
          the same React tree.
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Close it from its own × or from the button in the bar.
      </p>
    </div>
  );
}

/** Espejo del estado del sidebar, para comprobar que el botón opera sobre el
 *  de verdad y no sobre una copia local. */
function SidebarState() {
  const { state, open, isMobile, side, shortcut } = useSidebar();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge color={open ? "green" : "gray"} size="compact">
        {state}
      </Badge>
      <Badge color="blue" size="compact">
        side: {side}
      </Badge>
      <Badge color="violet" size="compact">
        {isMobile ? "mobile" : "desktop"}
      </Badge>
      {shortcut && (
        <span className="text-[12px] text-muted-foreground">
          shortcut: <kbd className="font-mono">{shortcut}</kbd>
        </span>
      )}
    </div>
  );
}

export function WindowControlsSection() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { setWidth } = useSidebar();
  const [notas, setNotas] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="The bar"
        hint="Four controls with a single TravelTooltip, which always opens downwards. New note, a floating window through Document Picture-in-Picture, a “More…” menu and the side panel through useSidebar()."
      >
        <div className="pb-20">
          <WindowControls
            floatingContent={<FloatingPanel />}
            onCompose={() => setNotas((n) => [...n, `Note ${n.length + 1}`])}
            moreItems={(i) => (
              <>
                <MenuItem
                  index={i}
                  label="Reset the panel width"
                  onSelect={() => setWidth("16rem")}
                />
                <MenuItem
                  index={i + 1}
                  label="Clear the notes"
                  disabled={notas.length === 0}
                  onSelect={() => setNotas([])}
                />
              </>
            )}
          />
        </div>

        <SidebarState />

        {notas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notas.map((n) => (
              <Badge key={n} color="teal" size="compact">
                {n}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="The “More…” menu"
        hint="Full screen and the floating window live in here; the extra items are supplied by whoever uses the component through moreItems, which takes the index to carry on from."
      >
        <p className="text-[13px] text-muted-foreground">
          While the menu is open that item is silenced
          (<code>suppressed</code>): the popup unfolds exactly where the pill
          would go, and since it appears under the cursor no mouseleave would
          ever arrive to close it on its own.
        </p>
      </Section>

      <Section
        title="The label follows the state"
        hint="Every label reflects the current state: “Use” ⇄ “Close”, “Hide” ⇄ “Show”. When the text changes the pill remeasures and animates its width, the same mechanism as the travel but fired by state instead of by the pointer."
      >
        <p className="text-[13px] text-muted-foreground">
          It's what forced the labels to move from a ref into state in
          TravelTooltip: in a ref, changing an item's text didn't re-render the
          parent and the pill kept the previous one.
        </p>
        <p className="text-[13px] text-muted-foreground">
          Whether the tooltip stays open after a press depends on the button and
          not on the component: the floating-window one moves nothing and the
          pill readjusts in place, while the side-panel one rearranges the page
          and the button slips out from under the cursor, so the tooltip closes —
          as it should.
        </p>
      </Section>

      <Section
        title="Bounded full screen"
        hint="fullscreenTarget points at a specific element instead of the whole document: only this card goes full screen. It's in the “More…” menu."
      >
        <div
          ref={panelRef}
          className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-6 shadow-surface-2"
        >
          <p className="text-[13px] text-muted-foreground">
            This card is the target. Full screen it takes everything, with the
            rest of the page left out.
          </p>
          <div className="pb-20">
            <WindowControls
              sidebar={false}
              fullscreenTarget={() => panelRef.current}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Without the sidebar"
        hint="sidebar={false} leaves that button out and, with it, the call to useSidebar() — which throws outside a SidebarProvider. That's why that button lives in a subcomponent of its own."
      >
        <div className="pb-20">
          <WindowControls sidebar={false} size="compact" />
        </div>
      </Section>
    </div>
  );
}
