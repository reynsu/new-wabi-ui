import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  CircleDot,
  GitMerge,
  MessageSquare,
  Tag,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timeline, TimelineItem, TimelineNote } from "@/components/timeline";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "@/sections/Shared";

/** Bloque de código, igual que en las otras páginas propias. */
function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 text-[12px] leading-relaxed shadow-surface-1">
      <code className="font-mono">{children.trim()}</code>
    </pre>
  );
}

/** El actor va en negrita y el verbo en gris: una entrada de feed es una
 *  oración, y lo que se busca al barrerla con el ojo es quién. */
function Hizo({ quien, que }: { quien: string; que: string }) {
  return (
    <>
      <span className="font-medium">{quien}</span>{" "}
      <span className="font-normal text-muted-foreground">{que}</span>
    </>
  );
}

/** Los hitos del ejemplo, con los tres estados. */
function Hitos() {
  return (
    <Timeline>
      <TimelineItem
        title="Project kickoff"
        meta="Jan 5, 2026"
        badge={<Badge size="compact">Done</Badge>}
      >
        First team meeting, goals agreed and the charter signed.
      </TimelineItem>
      <TimelineItem
        title="Requirements complete"
        meta="Jan 18, 2026"
        badge={<Badge size="compact">Done</Badge>}
      >
        Everything functional and non-functional written down and approved.
      </TimelineItem>
      <TimelineItem
        title="Design system ready"
        meta="Feb 2, 2026"
        badge={<Badge size="compact">Done</Badge>}
      >
        Wireframes, the component library and the brand guidelines, closed.
      </TimelineItem>
      <TimelineItem
        state="current"
        title="Development sprint 1"
        meta="Mar 1, 2026"
        badge={
          <Badge variant="dot" color="blue" size="compact">
            In progress
          </Badge>
        }
      >
        Authentication, the dashboard and the data model, under way.
      </TimelineItem>
      <TimelineItem
        state="upcoming"
        title="QA and testing"
        meta="Mar 22, 2026"
        badge={<Badge size="compact">Upcoming</Badge>}
      >
        End-to-end tests, a performance pass and the security audit.
      </TimelineItem>
      <TimelineItem
        state="upcoming"
        title="Production release"
        meta="Apr 5, 2026"
        badge={<Badge size="compact">Upcoming</Badge>}
      >
        The launch, with monitoring and a way back.
      </TimelineItem>
    </Timeline>
  );
}

/* ── El feed, que además se puede alimentar ────────────────────────────── */

interface Entrada {
  id: number;
  icon: typeof CircleDot;
  quien: string;
  que: string;
  cuando: string;
  badge?: string;
  nota?: string;
  mono?: boolean;
}

const ENTRADAS: Entrada[] = [
  {
    id: 1,
    icon: CircleDot,
    quien: "Camila Ferreyra",
    que: "changed the status to",
    cuando: "2 h ago",
    badge: "In review",
  },
  {
    id: 2,
    icon: MessageSquare,
    quien: "Bruno Salas",
    que: "left a comment",
    cuando: "1 d ago",
    nota: "The authentication flow reads well. One thing: we should rate-limit the login endpoint before this goes out.",
  },
  {
    id: 3,
    icon: Tag,
    quien: "Renata Bianchi",
    que: "added tags",
    cuando: "1 d ago",
    badge: "Bug",
  },
  {
    id: 4,
    icon: GitMerge,
    quien: "Sofía Bermúdez",
    que: "merged",
    cuando: "2 d ago",
    nota: "feat/auth-refactor → main",
    mono: true,
  },
  {
    id: 5,
    icon: UserPlus,
    quien: "Camila Ferreyra",
    que: "changed the assignment",
    cuando: "3 d ago",
    nota: "Now on Bruno Salas",
  },
];

/** El feed. El botón mete una entrada arriba: es lo que muestra que una que
 *  llega tarde no entra con la ronda del montaje sino sola, y que las de abajo
 *  le hacen lugar en vez de saltar. */
