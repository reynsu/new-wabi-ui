import { useMemo, useState } from "react";
import {
  AlignLeft,
  AtSign,
  BriefcaseBusiness,
  Building2,
  Contact,
  Loader,
  Phone,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import {
  FilterMenu,
  type FilterGroup,
  type FilterOption,
  type FilterSelection,
} from "@/components/filter-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IconComponent } from "@/lib/icon-context";
import { SizeProvider } from "@/lib/size-context";
import { Section } from "./Shared";

/* Un punto de color como ícono de un valor. `FilterOption.icon` es un
   componente y no un color justamente para esto: el atributo decide con qué se
   distingue cada valor — un punto para los estados, un glifo para lo demás. */
const dot =
  (color: string): IconComponent =>
  ({ size = 16, className }) => (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
        }}
      />
    </span>
  );

const STATUS: FilterOption[] = [
  { value: "nuevo", label: "New", icon: dot("#8b8b8b") },
  { value: "conversando", label: "In conversation", icon: dot("#6b97ff") },
  { value: "propuesta", label: "Proposal sent", icon: dot("#f59e0b") },
  { value: "cliente", label: "Customer", icon: dot("#22c55e") },
  { value: "perdido", label: "Lost", icon: dot("#f43f5e") },
];

const ROLES: FilterOption[] = [
  { value: "diseno", label: "Design" },
  { value: "ingenieria", label: "Engineering" },
  { value: "producto", label: "Product" },
  { value: "ventas", label: "Sales" },
  { value: "data", label: "Data" },
];

const COMPANIES: FilterOption[] = [
  { value: "atlasflow", label: "Atlasflow", hint: "4" },
  { value: "nubex", label: "Nubex", hint: "2" },
  { value: "corriente", label: "Corriente", hint: "2" },
  { value: "marmota", label: "Marmota", hint: "1" },
  { value: "peral", label: "Peral", hint: "1" },
];

const OWNERS: FilterOption[] = [
  { value: "rey", label: "Rey" },
  { value: "ana", label: "Ana" },
  { value: "tomas", label: "Tomás" },
];

const TAGS: FilterOption[] = [
  { value: "referido", label: "Referral" },
  { value: "evento", label: "Event" },
  { value: "inbound", label: "Inbound" },
];

const GROUPS: FilterGroup[] = [
  {
    label: "Person attributes",
    attributes: [
      { id: "name", label: "Name", icon: Contact, type: "text" },
      { id: "email", label: "Emails", icon: AtSign, type: "text" },
      { id: "status", label: "Status", icon: Loader, options: STATUS },
      { id: "note", label: "Description", icon: AlignLeft, type: "text" },
      { id: "company", label: "Company", icon: Building2, options: COMPANIES },
      { id: "role", label: "Role", icon: BriefcaseBusiness, options: ROLES },
      { id: "phone", label: "Phone numbers", icon: Phone, type: "text" },
    ],
  },
  {
    label: "Of the record",
    attributes: [
      // `single`: un registro tiene un responsable, no varios. Elegir uno
      // reemplaza al anterior y el panel vuelve solo al primer nivel.
      { id: "owner", label: "Owner", icon: UserRound, options: OWNERS, single: true },
      { id: "tags", label: "Tags", icon: Tag, options: TAGS },
    ],
  },
];

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  company: string;
  role: string;
  status: string;
  owner: string;
  tags: string[];
}

