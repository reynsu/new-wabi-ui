import { useState } from "react";
import { Rocket, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFeature,
  CardGroup,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Elevated } from "@/lib/elevated";
import { surfaceClasses } from "@/lib/surface-classes";
import { Row, Section } from "./Shared";

export function SurfacesSection() {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="flex flex-col gap-14">
      <Section title="The ladder" hint="Eight pairs of background and shadow. In light it flattens to white after step 2; in dark it keeps adding opacity.">
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
            <div
              key={level}
              className={`${surfaceClasses(level)} flex h-20 w-20 items-center justify-center rounded-xl text-[13px] text-muted-foreground`}
            >
              {level}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevated" hint="Each layer climbs a step over the substrate that contains it — with nothing passed between components.">
        <Elevated offset={0} className="w-full max-w-md rounded-2xl p-4">
          <p className="mb-3 text-[13px] text-muted-foreground">Page · level 1</p>
          <Elevated offset={1} className="rounded-xl p-4">
            <p className="mb-3 text-[13px] text-muted-foreground">Card · level 2</p>
            <Elevated offset={2} className="rounded-xl p-4">
              <p className="mb-3 text-[13px] text-muted-foreground">Popover · level 4</p>
              <Elevated offset={1} className="rounded-lg p-4">
                <p className="text-[13px] text-muted-foreground">Menu · level 5</p>
              </Elevated>
            </Elevated>
          </Elevated>
        </Elevated>
      </Section>

      <Section title="Substrate in practice" hint="Open the select inside the dialog: its background separates from the panel because it reads the level from context, not a fixed colour.">
        <Row>
          <Dialog>
            <DialogTrigger render={<Button variant="secondary" />}>Open a dialog</DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Invite to your workspace</DialogTitle>
                <DialogDescription>
                  The select below rises over the dialog, not over the page.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-2">
                <Select defaultValue="member">
                  <SelectTrigger className="w-full" placeholder="Pick a role" />
                  <SelectContent>
                    <SelectItem index={0} value="owner">Workspace owner</SelectItem>
                    <SelectItem index={1} value="member">Member</SelectItem>
                    <SelectItem index={2} value="restricted">Restricted member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="tertiary" />}>Cancel</DialogClose>
                <DialogClose render={<Button />}>Send invitations</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="tertiary" onClick={() => setDrawer(true)}>Open a drawer</Button>
          <MobileDrawer open={drawer} onClose={() => setDrawer(false)}>
            <div className="flex flex-col gap-3 p-6">
              <h3 className="text-[15px] font-medium">Drawer</h3>
              <p className="text-[13px] text-muted-foreground">
                It comes in with spring.slow and is dragged to close. It's the dialog's mobile variant.
              </p>
              <Button variant="tertiary" onClick={() => setDrawer(false)}>Close</Button>
            </div>
          </MobileDrawer>
        </Row>
      </Section>

      <Section title="Card" hint="A single component: stacked, inline or in a grid, with proximity highlighting in two dimensions.">
        <CardGroup columns={2} className="max-w-2xl">
          <Card index={0}>
            <CardHeader>
              <CardTitle>Proximity hover</CardTitle>
              <CardDescription>The highlight follows the pointer between neighbouring cards.</CardDescription>
            </CardHeader>
            <CardContent className="text-[13px] text-muted-foreground">
              Move slowly over the grid.
            </CardContent>
          </Card>
          <Card index={1}>
            <CardHeader>
              <CardTitle>Surface tokens</CardTitle>
              <CardDescription>--surface-1…8 plus their chained shadows.</CardDescription>
            </CardHeader>
            <CardContent className="text-[13px] text-muted-foreground">
              Installed by the <code>surfaces</code> item.
            </CardContent>
          </Card>
          <Card index={2}>
            <CardFeature icon={Sparkles} title="Motion" description="Three shared springs" />
          </Card>
          <Card index={3}>
            <CardFeature icon={Rocket} title="Sizes" description="36px default, 28px compact" />
          </Card>
          <Card index={4}>
            <CardFeature icon={Users} title="Surfaces" description="Eight levels that nest" />
          </Card>
        </CardGroup>
      </Section>
    </div>
  );
}
