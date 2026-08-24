import { useState, type ReactNode } from "react";
import {
  Check,
  CircleCheck,
  Filter,
  Pause,
  PenLine,
  RotateCcw,
  Telescope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  InsetDialog,
  InsetDialogBody,
  InsetDialogContent,
  InsetDialogFooter,
  InsetDialogHeader,
  InsetDialogGroup,
  InsetDialogTitle,
} from "@/components/inset-dialog";
import type { IconComponent } from "@/lib/icon-context";
import { SizeProvider } from "@/lib/size-context";
import { cn } from "@/lib/utils";
import { Section } from "./Shared";

/* El relevo de un equipo de agentes: cuatro etapas, y un registro que crece.
   Es el caso para el que está pensado el componente — el marco es lo estable
   (quién corre, cuánto va, qué botones hay) y lo del medio es lo que se
   mueve. */
const AGENTS: { id: string; name: string; role: string; icon: IconComponent }[] =
  [
    { id: "triage", name: "Triage", role: "ROUTER", icon: Filter },
    { id: "research", name: "Researcher", role: "ANALYST", icon: Telescope },
    { id: "writer", name: "Writer", role: "AUTHOR", icon: PenLine },
    { id: "review", name: "Reviewer", role: "APPROVER", icon: CircleCheck },
  ];

interface LogEntry {
  stage: number;
  t: string;
  text: string;
  from?: string;
  to?: string;
}

const LOG: LogEntry[] = [
  { stage: 0, t: "0.5s", text: "parsing request intent" },
  { stage: 0, t: "0.9s", text: "scope: churn analysis" },
  { stage: 0, t: "1.4s", text: "picking research route" },
  { stage: 1, t: "1.8s", text: "classified as research", from: "Triage", to: "Researcher" },
  { stage: 1, t: "3.0s", text: "querying Q2 ticket archive" },
  { stage: 1, t: "3.5s", text: "214 tickets matched" },
  { stage: 1, t: "4.1s", text: "clustering by stated reason" },
  { stage: 2, t: "5.2s", text: "handing off findings", from: "Researcher", to: "Writer" },
  { stage: 2, t: "6.0s", text: "drafting summary" },
  { stage: 2, t: "6.8s", text: "6 drivers, ranked by volume" },
  { stage: 2, t: "7.4s", text: "trimming to one page" },
  { stage: 3, t: "8.1s", text: "sending for review", from: "Writer", to: "Reviewer" },
  { stage: 3, t: "8.9s", text: "checking claims against sources" },
  { stage: 3, t: "9.6s", text: "2 claims need a citation" },
  { stage: 3, t: "10.2s", text: "citations resolved" },
  { stage: 3, t: "10.8s", text: "approved" },
];

const STATUS = [
  "clasificando el pedido",
  "leyendo 6 fuentes",
  "escribiendo el resumen",
  "verificando las citas",
];

/* Un agente del relevo. Los tres estados se leen sin texto: el que ya pasó
   lleva su tilde, el que corre está encendido, y los que faltan esperan
   apagados. */
function Agent({
  agent,
  state,
}: {
  agent: (typeof AGENTS)[number];
  state: "done" | "active" | "pending";
}) {
  const Glyph = agent.icon;
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-150",
            state === "active" && "bg-violet-500 text-white shadow-lg shadow-violet-500/30",
            state === "done" && "bg-blue-500/12 text-blue-500",
            state === "pending" && "bg-accent text-muted-foreground"
          )}
        >
          <Glyph size={20} strokeWidth={1.75} />
        </div>
        {state === "done" && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white">
            <Check size={10} strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-[13px]",
            state === "pending" ? "text-muted-foreground" : "text-foreground"
          )}
          style={{ fontVariationSettings: "'wght' 550" }}
        >
          {agent.name}
        </span>
        <span className="text-[10px] tracking-[0.1em] text-muted-foreground">
          {agent.role}
        </span>
      </div>
    </div>
  );
}

/* Un marco con su propio piso, para que el diálogo se portalee adentro en vez
   de sobre la ventana y se puedan mirar dos a la vez. */
