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
      <Section title="La escalera" hint="Ocho pares de fondo y sombra. En claro se aplana a blanco después del paso 2; en oscuro sigue sumando opacidad.">
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

      <Section title="Elevated" hint="Cada capa sube un escalón sobre el sustrato que la contiene — sin pasarse nada entre componentes.">
        <Elevated offset={0} className="w-full max-w-md rounded-2xl p-4">
          <p className="mb-3 text-[13px] text-muted-foreground">Página · nivel 1</p>
          <Elevated offset={1} className="rounded-xl p-4">
            <p className="mb-3 text-[13px] text-muted-foreground">Card · nivel 2</p>
            <Elevated offset={2} className="rounded-xl p-4">
              <p className="mb-3 text-[13px] text-muted-foreground">Popover · nivel 4</p>
              <Elevated offset={1} className="rounded-lg p-4">
                <p className="text-[13px] text-muted-foreground">Menú · nivel 5</p>
              </Elevated>
            </Elevated>
          </Elevated>
        </Elevated>
      </Section>

      <Section title="Sustrato en la práctica" hint="Abrí el select dentro del diálogo: su fondo se separa del panel porque lee el nivel del contexto, no un color fijo.">
        <Row>
          <Dialog>
            <DialogTrigger render={<Button variant="secondary" />}>Abrir diálogo</DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Invitar a tu workspace</DialogTitle>
                <DialogDescription>
                  El select de abajo se eleva sobre el diálogo, no sobre la página.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-2">
                <Select defaultValue="member">
                  <SelectTrigger className="w-full" placeholder="Elegí un rol" />
                  <SelectContent>
                    <SelectItem index={0} value="owner">Owner del workspace</SelectItem>
                    <SelectItem index={1} value="member">Miembro</SelectItem>
                    <SelectItem index={2} value="restricted">Miembro restringido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="tertiary" />}>Cancelar</DialogClose>
                <DialogClose render={<Button />}>Enviar invitaciones</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="tertiary" onClick={() => setDrawer(true)}>Abrir drawer</Button>
          <MobileDrawer open={drawer} onClose={() => setDrawer(false)}>
            <div className="flex flex-col gap-3 p-6">
              <h3 className="text-[15px] font-medium">Drawer</h3>
              <p className="text-[13px] text-muted-foreground">
                Entra con spring.slow y se arrastra para cerrar. Es la variante móvil del diálogo.
              </p>
              <Button variant="tertiary" onClick={() => setDrawer(false)}>Cerrar</Button>
            </div>
          </MobileDrawer>
        </Row>
      </Section>

      <Section title="Card" hint="Un solo componente: apilado, en línea o en grilla, con resalte por proximidad en dos dimensiones.">
        <CardGroup columns={2} className="max-w-2xl">
          <Card index={0}>
            <CardHeader>
              <CardTitle>Proximity hover</CardTitle>
              <CardDescription>El resalte sigue al puntero entre tarjetas vecinas.</CardDescription>
            </CardHeader>
            <CardContent className="text-[13px] text-muted-foreground">
              Movete despacio sobre la grilla.
            </CardContent>
          </Card>
          <Card index={1}>
            <CardHeader>
              <CardTitle>Tokens de superficie</CardTitle>
              <CardDescription>--surface-1…8 más sus sombras encadenadas.</CardDescription>
            </CardHeader>
            <CardContent className="text-[13px] text-muted-foreground">
              Instalados por el item <code>surfaces</code>.
            </CardContent>
          </Card>
          <Card index={2}>
            <CardFeature icon={Sparkles} title="Motion" description="Tres springs compartidos" />
          </Card>
          <Card index={3}>
            <CardFeature icon={Rocket} title="Sizes" description="36px default, 28px compact" />
          </Card>
          <Card index={4}>
            <CardFeature icon={Users} title="Surfaces" description="Ocho niveles que anidan" />
          </Card>
        </CardGroup>
      </Section>
    </div>
  );
}