const PEOPLE: Person[] = [
  { id: "1", name: "Camila Ferreyra", email: "camila@atlasflow.io", phone: "+54 11 5544 1020", note: "Came in through the newsletter", company: "atlasflow", role: "diseno", status: "cliente", owner: "rey", tags: ["inbound"] },
  { id: "2", name: "Bruno Salas", email: "bruno@atlasflow.io", phone: "+54 11 5544 8871", note: "Asked for a demo of the panel", company: "atlasflow", role: "ingenieria", status: "conversando", owner: "ana", tags: ["evento"] },
  { id: "3", name: "Lucía Otero", email: "lucia@nubex.com", phone: "+34 611 220 934", note: "Introduced to us by Marta", company: "nubex", role: "producto", status: "propuesta", owner: "rey", tags: ["referido"] },
  { id: "4", name: "Martín Quiroga", email: "martin@corriente.ar", phone: "+54 341 220 118", note: "Weighing a migration next year", company: "corriente", role: "ingenieria", status: "nuevo", owner: "tomas", tags: [] },
  { id: "5", name: "Sofía Bermúdez", email: "sofia@corriente.ar", phone: "+54 341 220 119", note: "Signed in March", company: "corriente", role: "ventas", status: "cliente", owner: "ana", tags: ["referido"] },
  { id: "6", name: "Iván Palacios", email: "ivan@marmota.dev", phone: "+56 9 8877 1122", note: "Fell through on price", company: "marmota", role: "data", status: "perdido", owner: "tomas", tags: ["evento"] },
  { id: "7", name: "Renata Bianchi", email: "renata@atlasflow.io", phone: "+54 11 5544 3390", note: "Technical contact for the account", company: "atlasflow", role: "data", status: "cliente", owner: "rey", tags: [] },
  { id: "8", name: "Diego Miralles", email: "diego@nubex.com", phone: "+34 611 771 004", note: "Asked for the master agreement", company: "nubex", role: "ventas", status: "propuesta", owner: "ana", tags: ["inbound"] },
  { id: "9", name: "Paula Genovese", email: "paula@peral.app", phone: "+54 11 6600 2233", note: "Wrote to us on LinkedIn", company: "peral", role: "producto", status: "conversando", owner: "rey", tags: ["inbound"] },
  { id: "10", name: "Andrés Lupo", email: "andres@atlasflow.io", phone: "+54 11 5544 7712", note: "Going to try the free plan", company: "atlasflow", role: "diseno", status: "nuevo", owner: "tomas", tags: [] },
];

/** Los atributos de texto libre miran un campo; los de lista, otro. Este mapa
 *  es lo único que sabe cómo se traduce un id de atributo a un dato. */
const TEXT_FIELDS: Record<string, (person: Person) => string> = {
  name: (p) => p.name,
  email: (p) => p.email,
  phone: (p) => p.phone,
  note: (p) => p.note,
};

const LIST_FIELDS: Record<string, (person: Person) => string[]> = {
  status: (p) => [p.status],
  company: (p) => [p.company],
  role: (p) => [p.role],
  owner: (p) => [p.owner],
  tags: (p) => p.tags,
};

/** Entre atributos, Y; entre los valores de un mismo atributo, O. Es la lectura
 *  que espera cualquiera que use filtros: "cliente **o** en conversación", pero
 *  "de Atlasflow **y** cliente". */
function passes(person: Person, selection: FilterSelection) {
  return Object.entries(selection).every(([id, values]) => {
    const text = TEXT_FIELDS[id];
    if (text) {
      const field = text(person).toLowerCase();
      return values.some((v) => field.includes(v.toLowerCase()));
    }
    const list = LIST_FIELDS[id];
    if (!list) return true;
    const owned = list(person);
    return values.some((v) => owned.includes(v));
  });
}

const ATTRIBUTES = GROUPS.flatMap((g) => g.attributes);

/** Los chips de afuera: el atributo, el valor y una X que lo saca. Es el mismo
 *  estado que maneja el panel, escrito desde el otro lado — la prueba de que la
 *  selección se puede manejar de afuera. */
function labelsOf(id: string, value: string) {
  const attribute = ATTRIBUTES.find((a) => a.id === id);
  const option = attribute?.options?.find((o) => o.value === value);
  return {
    attribute: attribute?.label ?? id,
    // Un atributo de texto no tiene opciones: el valor es lo que se escribió.
    value: option?.label ?? `«${value}»`,
  };
}

