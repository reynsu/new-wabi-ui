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
  new File(["diagram"], "surfaces-ladder.png", { type: "image/png" }),
  new File(["spec"], "motion-spec.pdf", { type: "application/pdf" }),
];

export function InputsSection() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [invalid, setInvalid] = useState("not-an-email");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  const [color, setColor] = useState("#8b5cf6");

  return (
    <div className="flex flex-col gap-14">
      <Section title="InputGroup" hint="The proximity highlight runs across the group's fields; the label activates on hover or focus.">
        <InputGroup className="w-full max-w-sm">
          <InputField index={0} label="Email" placeholder="you@email.com" value={email} onChange={setEmail} />
          <InputField index={1} label="Search" icon={Search} placeholder="Filter projects" value={query} onChange={setQuery} />
          <InputField
            index={2}
            label="With an error"
            icon={User}
            value={invalid}
            onChange={setInvalid}
            error={invalid.includes("@") ? undefined : "Enter a valid email"}
          />
        </InputGroup>
      </Section>

      <Section title="InputCopy" hint="A read-only field with copy to clipboard and animated feedback.">
        <div className="flex max-w-sm flex-col gap-4">
          <InputCopy label="Install command" value="npx shadcn@latest add @fluid/base/button" />
          <InputCopy value="ff_live_9c2f4a7b" variant="button" align="right" />
        </div>
      </Section>

      <Section title="FileThumbnail" hint="A square thumbnail per file type — used by ChatMessage and InputMessage.">
        <Row>
          {SAMPLE_FILES.map((f) => (
            <FileThumbnail key={f.name} file={f} size={72} />
          ))}
        </Row>
      </Section>

      <Section title="ColorPicker" hint="HEX, RGB, HSL and OKLCH with alpha, swatches and an eyedropper. Inline or in a popover.">
        <Row>
          <ColorPickerPopover
            value={color}
            onValueChange={(v) => setColor(v)}
            triggerLabel="Brand colour"
            triggerShowValue
            swatches={["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"]}
          />
        </Row>
        <div className="max-w-xs">
          <ColorPicker value={color} onValueChange={(v) => setColor(v)} defaultFormat="oklch" />
        </div>
      </Section>

      <Section title="InputMessage" hint="A composer with drag &amp; drop attachments, arrow-key history, suggestions and a message queue.">
        <div className="flex max-w-xl flex-col gap-3">
          {sent.map((m, i) => (
            <p key={i} className="text-[13px] text-muted-foreground">sent: {m}</p>
          ))}
          <InputMessage
            value={draft}
            onValueChange={setDraft}
            files={files}
            onFilesChange={setFiles}
            history={sent}
            placeholderSuggestion="Why does every other input feel so stiff?"
            suggestions={[
              "What is Fluid Functionalism about?",
              "How are these springs tuned?",
              "Install InputMessage in my project",
            ]}
            onSend={(value) => {
              if (value) setSent((s) => [...s, value]);
              setDraft("");
              setFiles([]);
            }}
            leftSlot={({ openFilePicker }) => (
              <Button variant="ghost" size="icon-compact" aria-label="Attach" onClick={() => openFilePicker()}>
                <Paperclip />
              </Button>
            )}
          />
        </div>
      </Section>
    </div>
  );
}
