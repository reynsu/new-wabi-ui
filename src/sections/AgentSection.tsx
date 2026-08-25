import { useState } from "react";
import { Copy, RotateCcw } from "lucide-react";

import { AskUserQuestions, type AskUserAnswer } from "@/components/ui/ask-user-questions";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ui/chat-message";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import {
  ThinkingStep,
  ThinkingStepDetails,
  ThinkingStepSource,
  ThinkingStepSources,
  ThinkingSteps,
  ThinkingStepsContent,
  ThinkingStepsHeader,
} from "@/components/ui/thinking-steps";
import { Row, Section } from "./Shared";

export function AgentSection() {
  const [answers, setAnswers] = useState<Record<string, AskUserAnswer>>({});

  return (
    <div className="flex flex-col gap-14">
      <Section title="ChatMessage" hint="The user's bubble on the right, the assistant's reply as plain text. The meta row appears on hover.">
        <div className="flex max-w-xl flex-col gap-4">
          <ChatMessage
            from="user"
            time="Wednesday 18:08"
            actions={
              <>
                <Button variant="ghost" size="icon-compact" aria-label="Copy"><Copy /></Button>
                <Button variant="ghost" size="icon-compact" aria-label="Retry"><RotateCcw /></Button>
              </>
            }
          >
            How many levels does the surface ladder have?
          </ChatMessage>
          <ChatMessage from="assistant">
            Eight. In light mode it flattens to white after the second step and the shadow alone
            carries the elevation; in dark it keeps adding white opacity plus a recipe of layered shadows.
          </ChatMessage>
        </div>
      </Section>

      <Section title="ThinkingIndicator" hint="A glyph morphing between a circle and an infinity sign, with the word rotating every 4s. It stops under reduced-motion.">
        <Row>
          <ThinkingIndicator />
          <ThinkingIndicator showIcon={false} />
          <ThinkingIndicator size="compact" />
        </Row>
      </Section>

      <Section title="ThinkingSteps" hint="A collapsible list of steps: each one animates to a measured height, with nested details and sources.">
        <div className="max-w-xl">
          <ThinkingSteps defaultOpen>
            <ThinkingStepsHeader>Thinking</ThinkingStepsHeader>
            <ThinkingStepsContent>
              <ThinkingStep icon="search" label="Searching the registry" description="fluidfunctionalism.com/r" status="complete" />
              <ThinkingStep icon="brain" label="Resolving dependencies" status="complete">
                <ThinkingStepDetails
                  summary="24 items resolved"
                  details={["springs", "size-context", "surface-context", "shape-context"]}
                />
              </ThinkingStep>
              <ThinkingStep icon="folder" label="Writing components" status="active">
                <ThinkingStepSources>
                  <ThinkingStepSource color="violet">base/button</ThinkingStepSource>
                  <ThinkingStepSource color="blue" delay={0.05}>base/select</ThinkingStepSource>
                  <ThinkingStepSource color="green" delay={0.1}>base/tooltip</ThinkingStepSource>
                </ThinkingStepSources>
              </ThinkingStep>
              <ThinkingStep icon="check" label="Verifying the build" status="pending" isLast />
            </ThinkingStepsContent>
          </ThinkingSteps>
        </div>
      </Section>

      <Section title="AskUserQuestions" hint="A step-by-step question flow: single or multiple choice, an &quot;other&quot; field and navigation between questions.">
        <div className="max-w-xl">
          <AskUserQuestions
            questions={[
              {
                id: "primitive",
                title: "Which primitive do you want to use?",
                options: [
                  { id: "base", title: "Base UI", description: "Radix's successor, from the MUI team" },
                  { id: "radix", title: "Radix UI", description: "The classic" },
                ],
                skippable: true,
              },
              {
                id: "systems",
                title: "Which layers of the system will you use?",
                multiSelect: true,
                layout: "stacked",
                allowOther: true,
                otherPlaceholder: "Another layer…",
                options: [
                  { id: "motion", title: "Motion", description: "Three springs, faster exits" },
                  { id: "sizes", title: "Sizes", description: "36px default / 28px compact" },
                  { id: "surfaces", title: "Surfaces", description: "Eight levels that nest" },
                  { id: "scrollbars", title: "Scrollbars", description: "A discreet bar + scroll-fade" },
                ],
              },
            ]}
            answers={answers}
            onAnswersChange={setAnswers}
          />
        </div>
      </Section>
    </div>
  );
}