function Actividad() {
  const [entradas, setEntradas] = useState(ENTRADAS);
  const [siguiente, setSiguiente] = useState(6);

  const sumar = () => {
    setEntradas((previas) => [
      {
        id: siguiente,
        icon: CircleDot,
        quien: "Bruno Salas",
        que: "changed the status to",
        cuando: "just now",
        badge: "Ready",
      },
      ...previas,
    ]);
    setSiguiente((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <Timeline variant="feed">
        <AnimatePresence initial={false}>
          {entradas.map((entrada) => (
            <TimelineItem
              key={entrada.id}
              icon={entrada.icon}
              title={<Hizo quien={entrada.quien} que={entrada.que} />}
              meta={entrada.cuando}
              badge={
                entrada.badge && (
                  <Badge size="compact" className="shrink-0">
                    {entrada.badge}
                  </Badge>
                )
              }
            >
              {entrada.nota && (
                <TimelineNote mono={entrada.mono}>{entrada.nota}</TimelineNote>
              )}
            </TimelineItem>
          ))}
        </AnimatePresence>
      </Timeline>

      <div>
        <Button variant="secondary" size="compact" onClick={sumar}>
          Add an entry
        </Button>
      </div>
    </div>
  );
}

export function TimelineSection() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Timeline"
        hint="What happened, in the order it happened. It writes itself out on mount: the text of each row lands and then the rail reaches the next node, which is the order the eye reads them in anyway."
      >
        <Hitos />
      </Section>

      <Section
        title="A feed"
        hint="The same anatomy with the time against the right edge, because the row is a sentence and not a paragraph. An icon says what kind of thing happened and takes the dot's place — the state of something somebody already did is always done."
      >
        <Actividad />
      </Section>

      <Section
        title="The three states"
        hint="Weight and not colour: a ring for what closed, a filled dot with a halo for where we are, a hairline for what hasn't happened. Colour is what a Badge is for, and it means a category — spending it here too would leave the reader deciding which of the two a green circle is talking about."
      >
        <Timeline>
          <TimelineItem title="Done" meta="A ring, and the road went through it." />
          <TimelineItem
            state="current"
            title="Current"
            meta="Filled, with a halo of the interaction token."
          />
          <TimelineItem
            state="upcoming"
            title="Upcoming"
            meta="A hairline, the same weight as the rail."
          />
        </Timeline>
      </Section>

      <Section
        title="Compact"
        hint="The same ladder as everything else: inside a SizeProvider the nodes, the air between them and the type step down together."
      >
        <SizeProvider size="compact">
          <Timeline variant="feed">
            <TimelineItem
              icon={GitMerge}
              title={<Hizo quien="Sofía Bermúdez" que="merged" />}
              meta="2 d ago"
            >
              <TimelineNote mono>feat/auth-refactor → main</TimelineNote>
            </TimelineItem>
            <TimelineItem
              icon={Tag}
              title={<Hizo quien="Renata Bianchi" que="added tags" />}
              meta="1 d ago"
              badge={<Badge size="compact">Bug</Badge>}
            />
            <TimelineItem
              icon={MessageSquare}
              title={<Hizo quien="Bruno Salas" que="left a comment" />}
              meta="1 d ago"
            >
              <TimelineNote>Short enough to fit in one line.</TimelineNote>
            </TimelineItem>
          </Timeline>
        </SizeProvider>
      </Section>

      <Section title="How it's used" hint="La lista, el ítem y —cuando hace falta— el plano que cuelga de él.">
        <Snippet>{`
<Timeline variant="feed">
  <TimelineItem
    icon={GitMerge}
    title={<><b>Sofía</b> merged</>}
    meta="2 d ago"
  >
    <TimelineNote mono>feat/auth-refactor → main</TimelineNote>
  </TimelineItem>
</Timeline>
`}</Snippet>
      </Section>
    </div>
  );
}
