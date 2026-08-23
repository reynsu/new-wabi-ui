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
        title="El gesto"
        hint="Pasá el cursor de un botón al vecino sin salir del grupo. La píldora no desaparece para volver a aparecer: se traslada, ajusta su ancho al texto nuevo y hace crossfade del label."
      >
        <div className="pb-16">
          <Toolbar>
            <TravelTooltip side="bottom">
              <TravelTooltipItem label="Nueva nota">
                <Button variant="ghost" size="icon" aria-label="Nueva nota">
                  <PenSquare />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Usar ventana flotante">
                <Button variant="ghost" size="icon" aria-label="Usar ventana flotante">
                  <Copy />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Más…">
                <Button variant="ghost" size="icon" aria-label="Más opciones">
                  <MoreHorizontal />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Alternar panel lateral">
                <Button variant="ghost" size="icon" aria-label="Alternar panel lateral">
                  <PanelRight />
                </Button>
              </TravelTooltipItem>
            </TravelTooltip>
          </Toolbar>
        </div>
      </Section>

      <Section
        title="Abriendo hacia arriba"
        hint="side=&quot;top&quot;. El caret se da vuelta y la píldora se mide desde el borde superior del trigger."
      >
        <div className="pt-16">
          <Toolbar>
            <TravelTooltip side="top">
              <TravelTooltipItem label="Favorito">
                <Button variant="ghost" size="icon" aria-label="Favorito">
                  <Star />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Compartir con el equipo">
                <Button variant="ghost" size="icon" aria-label="Compartir con el equipo">
                  <Share2 />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Mover a la papelera">
                <Button variant="ghost" size="icon" aria-label="Mover a la papelera">
                  <Trash2 />
                </Button>
              </TravelTooltipItem>
            </TravelTooltip>
          </Toolbar>
        </div>
      </Section>

      <Section
        title="Compacto"
        hint="Dentro de un SizeProvider compacto la píldora baja un escalón: 20px de alto y texto de 11px, igual que el resto de los controles."
      >
        <SizeProvider size="compact">
          <div className="pb-16">
            <Toolbar>
              <TravelTooltip side="bottom">
                <TravelTooltipItem label="Buscar">
                  <Button variant="ghost" size="icon" aria-label="Buscar">
                    <Search />
                  </Button>
                </TravelTooltipItem>
                <TravelTooltipItem label="Nueva nota">
                  <Button variant="ghost" size="icon" aria-label="Nueva nota (compacto)">
                    <PenSquare />
                  </Button>
                </TravelTooltipItem>
                <TravelTooltipItem label="Más…">
                  <Button variant="ghost" size="icon" aria-label="Más opciones (compacto)">
                    <MoreHorizontal />
                  </Button>
                </TravelTooltipItem>
              </TravelTooltip>
            </Toolbar>
          </div>
        </SizeProvider>
      </Section>

      <Section
        title="Un solo trigger"
        hint="Sin vecinos entre los que viajar se comporta como un tooltip común, con su espera de 200ms. Por eso el componente no necesita un modo aparte para el caso suelto."
      >
        <div className="pb-16">
          <TravelTooltip side="bottom">
            <TravelTooltipItem label="Guardar una copia en tu espacio">
              <Button variant="secondary">Guardar copia</Button>
            </TravelTooltipItem>
          </TravelTooltip>
        </div>
      </Section>

      <Section
        title="Contra el borde"
        hint="Angostá la ventana hasta empujar esta barra contra el borde derecho. La píldora se frena a 8px del viewport, pero el caret se queda apuntando al botón — por eso van animados por separado."
      >
        <div className="flex justify-end pb-16">
          <Toolbar>
            <TravelTooltip side="bottom">
              <TravelTooltipItem label="Compartir con el equipo">
                <Button variant="ghost" size="icon" aria-label="Compartir (borde)">
                  <Share2 />
                </Button>
              </TravelTooltipItem>
              <TravelTooltipItem label="Alternar panel lateral">
                <Button variant="ghost" size="icon" aria-label="Alternar panel (borde)">
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
