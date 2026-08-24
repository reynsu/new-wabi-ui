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
  { value: "nuevo", label: "Nuevo", icon: dot("#8b8b8b") },
  { value: "conversando", label: "En conversación", icon: dot("#6b97ff") },
  { value: "propuesta", label: "Propuesta enviada", icon: dot("#f59e0b") },
  { value: "cliente", label: "Cliente", icon: dot("#22c55e") },
  { value: "perdido", label: "Perdido", icon: dot("#f43f5e") },
];

const ROLES: FilterOption[] = [
  { value: "diseno", label: "Diseño" },
  { value: "ingenieria", label: "Ingeniería" },
  { value: "producto", label: "Producto" },
  { value: "ventas", label: "Ventas" },
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
  { value: "referido", label: "Referido" },
  { value: "evento", label: "Evento" },
  { value: "inbound", label: "Inbound" },
];

const GROUPS: FilterGroup[] = [
  {
    label: "Atributos de la persona",
    attributes: [
      { id: "name", label: "Nombre", icon: Contact, type: "text" },
      { id: "email", label: "Correos", icon: AtSign, type: "text" },
      { id: "status", label: "Estado", icon: Loader, options: STATUS },
      { id: "note", label: "Descripción", icon: AlignLeft, type: "text" },
      { id: "company", label: "Empresa", icon: Building2, options: COMPANIES },
      { id: "role", label: "Puesto", icon: BriefcaseBusiness, options: ROLES },
      { id: "phone", label: "Teléfonos", icon: Phone, type: "text" },
    ],
  },
  {
    label: "Del registro",
    attributes: [
      // `single`: un registro tiene un responsable, no varios. Elegir uno
      // reemplaza al anterior y el panel vuelve solo al primer nivel.
      { id: "owner", label: "Responsable", icon: UserRound, options: OWNERS, single: true },
      { id: "tags", label: "Etiquetas", icon: Tag, options: TAGS },
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
  { id: "1", name: "Camila Ferreyra", email: "camila@atlasflow.io", phone: "+54 11 5544 1020", note: "Llegó por el newsletter", company: "atlasflow", role: "diseno", status: "cliente", owner: "rey", tags: ["inbound"] },
  { id: "2", name: "Bruno Salas", email: "bruno@atlasflow.io", phone: "+54 11 5544 8871", note: "Pidió una demo del panel", company: "atlasflow", role: "ingenieria", status: "conversando", owner: "ana", tags: ["evento"] },
  { id: "3", name: "Lucía Otero", email: "lucia@nubex.com", phone: "+34 611 220 934", note: "Nos presentó Marta", company: "nubex", role: "producto", status: "propuesta", owner: "rey", tags: ["referido"] },
  { id: "4", name: "Martín Quiroga", email: "martin@corriente.ar", phone: "+54 341 220 118", note: "Evalúa migrar el año que viene", company: "corriente", role: "ingenieria", status: "nuevo", owner: "tomas", tags: [] },
  { id: "5", name: "Sofía Bermúdez", email: "sofia@corriente.ar", phone: "+54 341 220 119", note: "Firmó en marzo", company: "corriente", role: "ventas", status: "cliente", owner: "ana", tags: ["referido"] },
  { id: "6", name: "Iván Palacios", email: "ivan@marmota.dev", phone: "+56 9 8877 1122", note: "Se cayó por precio", company: "marmota", role: "data", status: "perdido", owner: "tomas", tags: ["evento"] },
  { id: "7", name: "Renata Bianchi", email: "renata@atlasflow.io", phone: "+54 11 5544 3390", note: "Contacto técnico de la cuenta", company: "atlasflow", role: "data", status: "cliente", owner: "rey", tags: [] },
  { id: "8", name: "Diego Miralles", email: "diego@nubex.com", phone: "+34 611 771 004", note: "Pidió el contrato marco", company: "nubex", role: "ventas", status: "propuesta", owner: "ana", tags: ["inbound"] },
  { id: "9", name: "Paula Genovese", email: "paula@peral.app", phone: "+54 11 6600 2233", note: "Nos escribió por LinkedIn", company: "peral", role: "producto", status: "conversando", owner: "rey", tags: ["inbound"] },
  { id: "10", name: "Andrés Lupo", email: "andres@atlasflow.io", phone: "+54 11 5544 7712", note: "Va a probar el plan libre", company: "atlasflow", role: "diseno", status: "nuevo", owner: "tomas", tags: [] },
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
            aria-label={`Quitar ${chip.labels.attribute}: ${chip.labels.value}`}
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
        title="El gesto"
        hint="Abrí el panel y elegí un atributo: la lista se corre a sus valores sin cambiar de panel ni de ancla. Marcar un valor no cierra nada — se marcan varios de una — y la tabla de abajo se recalcula en el momento."
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Estado</TableHead>
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
                Ninguna persona pasa esos filtros
              </p>
            )}
          </div>

          <p className="text-[13px] text-muted-foreground">
            {results.length} de {PEOPLE.length} personas. Entre atributos manda
            la Y; entre los valores de un mismo atributo, la O.
          </p>
        </div>
      </Section>

      <Section
        title="Atributos sin lista"
        hint="Nombre, Correos, Descripción y Teléfonos son de texto libre: adentro de esos, el mismo buscador pasa a ser el campo del valor y Enter agrega lo escrito como término. Las filas de abajo son los términos puestos, y activarlas los saca."
      >
        <div className="flex">
          <FilterMenu
            groups={[GROUPS[0]]}
            label="Buscar en el texto"
            defaultValue={{ note: ["demo"] }}
          />
        </div>
      </Section>

      <Section
        title="Compacto"
        hint="Dentro de un SizeProvider compacto bajan el botón, el buscador y las filas: 28px, texto de 12 e íconos de 14. El ancho del panel no cambia — lo fija el largo de las etiquetas, no la densidad."
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
        title="Contra el borde"
        hint="Alineado al final del botón (align=&quot;end&quot;) y pegado a la derecha, que es donde suele vivir un filtro en una barra de tabla. El panel abre hacia adentro y Base UI lo da vuelta solo si no entra."
      >
        <div className="flex justify-end">
          <FilterMenu groups={GROUPS} align="end" />
        </div>
      </Section>
    </div>
  );
}
