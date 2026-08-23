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
      <Section title="ChatMessage" hint="Burbuja del usuario a la derecha, respuesta del asistente como texto plano. La fila de meta aparece al hover.">
        <div className="flex max-w-xl flex-col gap-4">
          <ChatMessage
            from="user"
            time="Miércoles 18:08"
            actions={
              <>
                <Button variant="ghost" size="icon-compact" aria-label="Copiar"><Copy /></Button>
                <Button variant="ghost" size="icon-compact" aria-label="Reintentar"><RotateCcw /></Button>
              </>
            }
          >
            ¿Cuántos niveles tiene la escalera de superficies?
          </ChatMessage>
          <ChatMessage from="assistant">
            Ocho. En modo claro se aplana a blanco después del segundo paso y la sombra sola carga la
            elevación; en oscuro sigue sumando opacidad blanca más una receta de sombras en capas.
          </ChatMessage>
        </div>
      </Section>

      <Section title="ThinkingIndicator" hint="Glifo que muta entre círculo e infinito, con la palabra rotando cada 4s. Se detiene con reduced-motion.">
        <Row>
          <ThinkingIndicator />
          <ThinkingIndicator showIcon={false} />
          <ThinkingIndicator size="compact" />
        </Row>
      </Section>

      <Section title="ThinkingSteps" hint="Lista de pasos colapsable: cada paso anima a una altura medida, con detalles y fuentes anidadas.">
        <div className="max-w-xl">
          <ThinkingSteps defaultOpen>
            <ThinkingStepsHeader>Pensando</ThinkingStepsHeader>
            <ThinkingStepsContent>
              <ThinkingStep icon="search" label="Buscando el registry" description="fluidfunctionalism.com/r" status="complete" />
              <ThinkingStep icon="brain" label="Resolviendo dependencias" status="complete">
                <ThinkingStepDetails
                  summary="24 items resueltos"
                  details={["springs", "size-context", "surface-context", "shape-context"]}
                />
              </ThinkingStep>
              <ThinkingStep icon="folder" label="Escribiendo componentes" status="active">
                <ThinkingStepSources>
                  <ThinkingStepSource color="violet">base/button</ThinkingStepSource>
                  <ThinkingStepSource color="blue" delay={0.05}>base/select</ThinkingStepSource>
                  <ThinkingStepSource color="green" delay={0.1}>base/tooltip</ThinkingStepSource>
                </ThinkingStepSources>
              </ThinkingStep>
              <ThinkingStep icon="check" label="Verificando el build" status="pending" isLast />
            </ThinkingStepsContent>
          </ThinkingSteps>
        </div>
      </Section>

      <Section title="AskUserQuestions" hint="Flujo de preguntas por pasos: selección simple o múltiple, campo &quot;otro&quot; y navegación entre preguntas.">
        <div className="max-w-xl">
          <AskUserQuestions
            questions={[
              {
                id: "primitive",
                title: "¿Qué primitiva querés usar?",
                options: [
                  { id: "base", title: "Base UI", description: "El sucesor de Radix, del equipo de MUI" },
                  { id: "radix", title: "Radix UI", description: "El clásico" },
                ],
                skippable: true,
              },
              {
                id: "systems",
                title: "¿Qué capas del sistema vas a usar?",
                multiSelect: true,
                layout: "stacked",
                allowOther: true,
                otherPlaceholder: "Otra capa…",
                options: [
                  { id: "motion", title: "Motion", description: "Tres springs, salidas más rápidas" },
                  { id: "sizes", title: "Sizes", description: "36px default / 28px compact" },
                  { id: "surfaces", title: "Surfaces", description: "Ocho niveles que anidan" },
                  { id: "scrollbars", title: "Scrollbars", description: "Barra discreta + scroll-fade" },
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
