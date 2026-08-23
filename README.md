# new-wabi-ui

Proyecto React con el design system [Fluid Functionalism](https://www.fluidfunctionalism.com)
instalado completo: los **24 componentes**, 9 libs y 3 hooks, sobre primitivas
**Base UI**.

Suma [Sileo](https://sileo.aaryan.design) para los toasts.

Vite 8 · React 19 · TypeScript · Tailwind v4 · shadcn CLI

---

## Levantar el proyecto

Necesitás **Node `^20.19` o `>=22.12`** (lo pide Vite 8).

```bash
npm install
```

```bash
npm run dev
```

Queda en http://localhost:5173 con HMR.

## Scripts

| comando | qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | `tsc -b` y después el build de producción a `dist/` |
| `npm run preview` | sirve el `dist/` ya construido |
| `npm run lint` | oxlint sobre el código propio — ver abajo qué queda afuera |
| `npm run fix:fluid` | reaplica el parche de `next/link` — ver abajo |

### Sobre `npm run lint`

Para que sirva de puerta de calidad, el `ignorePatterns` de `.oxlintrc.json`
deja afuera los tres directorios que instala el registry: `components/ui/`,
`lib/` y `hooks/`.

No es esconder la basura debajo de la alfombra. Ahí adentro había **3 errores y
169 warnings** — hooks llamados condicionalmente en `ask-user-questions.tsx`,
deps no memoizadas, refs leídos en render — que son decisiones del autor de la
librería, no del proyecto. Como el registry copia el código fuente al repo, el
linter lo trataba como nuestro; arreglarlo ahí sería trabajo que el próximo
`shadcn add --overwrite` pisa.

Quedan tres warnings en código propio — dos en `travel-tooltip.tsx`, uno en
`workspace-context.tsx` — que hasta ahora estaban enterrados en el ruido.

## Estructura

```
src/
  components/ui/    los 24 componentes + 6 módulos internos (ver abajo)
  lib/              springs, size/shape/surface/icon context, elevated, utils
  hooks/            use-proximity-hover, use-touch-primary, use-merge-split
  sections/         la demo que ejercita todos los componentes
  index.css         tokens del tema + estilos vendorizados (ver abajo)
  main.tsx          los providers del sistema
```

`src/sections/` es sólo demo — importa los 24 componentes. Si armás la app de
verdad, borralo.

### Por qué hay 30 archivos y no 24

Seis no son componentes públicos, son módulos que otros items arrastran:

| archivo | viene con |
|---|---|
| `menu-item.tsx` | `dropdown` |
| `sidebar-core.tsx`, `sidebar-menu.tsx` | `sidebar` |
| `scroll-area.tsx` | la página de sistema *Scrollbars* |
| `file-thumbnail.tsx` | `chat-message` e `input-message` |
| `mobile-drawer.tsx` | item propio, sin página de docs |

Para comprobar que están los 24:

```bash
curl -s https://www.fluidfunctionalism.com/r/registry.json | \
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    const items=JSON.parse(s).items.filter(i=>i.type==="registry:ui");
    const fs=require("fs").readdirSync("src/components/ui");
    const falta=items.flatMap(i=>i.files.map(f=>require("path").basename(f.target||f.path)))
      .filter((f,i,a)=>a.indexOf(f)===i && !fs.includes(f));
    console.log(falta.length?"faltan: "+falta.join(", "):"están todos");
  })'
```

---

## Agregar componentes

El registry `@fluid` ya está dado de alta en `components.json`.

```bash
npx shadcn@latest add @fluid/base/<nombre>
```

**Usá siempre el prefijo `base/`.** El registry publica dos sabores de cada
componente y este proyecto está entero sobre Base UI: pedir `@fluid/<nombre>`
a secas trae la versión Radix y te mezcla las primitivas.

Ojo con el grafo de dependencias: los 11 componentes que no tienen gemelo Base
UI (`input-message`, `color-picker`, `input-copy`, `ask-user-questions`, …)
declaran dependencia del `button`/`tooltip`/`slider` **Radix**. Si instalás uno
de esos, te pisa los archivos con la versión Radix — reinstalá el `base/`
encima:

```bash
npx shadcn@latest add @fluid/base/button @fluid/base/tooltip @fluid/base/slider -y --overwrite
```

Para verificar que no se coló Radix:

```bash
grep -rl '@radix-ui' src/ ; echo "(sin salida = todo Base UI)"
```

### Después de cada `--overwrite`

`card.tsx` viene compilado para Next.js e importa `next/link`, que no resuelve
en Vite. El parche:

```bash
npm run fix:fluid
```

Es idempotente: si ya está aplicado, no hace nada. Si algún día agregás un
router, apuntá ese shim a su `Link`.

---

## Componentes propios

Los de `src/components/` (fuera de `ui/`) son nuestros: ningún `shadcn add` los
toca. Cada uno tiene su página en el showcase, bajo *Componentes propios*.

| componente | qué es |
|---|---|
| `TravelTooltip` | un tooltip compartido por un grupo: al pasar de un trigger al vecino se traslada en vez de reaparecer |
| `WindowControls` | la barra que controla ventana y sidebar — pantalla completa, ventana flotante, panel lateral |
| `WorkspacePanel` | el marco de contenido con pestañas conectadas que va al lado del sidebar |

### Pestañas desde cualquier parte

`WorkspacePanel` no es dueño de sus pestañas: recibe `tabs` y avisa por
`onTabClose`. Para que cualquier punto de la app pueda abrir una sin pasarse
callbacks por props, está `WorkspaceProvider`:

```tsx
// una vez, arriba del todo
<WorkspaceProvider defaultTabs={[INICIAL]}>
  <App />
</WorkspaceProvider>

// donde el panel se dibuja, normalmente uno solo
<WorkspaceOutlet className="h-full" />

// desde cualquier componente por debajo del provider
const { openTab } = useWorkspace();
openTab({ id: "doc-42", label: "Documento", icon: FileText, content: <Doc /> });
```

Un `openTab` con un id ya abierto no duplica: lo enfoca. Y al cerrar la activa
el relevo pasa a su vecina. La referencia completa de props está en la página
del showcase.

### El panel dentro del sistema de superficies

La barra de pestañas se queda en el sustrato donde lo pongas y el plano —
pestaña activa y contenido, que son la misma superficie— sube dos escalones,
que es lo que el panel vuelve a publicar por `SurfaceProvider`: un popover
abierto dentro de una pestaña sigue subiendo desde ahí y no desde el sustrato
del panel.

Ese plano lleva fondo **y** sombra. En oscuro lo despega el color, pero en
claro la escalera está aplanada en blanco desde el escalón 3, así que la línea
que separa la barra del contenido la dibuja entera el anillo de la sombra —
sin él, `#FAFAFA` contra `#FFFFFF` no se distingue.

Todo eso —el plano de la activa, sus dos esquinas cóncavas y su canto— no vive
en la pestaña sino en **una sola capa que se desplaza**. Al cambiar de pestaña
no aparece y desaparece: viaja, con el spring `moderate` de `lib/springs`, y
el cambio se lee como un movimiento del selector. Las pestañas quedan limpias,
sólo con su etiqueta y su hover, y el selector pasa por debajo. Se anima `left`
y `width` y no un `transform` porque una escala deformaría el redondeo de las
esquinas y los arcos; los rects salen del mismo hook con el que se mide el
indicador de `tabs` del registry.

De ahí sale el canto de la silueta, que es lo que hace legible la forma de la
pestaña: corre por la barra, sube por el arco de la esquina cóncava y sigue
por el costado y el techo de la activa. En el piso de la activa no hay canto —
ahí la pestaña no termina, sigue en el contenido, y para eso monta 1px sobre
el plano y tapa el anillo.

**Las tres líneas caen siempre en la banda de 1px de afuera del relleno**, que
es donde el anillo del plano ya corría; si una cayera adentro, el empalme se
notaría corrido medio pixel. Por eso el canto es un anillo `inset` sobre una
capa 1px más grande que la pestaña —y con 1px más de radio, para quedar
concéntrico— y el arco se traza medio pixel adentro del círculo de la mordida,
que en una concavidad es el lado de la barra.

Los cortes están atados entre sí, no elegidos a ojo: el costado del canto baja
hasta `TAB_RADIUS - BAR_GAP` por encima del pie de la pestaña, que es
exactamente donde arranca el arco. Un pixel antes abre un hueco; uno después,
lo pisa. El canto va en su propia capa porque la máscara que lo corta recorta
todo lo que el elemento pinta, y la pestaña además pinta su fondo; las
esquinas cóncavas van en SVG porque su arco no sólo se rellena, también se
traza.

---

## Toasts (Sileo)

`sileo` es un paquete de npm aparte del registry — toasts con física de
resortes. El `Toaster` se monta una vez en [`src/App.tsx`](src/App.tsx) y desde
cualquier lado se dispara con `sileo.success({ title })`.

Dos cosas que conviene saber:

- **`theme` va explícito**, atado al toggle de la cabecera. Su modo `"system"`
  sigue al sistema operativo, y acá el tema lo decide la clase `.dark` en
  `<html>` — quedaría desincronizado.
- **Trae `motion` v12 como dependencia**, un segundo motor de animación junto al
  `framer-motion` v13 que usan los componentes del registry. Conviven sin
  chocar, pero el bundle sube ~53 kB gzip. Si eso pesa más que los toasts,
  desinstalarlo es un `npm rm sileo` y borrar la página del showcase.

Su CSS se inyecta solo en `document.head`, así que no hay import de estilos que
mantener.

---

## Los cuatro sistemas

Están cableados en [`src/main.tsx`](src/main.tsx). Los componentes los leen por
contexto, no hace falta pasarles nada.

- **motion** — `MotionConfig reducedMotion="user"` y los tres springs de
  `lib/springs`: `fast` para hover, `moderate` para dropdowns y tabs, `slow`
  para diálogos. La salida siempre es un escalón más rápida que la entrada.
- **sizes** — `SizeProvider`, escalera de 36px (default) y 28px (compact). La
  densidad es una decisión de región: envolvés un bloque en su propio
  `<SizeProvider size="compact">` y todo lo de adentro la sigue, menús
  portaleados incluidos.
- **surfaces** — `SurfaceProvider` más `Elevated` y los tokens
  `--surface-1…8`. Cada capa sube un escalón sobre el sustrato que la
  contiene, así un popover dentro de un diálogo sigue siendo legible.
- **scrollbars** — `ScrollArea` más las utilidades `scroll-fade`,
  `scroll-fade-x` y `scroll-divider` de `index.css`.

Se suman `ShapeProvider` (radios) y `TooltipProvider`, que los componentes dan
por presentes.

---

## Estilos vendorizados en `index.css`

**No borres los bloques del final de `src/index.css` aunque parezcan de más.**

El registry no instala varios estilos que sus componentes sí asumen: viven en
el `globals.css` del sitio de docs y hay que copiarlos a mano. Están al final
del archivo, cada bloque con un comentario de dónde salió:

- los tokens de interacción `--hover`, `--active`, `--selected`,
  `--destructive-light`, `--focus-ring` y el damero del ColorPicker. Sin ellos
  Tailwind no llega a generar `bg-hover` ni `bg-active`, y **todo el resalte
  por proximidad de la librería pinta transparente**;
- las utilidades `scroll-fade`, `scroll-fade-x`, `scroll-divider` y
  `scrollbar-hide`;
- el anillo `:focus-visible`, que lee el `--shape-input-radius` que publica
  `ShapeProvider` sobre `<html>`;
- `html.transitioning`, el crossfade al cambiar de forma;
- scrollbars nativos, `color-scheme` y el fondo sobre `<html>`.

Aparte, los `@keyframes` del spinner del Button están a nivel top-level y no
dentro de `@theme`: ahí Tailwind v4 los descarta, porque el componente aplica
la animación con un `style` inline que el compilador no ve.

## Tema

El tema oscuro se activa con la clase `.dark` en `<html>`; el toggle está en el
header de la demo. A diferencia del sitio de docs, este proyecto no sigue al
sistema operativo — si lo querés, el cambio va en el `useState` del toggle
leyendo `matchMedia`, no en el CSS.