function Frame({
  frame,
  className,
  children,
}: {
  frame: (node: HTMLDivElement | null) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={frame}
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface-1 shadow-surface-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function InsetDialogSection() {
  const [handoffFrame, setHandoffFrame] = useState<HTMLDivElement | null>(null);
  const [insetFrame, setInsetFrame] = useState<HTMLDivElement | null>(null);
  const [plainFrame, setPlainFrame] = useState<HTMLDivElement | null>(null);

  const [handoffOpen, setHandoffOpen] = useState(true);
  const [stage, setStage] = useState(1);

  const visible = LOG.filter((e) => e.stage <= stage);
  const elapsed = visible[visible.length - 1]?.t ?? "0.0s";

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="InsetDialog"
        hint="El diálogo con el contenido embutido en su propia tarjeta: cabecera y pie comparten el plano de la bandeja, y lo del medio se levanta. Movés el control de abajo del relevo para ver crecer el registro."
      >
        <div className="flex flex-col gap-4">
          <Frame frame={setHandoffFrame} className="h-[700px]">
            {/* Sin atrape de foco porque está adentro de un marco de la
                página, y sin cierre por clic afuera: el relevo es una
                superficie de trabajo, no una pregunta. */}
            <InsetDialog
              open={handoffOpen}
              onOpenChange={setHandoffOpen}
              modal={false}
              disablePointerDismissal
            >
              <InsetDialogContent
                size="lg"
                container={handoffFrame}
                className="max-w-[460px]"
              >
                <InsetDialogHeader>
                  <InsetDialogTitle>Agent Handoff</InsetDialogTitle>
                  <Badge variant="solid" color="gray" size="compact">
                    {AGENTS.length} agents
                  </Badge>
                  <span className="ml-auto flex items-center gap-2 text-[13px] tabular-nums text-muted-foreground">
                    {elapsed}
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                  </span>
                </InsetDialogHeader>

                <InsetDialogBody>
                  <InsetDialogGroup label="Task" aside="run_7c42">
                    <p className="mt-1 text-[14px] text-foreground">
                      Summarize churn drivers from Q2 tickets
                    </p>
                  </InsetDialogGroup>

                  <InsetDialogGroup>
                    <div className="flex items-start gap-1">
                      {AGENTS.map((agent, i) => (
                        <Agent
                          key={agent.id}
                          agent={agent}
                          state={
                            i < stage ? "done" : i === stage ? "active" : "pending"
                          }
                        />
                      ))}
                    </div>
                    <div className="mt-4 px-2">
                      <Slider
                        aria-label="Etapa del relevo"
                        value={stage}
                        onChange={(v) => setStage(v as number)}
                        min={0}
                        max={AGENTS.length - 1}
                        step={1}
                      />
                    </div>
                  </InsetDialogGroup>

                  <InsetDialogGroup
                    label="Handoff log"
                    aside={`${visible.length} / ${LOG.length}`}
                  >
                    <ul className="mt-2 flex flex-col gap-2">
                      {visible.map((entry, i) => (
                        <li key={i} className="flex items-baseline gap-3">
                          <span className="w-10 shrink-0 text-[12px] tabular-nums text-muted-foreground">
                            {entry.t}
                          </span>
                          <span
                            className={cn(
                              "mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full",
                              entry.from ? "bg-blue-500" : "bg-violet-500/40"
                            )}
                          />
                          <span className="text-[13px] text-foreground">
                            {entry.from && (
                              <span
                                className="mr-2"
                                style={{ fontVariationSettings: "'wght' 550" }}
                              >
                                {entry.from} → {entry.to}
                              </span>
                            )}
                            <span
                              className={entry.from ? "text-muted-foreground" : ""}
                            >
                              {entry.text}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </InsetDialogGroup>
                </InsetDialogBody>

                <InsetDialogFooter>
                  <span className="min-w-0 truncate text-[13px] text-muted-foreground">
                    <span
                      className="text-violet-500"
                      style={{ fontVariationSettings: "'wght' 550" }}
                    >
                      {AGENTS[stage].name}
                    </span>{" "}
                    · {STATUS[stage]}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="tertiary" onClick={() => setStage(0)}>
                      Reset
                    </Button>
                    <Button variant="secondary" leadingIcon={Pause}>
                      Pause
                    </Button>
                    <Button leadingIcon={RotateCcw} onClick={() => setStage(0)}>
                      Restart
                    </Button>
                  </div>
                </InsetDialogFooter>
              </InsetDialogContent>
            </InsetDialog>
          </Frame>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="tertiary"
              size="compact"
              onClick={() => setHandoffOpen(true)}
              disabled={handoffOpen}
            >
              Volver a abrir
            </Button>
            <p className="text-[13px] text-muted-foreground">
              La tarjeta scrollea sola con <code className="text-foreground">scroll-fade</code>;
              la bandeja no se mueve, y por eso el registro puede crecer sin que el
              título ni los botones cambien de lugar.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Los dos planos"
        hint="El mismo contenido en el diálogo del registry y en este. A la izquierda las tres zonas comparten plano y las separa el aire; a la derecha el contenido se levanta y lo que queda alrededor es el marco. En claro la diferencia es #FAFAFA contra #FFFFFF más el anillo de la tarjeta; en oscuro la separa el color — probá el interruptor de arriba."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Frame frame={setPlainFrame} className="h-[340px]">
            <Dialog open modal={false}>
              <DialogContent container={plainFrame} className="max-w-[300px]">
                <DialogHeader>
                  <DialogTitle>Registry Dialog</DialogTitle>
                </DialogHeader>
                <ul className="flex flex-col gap-2 text-[13px] text-muted-foreground">
                  <li>214 tickets analizados</li>
                  <li>6 drivers, ordenados por volumen</li>
                  <li>2 citas pendientes</li>
                </ul>
                <DialogFooter>
                  <Button variant="tertiary" size="compact">
                    Cancelar
                  </Button>
                  <Button size="compact">Aceptar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Frame>

          <Frame frame={setInsetFrame} className="h-[340px]">
            <SizeProvider size="compact">
              <InsetDialog open modal={false}>
                <InsetDialogContent
                  container={insetFrame}
                  className="max-w-[300px]"
                >
                  <InsetDialogHeader>
                    <InsetDialogTitle>InsetDialog</InsetDialogTitle>
                  </InsetDialogHeader>
                  <InsetDialogBody scrollable={false}>
                    <InsetDialogGroup>
                      <ul className="flex flex-col gap-2 text-[12px] text-muted-foreground">
                        <li>214 tickets analizados</li>
                        <li>6 drivers, ordenados por volumen</li>
                        <li>2 citas pendientes</li>
                      </ul>
                    </InsetDialogGroup>
                  </InsetDialogBody>
                  <InsetDialogFooter>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="tertiary">Cancelar</Button>
                      <Button>Aceptar</Button>
                    </div>
                  </InsetDialogFooter>
                </InsetDialogContent>
              </InsetDialog>
            </SizeProvider>
          </Frame>
        </div>
      </Section>
    </div>
  );
}