function Chips({
  selection,
  onChange,
}: {
  selection: FilterSelection;
  onChange: (next: FilterSelection) => void;
}) {
  const chips = Object.entries(selection).flatMap(([id, values]) =>
    values.map((value) => ({ id, value, labels: labelsOf(id, value) })),
  );

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <span
          key={`${chip.id}:${chip.value}`}
          className="flex h-7 items-center gap-1.5 rounded-full bg-surface-3 pl-2.5 pr-1 text-[12px] shadow-surface-2"
        >
          <span className="text-muted-foreground">{chip.labels.attribute}</span>
          <span className="text-foreground">{chip.labels.value}</span>
          <button
            type="button"
            aria-label={`Remove ${chip.labels.attribute}: ${chip.labels.value}`}
            onClick={() => {
              const rest = selection[chip.id].filter((v) => v !== chip.value);
              const next = { ...selection };
              if (rest.length) next[chip.id] = rest;
              else delete next[chip.id];
              onChange(next);
            }}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-100 hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </span>
      ))}
    </div>
  );
}

const STATUS_LABEL = Object.fromEntries(STATUS.map((s) => [s.value, s]));
const COMPANY_LABEL = Object.fromEntries(COMPANIES.map((c) => [c.value, c.label]));
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

export function FilterMenuSection() {
  const [selection, setSelection] = useState<FilterSelection>({
    status: ["cliente", "conversando"],
  });
  const [compact, setCompact] = useState<FilterSelection>({});

  const results = useMemo(
    () => PEOPLE.filter((person) => passes(person, selection)),
    [selection],
  );

  return (
    <div className="flex flex-col gap-14">
      <Section
        title="The gesture"
        hint="Open the panel and pick an attribute: the list slides across to its values without changing panel or anchor. Ticking a value closes nothing — you tick several at a time — and the table below recomputes right away."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterMenu
              groups={GROUPS}
              value={selection}
              onValueChange={setSelection}
            />
            <Chips selection={selection} onChange={setSelection} />
          </div>

          <div className="overflow-hidden rounded-xl bg-surface-2 shadow-surface-2">
            <Table size="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((person) => {
                  const status = STATUS_LABEL[person.status];
                  const StatusDot = status.icon!;
                  return (
                    <TableRow key={person.id}>
                      <TableCell>
                        <span className="text-foreground">{person.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          {person.email}
                        </span>
                      </TableCell>
                      <TableCell>{COMPANY_LABEL[person.company]}</TableCell>
                      <TableCell>{ROLE_LABEL[person.role]}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <StatusDot size={12} />
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {!results.length && (
              <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                Nobody passes those filters
              </p>
            )}
          </div>

          <p className="text-[13px] text-muted-foreground">
            {results.length} of {PEOPLE.length} people. Between attributes AND
            rules; between the values of one attribute, OR.
          </p>
        </div>
      </Section>

      <Section
        title="Attributes with no list"
        hint="Name, Emails, Description and Phone numbers are free text: inside those, the same search box becomes the value field and Enter adds what's typed as a term. The rows below are the terms already set, and activating them removes them."
      >
        <div className="flex">
          <FilterMenu
            groups={[GROUPS[0]]}
            label="Search the text"
            defaultValue={{ note: ["demo"] }}
          />
        </div>
      </Section>

      <Section
        title="Compact"
        hint="Inside a compact SizeProvider the button, the search box and the rows step down: 28px, 12px text and 14px icons. The panel's width doesn't change — it's set by the length of the labels, not by the density."
      >
        <SizeProvider size="compact">
          <div className="flex flex-wrap items-center gap-2">
            <FilterMenu
              groups={GROUPS}
              value={compact}
              onValueChange={setCompact}
            />
            <Chips selection={compact} onChange={setCompact} />
          </div>
        </SizeProvider>
      </Section>

      <Section
        title="Against the edge"
        hint="Aligned to the button's end (align=&quot;end&quot;) and pushed right, which is where a filter usually lives in a table bar. The panel opens inwards and Base UI flips it on its own if it doesn't fit."
      >
        <div className="flex justify-end">
          <FilterMenu groups={GROUPS} align="end" />
        </div>
      </Section>
    </div>
  );
}
