import { useState } from "react";
import { Paperclip, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorPicker, ColorPickerPopover } from "@/components/ui/color-picker";
import { FileThumbnail } from "@/components/ui/file-thumbnail";
import { InputCopy } from "@/components/ui/input-copy";
import { InputField, InputGroup } from "@/components/ui/input-group";
import { InputMessage } from "@/components/ui/input-message";
import { Row, Section } from "./Shared";

const SAMPLE_FILES = [
  new File(["diagrama"], "surfaces-ladder.png", { type: "image/png" }),
  new File(["spec"], "motion-spec.pdf", { type: "application/pdf" }),
];

export function InputsSection() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [invalid, setInvalid] = useState("no-es-un-email");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [color, setColor] = useState("#8b5cf6");

  return (
    <div className="flex flex-col gap-14">
      <Section title="InputGroup" hint="El resalte por proximidad recorre los campos del grupo; el label se activa con hover o foco.">
        <InputGroup className="w-full max-w-sm">
          <InputField index={0} label="Email" placeholder="vos@correo.com" value={email} onChange={setEmail} />
          <InputField index={1} label="Buscar" icon={Search} placeholder="Filtrar proyectos" value={query} onChange={setQuery} />
          <InputField
            index={2}
            label="Con error"
            icon={User}
            value={invalid}
            onChange={setInvalid}
            error={invalid.includes("@") ? undefined : "Ingresá un email válido"}
          />
        </InputGroup>
      </Section>

      <Section title="InputCopy" hint="Campo de sólo lectura con copia al portapapeles y feedback animado.">
        <div className="flex max-w-sm flex-col gap-4">
          <InputCopy label="Comando de instalación" value="npx shadcn@latest add @fluid/base/button" />
          <InputCopy value="ff_live_9c2f4a7b" variant="button" align="right" />
        </div>
      </Section>

      <Section title="FileThumbnail" hint="Miniatura cuadrada por tipo de archivo — la usan ChatMessage e InputMessage.">
        <Row>
          {SAMPLE_FILES.map((f) => (
            <FileThumbnail key={f.name} file={f} size={72} />
          ))}
        </Row>
      </Section>

      <Section title="ColorPicker" hint="HEX, RGB, HSL y OKLCH con alpha, muestras y cuentagotas. Inline o en popover.">
        <Row>
          <ColorPickerPopover
            value={color}
            onValueChange={(v) => setColor(v)}
            triggerLabel="Color de marca"
            triggerShowValue
            swatches={["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"]}
          />
        </Row>
        <div className="max-w-xs">
          <ColorPicker value={color} onValueChange={(v) => setColor(v)} defaultFormat="oklch" />
        </div>
      </Section>

      <Section title="InputMessage" hint="Composer con adjuntos por drag & drop, historial con flechas, sugerencias y cola de mensajes.">
        <div className="flex max-w-xl flex-col gap-3">
          {sent.map((m, i) => (
            <p key={i} className="text-[13px] text-muted-foreground">enviado: {m}</p>
          ))}
          <InputMessage
            value={draft}
            onValueChange={setDraft}
            files={files}
            onFilesChange={setFiles}
            history={sent}
            placeholderSuggestion="¿Por qué todo otro input se siente tan rígido?"
            suggestions={[
              "¿De qué se trata Fluid Functionalism?",
              "¿Cómo se afinan estos springs?",
              "Instalá InputMessage en mi proyecto",
            ]}
            onSend={(value) => {
              if (value) setSent((s) => [...s, value]);
              setDraft("");
              setFiles([]);
            }}
            leftSlot={({ openFilePicker }) => (
              <Button variant="ghost" size="icon-compact" aria-label="Adjuntar" onClick={() => openFilePicker()}>
                <Paperclip />
              </Button>
            )}
          />
        </div>
      </Section>
    </div>
  );
}
