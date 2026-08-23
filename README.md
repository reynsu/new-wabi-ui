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
| `npm run lint` | oxlint — **no pasa limpio**, ver abajo |
| `npm run fix:fluid` | reaplica el parche de `next/link` — ver abajo |

### Sobre `npm run lint`

Hoy tira **3 errores y 169 warnings**, y los 172 están en código del registry
(`components/ui`, `lib`, `hooks`). En código propio — `App.tsx`, `main.tsx`,
`sections/` — hay **cero**.

Son cosas como hooks llamados condicionalmente en `ask-user-questions.tsx` o
deps no memoizadas: decisiones del autor de la librería, no del proyecto. Como
el registry copia el código fuente a tu repo, el linter lo trata como tuyo.

Si querés que el comando sirva de puerta de calidad, excluí los directorios
vendorizados en `.oxlintrc.json` en vez de ir a arreglar componentes que el
próximo `shadcn add --overwrite` te va a pisar.

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
