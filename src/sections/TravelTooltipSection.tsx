import {
  Copy,
  MoreHorizontal,
  PanelRight,
  PenSquare,
  Search,
  Share2,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TravelTooltip, TravelTooltipItem } from "@/components/travel-tooltip";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "./Shared";

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex rounded-full bg-surface-3 p-1 shadow-surface-2">
      {children}
    </div>
  );
}

export function TravelTooltipSection() {
  return (
    <div className="flex flex-col gap-14">
      <Section
        title="The gesture"
        hint="Move the cursor from one button to its neighbour without leaving the group. The pill doesn't disappear only to reappear: it travels, fits its width to the new text and crossfades the label."
      >
        <div className="pb-16">
          <Toolbar>
            <TravelTooltip side="bottom">
              <TravelTooltipItem label="New note">
                <Button variant="ghost" size="icon" aria-label="New note">
                  <PenSquare />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Use floating window">
                <Button variant="ghost" size="icon" aria-label="Use floating window">
                  <Copy />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="More…">
                <Button variant="ghost" size="icon" aria-label="More options">
                  <MoreHorizontal />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Toggle side panel">
                <Button variant="ghost" size="icon" aria-label="Toggle side panel">
                  <PanelRight />
                </Button>
              </TravelTooltipItem>
            </TravelTooltip>
          </Toolbar>
        </div>
      </Section>

      <Section
        title="Opening upwards"
        hint="side=&quot;top&quot;. The caret flips and the pill is measured from the trigger's top edge."
      >
        <div className="pt-16">
          <Toolbar>
            <TravelTooltip side="top">
              <TravelTooltipItem label="Favourite">
                <Button variant="ghost" size="icon" aria-label="Favourite">
                  <Star />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Share with the team">
                <Button variant="ghost" size="icon" aria-label="Share with the team">
                  <Share2 />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Move to trash">
                <Button variant="ghost" size="icon" aria-label="Move to trash">
                  <Trash2 />
                </Button>
              </TravelTooltipItem>
            </TravelTooltip>
          </Toolbar>
        </div>
      </Section>

      <Section
        title="Compact"
        hint="Inside a compact SizeProvider the pill drops a step: 20px tall and 11px text, same as the rest of the controls."
      >
        <SizeProvider size="compact">
          <div className="pb-16">
            <Toolbar>
              <TravelTooltip side="bottom">
                <TravelTooltipItem label="Search">
                  <Button variant="ghost" size="icon" aria-label="Search">
                    <Search />
                  </Button>
                </TravelTooltipItem>
                <TravelTooltipItem label="New note">
                  <Button variant="ghost" size="icon" aria-label="New note (compact)">
                    <PenSquare />
                  </Button>
                </TravelTooltipItem>
                <TravelTooltipItem label="More…">
                  <Button variant="ghost" size="icon" aria-label="More options (compact)">
                    <MoreHorizontal />
                  </Button>
                </TravelTooltipItem>
              </TravelTooltip>
            </Toolbar>
          </div>
        </SizeProvider>
      </Section>

      <Section
        title="A single trigger"
        hint="With no neighbours to travel between it behaves like a plain tooltip, with its 200ms wait. That's why the component needs no separate mode for the lone case."
      >
        <div className="pb-16">
          <TravelTooltip side="bottom">
            <TravelTooltipItem label="Save a copy in your space">
              <Button variant="secondary">Save a copy</Button>
            </TravelTooltipItem>
          </TravelTooltip>
        </div>
      </Section>

      <Section
        title="Against the edge"
        hint="Narrow the window until this bar is pushed against the right edge. The pill stops 8px from the viewport, but the caret keeps pointing at the button — which is why they're animated separately."
      >
        <div className="flex justify-end pb-16">
          <Toolbar>
            <TravelTooltip side="bottom">
              <TravelTooltipItem label="Share with the team">
                <Button variant="ghost" size="icon" aria-label="Share (edge)">
                  <Share2 />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Toggle side panel">
                <Button variant="ghost" size="icon" aria-label="Toggle panel (edge)">
                  <PanelRight />
                </Button>
              </TravelTooltipItem>
            </TravelTooltip>
          </Toolbar>
        </div>
      </Section>
    </div>
  );
}
