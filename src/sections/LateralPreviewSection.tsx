import type { ReactNode } from "react";
import { ChartLine, MessageCircle, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LateralPreview,
  PreviewGroup,
  PreviewMessage,
  PreviewRow,
  PreviewStat,
} from "@/components/lateral-preview";
import { usePreview } from "@/components/preview-context";
import { Section } from "@/sections/Shared";

/* ── Los tres cuerpos ───────────────────────────────────────────────────── */

/** Una conversación: los últimos mensajes y con quién. */
function Conversacion({ onClose }: { onClose?: () => void }) {
  return (
    <LateralPreview
      icon={MessageCircle}
      title="Camila Ferreyra"
      subtitle="Conversation · 12 messages"
      onClose={onClose}
      footer={
        <Button variant="secondary" size="compact" className="w-full">
          Open the conversation
        </Button>
      }
    >
      <PreviewGroup className="gap-3">
        <PreviewMessage from="Camila" time="2 h ago">
          Are we making the March close or do we move it a week?
        </PreviewMessage>
        <PreviewMessage from="You" time="2 h ago" own>
          We'll make it. We're just waiting on the last batch of contributions.
        </PreviewMessage>
        <PreviewMessage from="Camila" time="1 h ago">
          Perfect. I'll send you the breakdown as soon as I have it.
        </PreviewMessage>
      </PreviewGroup>
    </LateralPreview>
  );
}

/** Un perfil: quién es y sus datos más cortos. */
function Perfil({ onClose }: { onClose?: () => void }) {
  return (
    <LateralPreview
      icon={UserRound}
      title="Bruno Salas"
      subtitle="Engineering · Atlasflow"
      onClose={onClose}
      footer={
        <Button variant="secondary" size="compact" className="w-full">
          See the full profile
        </Button>
      }
    >
      <PreviewGroup label="Details">
        <PreviewRow label="Email" value="bruno@atlasflow.io" />
        <PreviewRow label="Status" value={<Badge variant="dot" color="blue">In conversation</Badge>} />
        <PreviewRow label="Since" value="March" />
      </PreviewGroup>
      <PreviewGroup label="Activity">
        <PreviewRow label="Contributions" value="$1,800" />
        <PreviewRow label="Last one" value="5 h ago" />
      </PreviewGroup>
    </LateralPreview>
  );
}

/** Estadísticas: unos pocos números con su contexto. */
function Estadisticas({ onClose }: { onClose?: () => void }) {
  return (
    <LateralPreview
      icon={ChartLine}
      title="Marmot Fund"
      subtitle="Campaign · since March"
      onClose={onClose}
      footer={
        <Button variant="secondary" size="compact" className="w-full">
          See the dashboard
        </Button>
      }
    >
      <PreviewGroup className="gap-4">
        <PreviewStat
          label="Raised"
          value="$38,000"
          hint={<Badge variant="dot" color="green">+12%</Badge>}
        />
        <PreviewStat label="Of the goal" value="67%" />
        <PreviewStat label="Contributions" value="142" />
      </PreviewGroup>
      <PreviewGroup label="Split">
        <PreviewRow label="Public" value="$38,000" />
        <PreviewRow label="Anonymous" value="$45,000" />
      </PreviewGroup>
    </LateralPreview>
  );
}

/* ── La sección ─────────────────────────────────────────────────────────── */

const CASOS: { label: string; render: (onClose: () => void) => ReactNode }[] = [
  { label: "A conversation", render: (c) => <Conversacion onClose={c} /> },
  { label: "A profile", render: (c) => <Perfil onClose={c} /> },
  { label: "Statistics", render: (c) => <Estadisticas onClose={c} /> },
];

export function LateralPreviewSection() {
  const { show, close, preview } = usePreview();

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="The same place as the board"
        hint="Tap any of the three: the rail on the right stops showing the board and shows that instead. Closing it gives the board back."
      >
        <div className="flex flex-wrap items-center gap-3">
          {CASOS.map((caso) => (
            <Button
              key={caso.label}
              variant="secondary"
              size="compact"
              onClick={() => show(caso.render(close))}
            >
              {caso.label}
            </Button>
          ))}
          {preview && (
            <Button variant="tertiary" size="compact" onClick={close}>
              Back to the board
            </Button>
          )}
        </div>
      </Section>

      <Section
        title="Why they share the place"
        hint="It isn't a layout coincidence: they're the same question at two moments."
      >
        <p className="text-[13px] text-muted-foreground">
          The board answers “how's everything going?” — many things, each
          reduced to a number. The preview answers “what is this?” — a single
          thing, opened far enough to decide without changing screens. You watch
          the board until something catches your eye, and then the rail switches
          to showing that. That's why they replace each other instead of
          stacking: having both at once would force you to choose which one to
          look at, which is exactly what the rail exists not to ask.
        </p>
      </Section>

      <Section
        title="The frame is one"
        hint="Conversation, profile and statistics are three bodies inside the same LateralPreview."
      >
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-muted-foreground">
            One component per kind of thing would be three identical frames with
            three different bodies, and the frame is precisely the only part that
            doesn't change: a header with the name and the close button, a body
            that scrolls, a footer with “open the whole thing”. The body is built
            with
            <code className="text-foreground"> PreviewGroup</code>,
            <code className="text-foreground"> PreviewRow</code>,
            <code className="text-foreground"> PreviewStat</code> and
            <code className="text-foreground"> PreviewMessage</code>.
          </p>
          <div className="h-[420px] max-w-[360px]">
            <Conversacion />
          </div>
        </div>
      </Section>
    </div>
  );
}
