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
| `npm run build` | el registry, `tsc -b` y después el build de producción a `dist/` |
| `npm run build:registry` | genera `public/r/` desde `registry.json` — ver abajo |
| `npm run preview` | sirve el `dist/` ya construido |
| `npm run lint` | oxlint sobre el código propio — ver abajo qué queda afuera |
| `npm run fix:fluid` | reaplica el parche de `next/link` — ver abajo |

### Sobre `npm run lint`

Pasa limpio. Para que sirva de puerta de calidad, el `ignorePatterns` de
`.oxlintrc.json` deja afuera los tres directorios que instala el registry:
`components/ui/`, `lib/` y `hooks/`.

No es esconder la basura debajo de la alfombra. Ahí adentro había **3 errores y
169 warnings** — hooks llamados condicionalmente en `ask-user-questions.tsx`,
deps no memoizadas, refs leídos en render — que son decisiones del autor de la
librería, no del proyecto. Como el registry copia el código fuente al repo, el
linter lo trataba como nuestro; arreglarlo ahí sería trabajo que el próximo
`shadcn add --overwrite` pisa.

En código propio quedan tres avisos silenciados uno por uno, cada uno con el
motivo escrito al lado: la composición de refs de `travel-tooltip.tsx` (dos) y
el `useWorkspace` que viaja con su provider en `workspace-context.tsx`. Si
aparece un aviso nuevo, es de verdad.

## Estructura

```
src/
  components/ui/    los 24 componentes + 6 módulos internos (ver abajo)
  lib/              springs, size/shape/surface/icon context, elevated, utils
  hooks/            use-proximity-hover, use-touch-primary, use-merge-split
                    + use-measured-height (propio, lo usa PeekCard)
  sections/         la demo que ejercita todos los componentes y blocks
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
| `AnimatedEmpty` | el estado vacío con la anatomía del `Empty` de shadcn, pero que entra escalonado y sale al revés |
| `FilterMenu` | el menú de filtros de dos niveles: los atributos de una vista y, adentro de cada uno, sus valores |
| `InsetDialog` | el diálogo con el contenido embutido en su propia tarjeta: cabecera y pie comparten el plano del marco |
| `MobileActionConfirmation` | la hoja que confirma una acción en pantalla de teléfono, y la secuencia de pasos cuando la acción es más de una |
| `PeekCard` | la tarjeta con pestañas que se abre pegada a lo que la dispara, con el clic o con el hover |
| `TravelTooltip` | un tooltip compartido por un grupo: al pasar de un trigger al vecino se traslada en vez de reaparecer |
| `WindowControls` | la barra que controla ventana y sidebar — pantalla completa, ventana flotante, panel lateral |
| `WorkspacePanel` | el marco de contenido con pestañas conectadas que va al lado del sidebar |

### Dos niveles adentro del mismo panel

`FilterMenu` no abre un submenú al costado: al elegir un atributo, la lista se
corre a sus valores y el panel se queda quieto en su ancla. Un submenú lateral
obliga a cruzarlo en diagonal sin salirse, y con ocho atributos ya no entra al
lado del primero.

```tsx
<FilterMenu
  groups={[
    { label: "Atributos de la persona", attributes: [
      { id: "name",   label: "Nombre", icon: Contact,  type: "text" },
      { id: "status", label: "Estado", icon: Loader,   options: STATUS },
      { id: "owner",  label: "Responsable", icon: UserRound, options: OWNERS, single: true },
    ]},
  ]}
  value={selection}
  onValueChange={setSelection}
/>
```

**El nombre viaja.** Al entrar en un atributo, su glifo y su etiqueta no se
apagan en la fila para prenderse en la cabecera: son el mismo elemento en dos
lugares —comparten `layoutId`— y framer los lleva de una posición a la otra.
Eso es lo que ata el nivel nuevo a la fila que lo abrió: se ve de dónde salió.
Va con `layout="position"`, porque la caja cambia de ancho entre los dos
lugares y una animación de layout completa corregiría ese cambio escalando, que
en un texto se lee como una goma. Dos detalles que lo sostienen: el botón de
volver aparece con su ancho ya puesto —si creciera, el lugar al que apunta el
nombre se estaría moviendo mientras el nombre vuela hacia él— y la lista que se
va se apaga con la salida del escalón rápido, para que la copia de abajo dure
lo menos posible.

El viaje es sólo de ida. Al volver, lo que se recupera es la lista entera y no
una fila: un nombre bajando solo hacia su renglón se leería como un salto, y
además media caída pasaría abajo del buscador, recortada por el marco que
scrollea. El `layoutId` lleva un número de viaje que sube en cada vuelta, así
las filas que vuelven ya no comparten id con la cabecera que se está yendo.

`FilterSelection` es `id del atributo → valores`, y un atributo sin valores no
está en el mapa: nunca queda un arreglo vacío, así que contar los filtros o
pintar los chips de afuera no necesita descartar nada. Un atributo `single`
reemplaza en vez de sumar y vuelve solo al primer nivel; uno de `type: "text"`
no tiene lista y el buscador pasa a ser su campo de valor —Enter agrega lo
escrito como término.

### Contra los cuatro sistemas

Nada del panel está medido a ojo. La densidad sale de la escalera —`control`
para el alto de las filas, del buscador y de la cabecera, `icon` para los
glifos y para la caja del contador, `itemPx` y `gap` para el aire—, y el tope
de la lista es `controlHeight × 7`, así que en compacto se siguen viendo siete
filas y no siete y media. Las filas leen el `SizeProvider` por contexto y no
por props: el contexto cruza el portal, que es lo que hace que la fila del menú
mida lo mismo que el botón que lo abrió.

El resaltado de las filas es el mismo `useProximityHover` que usan el sidebar y
el `dropdown`: el hook mide las filas y devuelve la **más cercana** al puntero,
no la que está literalmente abajo, y lo que se pinta es una sola capa que viaja
de fila en fila con el escalón `fast` más una opacidad de 80ms. Un fondo por
fila que prende y apaga —lo primero que escribí acá— se siente duro al lado del
sidebar por las dos cosas: no hay travesía, y el resaltado se apaga en el aire
que queda entre dos filas.

Cada nivel tiene su propio medidor, y por eso la lista es un componente aparte
(`PanelList`). Las filas se anotan por índice, y durante el cruce las dos
vistas están montadas a la vez: con un medidor compartido los índices se pisan
y, al desmontarse la vista que se va, su limpieza borra las filas de la que
acaba de entrar — el resaltado desaparece y no vuelve más. Las filas se anotan
en un efecto con `[index, registerItem]`, como los items del `dropdown`, y no
con un ref inline: un callback nuevo en cada render hace que React desmonte y
remonte el ref, cada vuelta invalida la medición, y el resaltado queda
parpadeando a razón de un cuadro.

El plano lo pone `Elevated` con `offset={2}` y `shadowLevel={3}`: el fondo
sigue al sustrato —un `FilterMenu` adentro de un diálogo abre más alto— pero la
sombra pesa siempre igual, y el nivel se vuelve a publicar hacia adentro. El
scroll es `ScrollArea` con `scroll-fade` en el viewport y `scroll-divider` en
el marco; el tope de alto viaja como variable CSS porque sale de la escalera en
tiempo de ejecución y Tailwind sólo genera las clases que puede leer en el
código. Los radios son los de `shapeMap.rounded`, del que el panel se baja a
propósito igual que el `dropdown`. Y todo lo que se mueve —panel, título,
lista, pie— usa `spring.moderate`, el escalón de popovers, con su salida más
rápida que la entrada.

### El foco se queda en el buscador

El `<input>` es el mismo nodo en los dos niveles: cambian el placeholder y el
texto, pero nunca se desmonta, así que se puede filtrar, entrar a un atributo y
seguir tecleando sin volver a hacer foco. Las filas no son focusables — el
campo es un `combobox` y señala la fila activa con `aria-activedescendant`—
porque un foco que viajara fila por fila saldría del campo donde se escribe.

De ahí sale el resto de las teclas: ↑↓ mueven el resaltado y dan la vuelta,
Enter activa la fila, → entra al atributo (sólo con el cursor al final del
texto, si no la flecha es del campo), ← y Backspace vuelven con el campo
vacío, y Escape deshace de a un paso —primero la búsqueda, después el nivel, y
recién ahí cierra—. Ese último paso se lo tenemos que sacar a Base UI de las
manos: escucha la tecla en el contenedor del portal, así que hay que cortar la
propagación del evento nativo y, para el foco fuera del campo, cancelar el
`onOpenChange` con `reason === "escape-key"`.

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

El showcase mismo corre así: cada ítem del sidebar abre su pestaña con
`openTab`. Volver a tocar uno ya abierto lo enfoca en vez de duplicarlo, y la
fila resaltada del sidebar sigue a la pestaña activa y no a un estado propio.

Y el panel **no vive adentro del contenido: es el contenido**. En vez de colgar
de un `SidebarInset`, lo reemplaza: con `as="main"` es el `<main>` del
documento y se lleva los márgenes que el inset ataba al estado del sidebar —
salen del mismo `peer`. Lo que desaparece con el inset es una tarjeta que sólo
servía para contener a otra, con su fondo, su sombra y su padding alrededor del
panel; y al perder ese marco el panel se apoya derecho sobre el sustrato de la
página, así que la barra baja del escalón 2 al 1 y el plano del 4 al 3.

La cabecera del inset tampoco hacía falta: el botón de sidebar y el nombre de
lo que se está viendo ya los pone la barra de pestañas, y el toggle de tema
—lo otro que vivía ahí— bajó al pie del sidebar.

`as` es `div` por defecto y no `main`, porque la página del showcase muestra
tres paneles a la vez y un documento tiene un solo main.

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

### La fila scrollea, el botón del sidebar no

Con las pestañas abiertas desde el sidebar son catorce, y la fila se pasa de
largo. Scrollea en horizontal, sin barra visible —es una fila de 32px, un
scrollbar nativo se comería un tercio— y con `overflow-y: hidden`, que acá no
tiene a dónde ir.

**El botón del sidebar quedó afuera de lo que scrollea.** Es del panel y no de
las pestañas: si viajara con ellas se iría de vista justo cuando más hace falta,
con muchas abiertas. La fila de arriba pasó a ser dos cosas: el botón, fijo, y
al lado el `tablist` que scrollea.

**Un contenedor que scrollea recorta lo que se sale, y de la pestaña activa se
sale bastante.** Abajo, el faldón, que baja `BAR_GAP + TAB_OVERLAP` para
montarse sobre el plano; a los costados, los arcos de las esquinas cóncavas,
que se salen `TAB_RADIUS`. Los tres cortes se resuelven igual: el `tablist`
lleva ese espacio como padding —abajo, izquierda y derecha— y abajo se lo
devuelve al layout con un margen negativo del mismo tamaño. La caja de recorte
crece hasta donde la pestaña pinta y la barra sigue midiendo lo mismo. Sin el
pixel de abajo, el recorte come justo la parte del faldón que tapa el anillo
del plano y reaparece la costura que el faldón existe para esconder. El padding
izquierdo hace además de aire entre el botón y la primera pestaña.

**La activa se trae a la vista** cuando la elige algo que no es la barra —un
`openTab` desde el sidebar—, y sólo si no entra. Se asigna `scrollLeft` en un
`useLayoutEffect`: un `scrollTo({ behavior: "smooth" })` se cancela solo a mitad
de camino más veces de las que llega, porque el cambio de pestaña remonta el
contenido del plano en el mismo cuadro. Además, lo que tiene que leerse como
movimiento acá es el selector, que ya viaja por su cuenta; la fila debajo de él
es puro transporte.

---

## Un diálogo con el contenido embutido

El `Dialog` del registry apoya todo sobre un solo plano: cabecera, contenido y
pie comparten fondo y lo que separa las tres zonas es el aire. `InsetDialog`
levanta el contenido en una tarjeta y deja alrededor el marco que la sostiene.
Sirve cuando el contenido es una pieza en sí misma —una lista larga, una tabla,
un registro que corre— y el marco es lo estable: título arriba, acciones abajo,
y en el medio algo que se mueve.

```tsx
<InsetDialog open={open} onOpenChange={setOpen} disablePointerDismissal>
  <InsetDialogContent size="lg">
    <InsetDialogHeader>
      <InsetDialogTitle>Agent Handoff</InsetDialogTitle>
      <Badge size="compact">4 agents</Badge>
      <span className="ml-auto">4.1s</span>
    </InsetDialogHeader>

    <InsetDialogBody>
      <InsetDialogGroup label="Task" aside="run_7c42">…</InsetDialogGroup>
      <InsetDialogGroup label="Handoff log" aside="8 / 19">…</InsetDialogGroup>
    </InsetDialogBody>

    <InsetDialogFooter>
      <span>Researcher · leyendo 6 fuentes</span>
      <div className="ml-auto flex gap-2"><Button>Restart</Button></div>
    </InsetDialogFooter>
  </InsetDialogContent>
</InsetDialog>
```

Es la **base de diálogo de los componentes propios**: del portal al popup hace
el mismo baile que el `DialogContent` del registry —velo, `transitionStatus`
para que la salida se vea entera, escotilla `container`, los anchos de la
escalera—, más las dos cosas que el suyo no expone y que esta base necesita: el
ancla al piso y el clic afuera que no cierra. `MobileActionConfirmation` es un
`InsetDialog` con `placement="bottom"`.

### Dos anclas, dos escalones de motion

Centrado es un diálogo y entra con `spring.slow`, el escalón de los diálogos.
Anclado al piso es una hoja: va con `moderate`, que está críticamente
amortiguado, porque una hoja pegada al borde que rebota se va abajo de la
pantalla y vuelve — el mismo motivo por el que lo usa el `MobileDrawer`. El
ancla al piso además respeta la barra de gestos (`env(safe-area-inset-bottom)`)
y se lleva la X: una hoja anclada trae sus dos salidas en el pie, y una X
arriba sería una tercera.

### El diálogo no sube: baja su marco

La tarjeta se queda en el escalón de siempre —sustrato + 4, el mismo que el
diálogo del registry ya publicaba hacia adentro—, así que un popover abierto
adentro sigue subiendo desde donde subía. **Lo que se corre es la bandeja,
cuatro escalones para abajo.**

Al revés no se puede. La otra lectura —dejar la bandeja donde está y subir la
tarjeta— parece más natural, pero en claro la escalera está aplanada en blanco
desde el escalón 3: los dos planos quedarían del mismo color y no habría
tarjeta que ver. Abajo es donde al tema claro todavía le queda recorrido,
`#FAFAFA` contra `#FFFFFF`. En oscuro el mismo salto da `#171717` contra
`#333333`, que es de sobra.

Los cuatro escalones son el mismo número que sube un diálogo, y por eso la
bandeja de un `InsetDialog` abierto sobre la página cae exactamente en el
escalón 1. Si se abre sobre un sustrato más alto los dos suben juntos y el par
se acerca al techo de la escalera; ahí lo que separa la tarjeta es el anillo,
igual que en claro.

### Fondo de un escalón, sombra de otro

La bandeja toma el fondo del escalón de abajo pero **la sombra pesa la de un
diálogo** — es la que la despega del velo, y es la que `DialogContent` ya
ponía. Es la misma separación entre fondo y peso que hace el `FilterMenu` con
`Elevated` y su `shadowLevel`.

La tarjeta va al revés: fondo del escalón alto y **sombra fija en el escalón
2**, que es el anillo y una línea, nada más. No flota: está embutida. En oscuro
la despega el color; en claro, donde los dos son casi el mismo blanco, la línea
la dibuja entera el anillo.

### Dos cosas que salen de que sea una superficie de trabajo

**El clic afuera no cierra, si se lo pedís.** Un diálogo así suele ser un lugar
donde se está haciendo algo, o una pregunta que hay que contestar, y no algo
que se descarta al pasar: perderlo por un clic al costado es perder el lugar
donde se estaba. El `Dialog` del registry no expone esa perilla de Base UI, y
junto con el ancla al piso es la razón por la que esta base va sobre
`@base-ui/react/dialog` en vez de sobre la suya — que de todos modos es un
pasamanos de tres líneas sobre lo mismo.

**La cabecera reserva el carril de la X.** `DialogContent` la ancla en
`right-3 top-3`, que es la misma esquina en todos los diálogos de la app.
Correrla acá sería que este diálogo cierre en un lugar distinto que el resto,
así que en vez de moverla, la cabecera le deja el carril libre y lo que va a la
derecha del título arranca antes.

El contenido scrollea adentro de la tarjeta, con `ScrollArea` y `scroll-fade`,
y el relleno va en el viewport y no en la tarjeta: si estuviera afuera, el
texto se cortaría contra el canto al scrollear en vez de disolverse. Por eso la
bandeja no se mueve — el registro puede crecer sin que el título ni los botones
cambien de lugar.

---

## La hoja que confirma en el teléfono

`MobileActionConfirmation` es una hoja anclada al piso: qué acción es —glifo y
nombre—, qué implica, y las dos salidas. Va al piso y no al centro porque en un
teléfono el pulgar llega abajo; una hoja centrada deja las dos acciones en la
mitad de la pantalla, donde hay que reacomodar la mano para tocarlas.

```tsx
<MobileActionConfirmation
  open={open}
  onOpenChange={setOpen}
  tone="destructive"
  confirmLabel="Borrar"
  onConfirm={borrar}
  steps={[{
    id: "delete",
    icon: Trash2,
    title: "Borrar el shader",
    description: "Se borra de la biblioteca y de los proyectos donde lo estés usando.",
  }]}
/>
```

Con más de un paso en `steps` la misma hoja se pone el contador arriba y el
riel de puntos abajo, y «Continuar» avanza en vez de confirmar. Sirve para una
acción que se contesta en varios tramos —permisos, alta guiada— sin cambiar de
componente ni de pantalla.

Es un [`InsetDialog`](#un-diálogo-con-el-contenido-embutido) anclado al piso, y
el reparto de zonas cae solo: el paso —glifo, nombre y qué implica— va en la
tarjeta, y el contador, la salida de arriba, el riel y las dos acciones quedan
en la bandeja. Eso es exactamente lo que separa lo que cambia de lo que no:
al pasar de un paso al siguiente se mueve una sola cosa, y el marco que la
rodea es todo lo que se queda quieto.

Adentro de la tarjeta el relleno es propio y no el de `InsetDialogGroup`: el
grupo está hecho para una tarjeta con varios bloques, y su inset, sumado al de
la bandeja, le come cuarenta pixeles de renglón a una columna de teléfono.

### La escalera sube al pulgar con un solo número

36px pasa el mouse pero no el dedo: las dos plataformas piden 44px de lado. En
vez de escribir 44 y 52 a mano, todo sale de `TOUCH_BUMP` sumado a la escalera
— la fila de acciones lo suma dos veces sobre el alto de control y el tile del
glifo una. Así el escalón compacto da 44 y 36, el default da 52 y 44, los dos
quedan arriba del piso táctil y la diferencia entre densidades se sigue
leyendo.

**En un táctil el escalón es siempre el compacto**, gane lo que gane afuera: ni
la prop `size` ni el `SizeProvider` de arriba. Un escalón default en una
columna de 360px deja la descripción en el doble de renglones y empuja las
acciones abajo del pliegue del pulgar. Y justamente porque el salto al pulgar
es el mismo en los dos escalones, lo que se achica ahí es el aire y nunca el
objetivo táctil: la acción sigue midiendo 44px, que es el piso y no el techo.
El dispositivo lo dice `useTouchPrimary` —puntero grueso más puntos de
contacto—, que devuelve `false` en el primer render para que la rama no táctil
sea la estable; como la hoja se monta cerrada, para cuando se abre el valor ya
está resuelto. El resto es la escalera sin tocar: los textos salen del `useTypeScale`
—`title` para el nombre, `body` para la descripción, `caption` para el
contador—, el glifo del tile sale de `icon`, y el aire entre las dos acciones
de `gap`.

El plano lo pone `Elevated` con `offset={4}`, el escalón de un diálogo, y el
nivel se vuelve a publicar hacia adentro. En claro la escalera está aplanada en
blanco desde el escalón 3, así que lo que despega la hoja del velo no es el
fondo sino el anillo de la sombra. Los radios son los de `shapeMap.container`,
y el tile toma `shapeMap.item`.

### El alto se anima, el contenido se cruza

Dos pasos con descripciones de distinto largo cambian el alto de la hoja; como
está anclada al piso, ese cambio la haría saltar. El alto viaja con
`spring.moderate` a la medida del paso que entra, y los dos pasos conviven
durante el cruce —`popLayout` saca de flujo al que se va—, así el que entra ya
mide bien antes de que el otro termine de irse. La dirección la pone quien
dispara el cambio: adelante entra por la derecha, atrás por la izquierda; sin
eso los dos lados del recorrido se ven iguales y volver no se distingue de
avanzar.

**El que mide es un ref estable y no suelta el observer cuando lo llaman con
`null`.** Un callback nuevo en cada render hace que React desmonte y vuelva a
montar el ref, y cada vuelta invalida la medición. Y como durante el cruce los
dos pasos están montados, el que se va llama al ref con `null` *después* de que
el que entra ya se anotó: soltar ahí borraría la medición del que se está
quedando.

La hoja entra y sale con `spring.moderate` y no con `slow`, que es el escalón
de los diálogos: `moderate` está críticamente amortiguado, y una hoja anclada
al piso que rebota se va abajo del borde y vuelve. Es la misma razón por la que
lo usa el `MobileDrawer`.

El punto activo del riel es una sola capa que se desplaza, como el selector de
`WorkspacePanel`. Acá el viaje sí puede ser un `transform`: el punto no cambia
de tamaño entre posiciones, así que no hay redondeo que deformar. Pasados los
siete pasos el riel se retira y queda sólo el contador — veinte puntos no se
cuentan de un vistazo.

### Se contesta, no se descarta

Va con `disablePointerDismissal` y `role="alertdialog"` — las dos perillas que
`InsetDialog` expone y que el `AlertDialog` de Base UI trae fijas a cambio de
no dejar apagar el atrape del foco. Esa tercera perilla hace falta para la prop
`container`: con la hoja portaleada adentro de una pantalla de teléfono
dibujada —el showcase— el atrape se llevaría el foco de toda la página que la
rodea, así que ahí `modal` arranca apagado. El clic afuera no cierra en ningún
caso: no es ninguna de las dos respuestas. Escape sí, que es la cancelación de
siempre.

El título y la descripción se etiquetan a mano y no con `Dialog.Title`: durante
el cruce hay dos pasos montados, y los dos publicarían su id sobre el mismo
popup — el `aria-labelledby` terminaría apuntando al paso que se está yendo.
Cada paso lleva ids propios, derivados de su `id`, y el popup apunta a los del
que entra. El cuerpo es `aria-live="polite"` para que el paso nuevo se anuncie,
y el foco entra al confirmar y no al primer tabulable: la hoja pregunta una
cosa y esa es la respuesta esperada.

## Una tarjeta pegada a lo que la abre

`PeekCard` es el escalón que falta entre el tooltip y el diálogo: más de lo que
entra en una píldora de una línea, menos de lo que justifica tapar la pantalla.
Un nombre, un ícono, una acción, un riel de `Tabs` y el cuerpo de la pestaña
elegida — todo anclado al elemento que la disparó, para que se lea como una
ampliación de ese elemento y no como una ventana nueva.

Por dentro es una `Card` del registry —la misma que se usa en cualquier lista o
grilla— puesta adentro de un popup: un solo plano, y lo que separa el título del
cuerpo y el cuerpo del pie es el aire.

```tsx
<PeekCard
  title="Perfil de donación"
  icon={HandHeart}
  action={<Button variant="tertiary" size="compact" leadingIcon={HeartPlus}>Donar</Button>}
  footer={<Button variant="tertiary" leadingIcon={History} className="w-full">Ver el historial</Button>}
  tabs={[
    { label: "Resumen", content: <Resumen /> },
    { label: "Meta", content: <Meta /> },
    { label: "Estadísticas", content: <Estadisticas /> },
  ]}
>
  <Button variant="secondary">Ver el perfil</Button>
</PeekCard>
```

El hijo es el disparador: la tarjeta le cuelga el gesto, el ancla y el estado
de abierto. Un elemento suelto en el JSX no necesita nada; un componente propio
tiene que reenviar props y ref —como hace `Button`— o se queda sin nada que la
abra.

### Un solo componente para los dos gestos

`openOn="click"` y `openOn="hover"` son la misma tarjeta con la misma anatomía;
lo único que cambia es qué la abre. Casi todas las librerías parten eso en dos
componentes —popover y hover-card— y esa división obliga a mantener dos veces
la misma anatomía para terminar eligiendo por el gesto, que es lo de afuera.
Acá el gesto es una prop.

Con `openOn="hover"` el clic la sigue abriendo, que es lo único que queda en un
teléfono: ahí no hay puntero que pase por encima. Y **el hover no se lleva el
foco**: una tarjeta que aparece porque el puntero pasó por arriba no lo pidió,
y moverlo saca al teclado de donde estaba y hace saltar el scroll. Con hover el
foco entra sólo si la abrió el teclado; con clic entra siempre, porque ahí hubo
una intención explícita. La gracia de 120ms al salir es el tiempo que tarda el
puntero en cruzar el hueco entre el trigger y la tarjeta.

### Una Card común adentro de un popup

La `Card` del registry es transparente y sin marco a propósito: hereda el
sustrato de quien la contiene y se apoya en el aire y en las divisiones finas en
vez de dibujar un cuadro. Eso la hace justo lo que hace falta acá — pone el
reparto y el relleno (`CardHeader`, `CardContent`, `CardFooter`, con el ritmo de
la escalera), y la superficie la pone el popup.

El popup sube los dos escalones de cualquier popup del sistema con `Elevated`, y
publica ese nivel hacia adentro: un menú abierto adentro de la tarjeta sigue
subiendo desde donde subía. La sombra queda fija en la de un popup, por el mismo
motivo que la del `Dropdown` — una tarjeta pesa lo mismo abierta sobre la página
que adentro de un diálogo, aunque su fondo siga al sustrato.

**El riel de pestañas es la única excepción al plano.** Su segmento activo se
pinta tres escalones arriba de lo que lee; leído desde adentro del popup —que ya
subió dos— aterriza en el 6, que en oscuro es el mismo valor que el riel: la
pestaña elegida desaparece. Así que ahí adentro se vuelve a publicar el escalón
sobre el que se apoya el popup, y el segmento cae en el mismo 4 que tendría un
`Tabs` sobre la página. Es lo único que necesita el número de abajo: lo que se
abre encima sigue leyendo el del popup.

El ancho sale de la escalera —360, y 320 en una región compacta: el ancho, no el
relleno—, y las pestañas se reparten ese ancho. El `flex-1` va sin `min-w-0` a
propósito: reparte el sobrante cuando las etiquetas entran, pero ninguna pestaña
baja de lo que mide su texto, así que con etiquetas largas el riel scrollea de
costado en vez de que las etiquetas se pisen.

El techo lo pone `--available-height`, lo que Base UI midió entre el ancla y el
borde de la pantalla: la tarjeta nunca se sale del viewport, y cuando el cuerpo
no entra el que cede es él —scrollea por dentro— mientras el título, el riel y
el pie se quedan donde están.

### Cambiar de pestaña anima el alto

Las pestañas casi nunca miden lo mismo, y una tarjeta anclada que cambia de
alto de golpe salta contra su ancla — sobre todo abriendo hacia arriba, donde
el borde que se mueve es el de abajo. El alto viaja con `spring.moderate` a la
medida de la que entra, y las dos conviven durante el cruce: la que entra ya
publicó su medida antes de que la otra termine de irse, así el viaje es uno
solo y no dos tirones.

**La caja y lo que lleva adentro van con el mismo escalón.** El cuerpo que
entra usa `spring.moderate`, igual que el alto, así que arrancan y llegan
juntos: se lee como un movimiento y no como dos. Con el escalón rápido en el
cuerpo —que fue el primer intento— el texto quedaba quieto a mitad de camino,
esperando que la caja lo alcanzara. Lo único que no sigue al resorte es la
opacidad, que va con las duraciones cortas del sistema y con la salida un paso
más corta que la entrada: si los dos cuerpos se cruzan legibles, se leen
superpuestos.

La dirección sale del cambio de índice —a la derecha entra por la derecha, a la
izquierda por la izquierda— y no de quién lo disparó: manejada desde afuera, la
pestaña cambia sin pasar por el riel, y volver se vería igual que avanzar.

Medir es `useMeasuredHeight`, en `src/hooks/`: `offsetHeight` y no
`getBoundingClientRect`, porque bajo el spring de escala del popup el rect da
el alto visual y la tarjeta animaría hacia un número que deja de ser cierto en
cuanto la escala llega a 1. Es la misma medición que hace
[`MobileActionConfirmation`](#el-alto-se-anima-el-contenido-se-cruza) para el
cruce de pasos, con las mismas dos precauciones: el ref es un callback estable
y no suelta el observer cuando lo llaman con `null`.

El panel se arma a mano en vez de con `TabPanel`: ese esconde al que no está
elegido, y durante el cruce los dos tienen que seguir montados. Los ids se los
ponemos nosotros a las pestañas —sin un `Tabs.Panel` de Base UI registrado no
tienen a qué apuntar—, así que el `aria-controls` de cada una sigue cayendo en
su panel; el `aria-labelledby` del popup lo pone `Popover.Title` con el título
de la tarjeta.

Con `prefers-reduced-motion` no queda nada de esto: el alto no viaja y el
desplazamiento se apaga entero —un corrimiento lateral sin caja que lo acompañe
es movimiento por movimiento—; el cuerpo aparece y desaparece en el lugar.

### No es modal

La página sigue scrolleando y el positioner de Base UI sigue al ancla, así que
la tarjeta viaja con su trigger en vez de quedarse flotando donde estaba. Es lo
que separa una ampliación de un diálogo: si hay que bloquear lo de atrás, lo
que hacía falta era un `Dialog`. Del resto —dar vuelta el lado cuando no entra,
cerrar con Escape o con un clic afuera— se ocupa `Popover` de Base UI; la
tarjeta le agrega la superficie, la `Card` de adentro y el spring de entrada,
que crece desde el borde pegado al trigger: `moderate`, el escalón de los
popups y las pestañas, con la salida un escalón más rápida.

El índice de la pestaña vive afuera del popup: el popup se desmonta al cerrar,
así que la tarjeta reabre donde la dejaron. Se puede manejar desde afuera con
`tab` / `onTabChange`, igual que `open` / `onOpenChange`; se recorta contra la
lista, y la dirección del cruce se deriva del cambio de índice —no de quién lo
disparó— para que un cambio hecho desde afuera entre por el lado correcto.

---

## El vacío que se arma solo

`AnimatedEmpty` tiene la anatomía del [`Empty`](https://ui.shadcn.com/docs/components/empty)
de shadcn —bloque centrado, media, título, descripción y una zona de acciones,
cada pieza suelta— para que el que ya lo escribió una vez no tenga que aprender
otra cosa. Lo que agrega es que el bloque **entra**.

```tsx
<AnimatedEmpty>
  <AnimatedEmptyHeader>
    <AnimatedEmptyMedia variant="figure" badge={<Plus />}><Folder /></AnimatedEmptyMedia>
    <AnimatedEmptyTitle>Creá tu primera carpeta</AnimatedEmptyTitle>
    <AnimatedEmptyDescription>No hay archivos en este espacio de trabajo.</AnimatedEmptyDescription>
  </AnimatedEmptyHeader>
  <AnimatedEmptyContent>
    <Button variant="secondary" leadingIcon={Plus}>Crear carpeta</Button>
  </AnimatedEmptyContent>
</AnimatedEmpty>
```

Un estado vacío aparece cuando algo se vació o una búsqueda no encontró nada:
los dos momentos en que el usuario está esperando ver otra cosa. Una pantalla
que se rellena de golpe con un cartel se lee como un error; la misma armándose
de arriba hacia abajo se lee como una respuesta.

### El orden lo pone la composición

Ninguna pieza declara su delay. El bloque escalona a sus hijos con
`staggerChildren` y el encabezado vuelve a escalonar los suyos, así que
reordenar el JSX reordena la animación y agregar una pieza no obliga a
recalcular los tiempos de las otras.

Por eso **todas las partes son componentes de motion**, incluso las que no
animan nada propio: la cadena de variantes viaja de padre a hijo por los
componentes de motion, y un `<div>` común en el medio la corta — lo de adentro
entraría sin turno.

**El paso de afuera es más del doble que el del encabezado**, y no es un número
elegido a ojo: los hijos del bloque son grupos, no renglones. Con el mismo paso
en los dos niveles el pie —que es hijo del bloque— arrancaba mientras el
encabezado todavía estaba sacando su descripción; medido en el navegador con
0.05 en los dos, a los 120ms el pie iba en 0.40 de opacidad y la descripción en
0.00.

Los tres niveles reparten con 0.72 el bloque, 0.30 el encabezado y 0.18 la placa
después de un respiro de 0.20, y eso deja este reparto: **placa a los 80ms,
glifo a los 280, título a los 380, sello a los 460, descripción a los 680 y pie
a los 800** — que con su propio medio segundo de viaje cierra pasada la marca
del segundo.

### Un escalón propio, y más lento

Los tres escalones de `lib/springs` son para **reacciones**: algo que el usuario
tocó y tiene que contestarle ya. Esto es otra cosa —una presentación, y de un
objeto grande— y a esa velocidad no se llega a ver: la primera versión cerraba
en 350ms y los tres tiempos de la figura se leían como un solo parpadeo. Un
objeto de 128px que cruza en 240ms es un destello; el mismo en medio segundo es
algo que se apoya.

Así que la presentación tiene sus propios pasos, y **viven en el componente y no
en `lib/springs`**: ese archivo es del registry y el próximo
`shadcn add --overwrite` se lo lleva puesto. Son cinco —placa, glifo, sello,
texto y salida— y el rebote va al revés del tamaño: 0.2 en la placa, 0.35 en el
sello de 20px. Un rebote que en un glifo chico es un detalle, a 128px es un
salto.

La salida sigue la regla de la casa —mucho más rápida que la entrada— pero
tampoco usa `fast`: contra una entrada de un segundo, 80ms se leen como que el
bloque desapareció, no como que se fue.

### La figura entra en tres tiempos

La media no es una sola cosa que se enciende: son tres que se arman. **La placa
se apoya** —llega con una inclinación de 4 grados que endereza al aterrizar, el
gesto de apoyar una carta sobre la mesa y no el de encender una lámpara—,
**después aparece el glifo** desde `scale: 0.6`, y **al final el sello**, ese
glifo chico en la esquina que convierte a la placa en un dibujo con una idea
adentro: el `+` de "todavía no hay ninguna", el reloj de "está por llegar".

El glifo espera a que haya dónde apoyarse a propósito. Los dos a la vez dejan la
escala del glifo peleando con la de la placa y el dibujo se lee temblando.

Los turnos de adentro salen del mismo mecanismo que los de afuera: la variante
de la placa lleva sus `staggerChildren` al lado de los valores que anima. Un
solo lugar que reparte, en los tres niveles.

```tsx
<AnimatedEmptyMedia variant="figure" badge={<Plus />}><Folder /></AnimatedEmptyMedia>
```

`variant` es lo que decide cuánto pesa la figura en la pantalla: `icon` es la
placa chica del `EmptyMedia` de shadcn, del tamaño de un control, para un vacío
que convive con otras cosas; `figure` la agranda a 128px con el glifo en 48,
para cuando el vacío **es** la pantalla —ahí un glifo de 20px flotando arriba de
un título de 15 no es el dibujo de nada—; y `default` no pone fondo, para una
ilustración propia, con un tamaño base que se corre si el que llama trae el
suyo. La placa grande toma el radio de contenedor y no el de item: a esa escala
el radio de un botón se pierde y se lee como un cuadrado.

### La figura escala, el texto viaja

Las tres piezas de la media entran con `spring.slow`, el único escalón con
rebote: son lo que se mira primero y pueden permitirse aterrizar. El sello,
además, sale de `scale: 0` —en 20px un rebote es un detalle; a los 128 de la
placa sería un salto.

El texto, en cambio, entra subiendo 6px y sin rebote, y no escala nunca: escalar
un párrafo lo pasa por medio pixel y durante el viaje se lee borroso, y un texto
que rebota se lee como un salto de línea.

### La salida va al revés

Envuelto en un `AnimatePresence`, el bloque se va de abajo hacia arriba
(`staggerDirection: -1`) con el escalón `fast`. Es la regla de la casa —la
salida siempre es un escalón más rápida que la entrada— y evita el cruce feo
cuando un vacío reemplaza a otro.

```tsx
<AnimatePresence mode="wait" initial={false}>
  {vacio && <AnimatedEmpty key={query ? "sin-resultados" : "sin-nada"}>…</AnimatedEmpty>}
</AnimatePresence>
```

Las dos cosas de ese fragmento importan. `mode="wait"` porque los dos bloques
están centrados en el mismo lugar y superpuestos se leen como un parpadeo. Y la
`key` por motivo de vacío porque **«acá no hay nada» y «todavía no hay nada» no
son el mismo estado**: sin ella React reusa el bloque y el texto cambia adentro
de una figura que ya está puesta, que es exactamente lo que este componente
existe para no hacer.

### Con reduced motion sigue habiendo coreografía

`MotionConfig reducedMotion="user"` descarta posiciones y escalas y deja las
opacidades, así que el bloque no aparece de golpe: se enciende en cascada, en el
mismo orden. Lo único que se apaga del todo es el `float` de la media —el bucle
lento de la placa— que es justo lo que un usuario con esa preferencia no quiere
ver. Va apagado por defecto, además: un bucle eterno en una pantalla que ya dice
"acá no hay nada" cansa.

### Contra los cuatro sistemas

La placa de la media es el `bg-muted` de shadcn traducido al sistema: un escalón
por encima del sustrato, con el anillo de la escalera. Así la misma placa se ve
sobre la página y adentro de un diálogo, porque el fondo sigue a donde esté
puesto el bloque. El radio sale de `shapeMap.item` —en modo pill una placa de
40px con radio 20 es un círculo, que es lo que corresponde—, los tamaños y el
aire salen de la escalera, y `size` no sólo achica el bloque: lo publica hacia
adentro, así el botón del pie entra del mismo tamaño en vez de quedar en el
default.

---

## El widget que se convierte en pestaña

`Widget` no es una cuarta clase de tarjeta al lado de `Card`, `PeekCard` e
`InsetDialog`. Es un **eje**, como la escalera de tamaños o la de superficies:
lo que cambia de escalón a escalón no es el componente sino cuánto detalle se
muestra de la misma cosa.

| escalón | dónde vive | qué muestra |
|---|---|---|
| `glance` | el mosaico del riel de widgets | un número, un estado, una fila |
| `peek` | la `PeekCard`, pegada al mosaico | el resumen con pestañas |
| `full` | una pestaña del `WorkspacePanel` | la vista entera |

Los dos escalones de arriba ya estaban construidos. Lo único nuevo es el
vistazo y el descriptor que los une:

```tsx
const aportes: WidgetDefinition = {
  id: "aportes",           // es también el id de su pestaña
  label: "Aportes del mes",
  icon: Wallet,
  span: "2x1",
  glance: () => <Cifra valor="$38.000" nota="142 aportes" />,
  peek: [{ label: "Resumen", content: … }],
  full: () => <Aportes />,
};
```

### El mosaico no abre la pestaña: se convierte en ella

Es todo el diferencial del concepto y es lo único que puede salir mal, así que
va primero. El plano del mosaico y el de la vista entera comparten `layoutId`,
y como el panel sólo monta la pestaña activa, uno se desmonta en el mismo
commit en que el otro se monta: Framer los reconoce como el mismo objeto y lo
lleva de un lado al otro. Volver a la pestaña del board hace el viaje al revés,
sin una línea más.

Sin eso la vista aparece de la nada y el board no se lee como el lugar del que
salió. Es la diferencia entre un dashboard de 2016 y algo que se siente actual,
y sale barato porque el mosaico y el panel ya viven los dos bajo `MotionConfig`.

El escalón es `spring.slow`, el de los diálogos: esto es un cambio de contexto
—la pantalla entera pasa a ser otra cosa— y no una reacción a un hover.

### Un widget se dibuja una vez por pantalla

Es la contracara de lo anterior, y conviene saberlo antes de que muerda: el
`layoutId` sale del id, así que **dos mosaicos del mismo widget montados a la
vez son, para Framer, el mismo objeto en dos sitios**. Los cruza, y uno queda en
opacidad cero desplazado hacia el otro. Si de verdad hacen falta dos vistas del
mismo dato, son dos descriptores con dos ids — es lo que hace la sección de
demo, que muestra dos boards en la misma pantalla.

### Cerrar el board

Arriba a la derecha del board va su botón, **con el board lleno y con el board
vacío**: un board sin widgets sigue ocupando una columna, y no poder sacarla
justo cuando no muestra nada sería el peor momento. Va afuera del
`AnimatePresence`, así que no se cruza con el contenido cuando el board se
vacía — lo que cambia es lo de abajo y el botón se queda donde estaba.

Siempre visible, a diferencia del de los mosaicos: aquellos son cuatro y uno por
tarjeta sería ruido; éste es uno solo y es la única forma de sacar la columna.

**Dice «Close», no una ×.** Un glifo suelto arriba de una grilla de tarjetas
—que ya tienen su propia × en cada una— se lee como una tarjeta más a la que le
falta el cuerpo; la palabra dice de qué se está hablando sin que haya que
deducirlo del tamaño ni de la posición. Va en el escalón `caption` de la
escalera de tipos, que es el «chico» del sistema, y sin `aria-label`: el nombre
accesible es el texto que se ve, que es lo que corresponde cuando hay uno — un
rótulo distinto del visible deja a quien maneja por voz pidiendo algo que no
está escrito en ninguna parte.

Cerrarlo **se lleva el riel entero**, salvo que haya un preview que mostrar — el
riel se dibuja si hay algo que poner en él, y un preview puede pedirse con el
board cerrado. Al cerrar ese preview el riel se va de nuevo.

Volver a abrirlo es un control de la barra del panel, con el mismo ícono que el
board tiene en el sidebar. Es la misma pareja que el sidebar y su botón: «Close»
lo saca, el control lo trae. Y el tirador de redimensionar **desaparece mientras no
hay riel**: un botón que no hace nada es peor que uno que no está.

| | riel | panel |
|---|---|---|
| board abierto | sí | 55% |
| cerrado con «Close» | no | 80.4% |
| reabierto desde la barra | sí | 55% |

### La caja que scrollea recorta el anillo

El primer escalón de `shadow-surface-*` es un **anillo de 1px pintado por fuera**
de la caja. La grilla del board vive en una caja con `overflow-y: auto`, y basta
un eje distinto de `visible` para que el otro también recorte: con la grilla al
ras de esa caja, cada tarjeta perdía el borde de arriba —el de la primera fila—
y los dos laterales. El de abajo se veía porque tenía contenido debajo, así que
lo que quedaba dibujado era exactamente «sin borde superior y sin laterales».

La caja se sale de su lugar cuatro píxeles (`RING_ROOM`) y se los devuelve como
padding: la grilla cae en el mismo sitio de siempre y el anillo tiene dónde
pintarse. Cuatro y no más porque tiene que seguir entrando en el `GAP` de 16 del
board, que es lo que lo mantiene adentro de su propio marco.

### El header del mosaico

Arriba de cada vistazo va un header chico: el ícono, el nombre en gris y, en la
esquina derecha, el botón que **quita el widget del board**. Sin fondo propio —
es el mismo plano del mosaico, y lo que lo separa del vistazo es el aire. Un
relleno ahí partiría la tarjeta en dos superficies para no ganar nada.

El botón **siempre está en el layout aunque no se vea**: aparece al pasar el
cursor por la tarjeta, pero ocupa su lugar desde el principio. Si apareciera
recién entonces, el nombre se correría bajo la mano. Es lo mismo que hace el
botón de cerrar de las pestañas del panel, y como allá, sin callback no se
renderiza: `WidgetBoard` avisa por `onWidgetClose` y **no es dueño de la
lista** — quien lo usa saca el widget de `widgets`.

Eso obligó a una decisión de estructura: lo que abre el widget dejó de ser un
`<button>` alrededor de todo y pasó a ser una superficie que cubre la tarjeta,
porque un botón no puede tener otro botón adentro y el de cerrar tiene que vivir
en el header. La superficie va después en el DOM, así queda por encima de todo
salvo de lo que se suba con `z-10` — que es exactamente el botón de cerrar.

El hueco que deja un widget abierto lleva el mismo botón: un widget se tiene que
poder sacar del board sin cerrar antes la pestaña que abrió.

### El mosaico que abrió deja un hueco

Sale de la regla de arriba, y es lo que hace que el board pueda vivir al
costado, siempre montado, sin pisarse con la pestaña que abrió: mientras el
widget es la pestaña **activa**, su casillero no dibuja el plano sino la
silueta de dónde estaba, con un «Abierto al lado».

Así el plano existe en un solo sitio a la vez —el traslado sigue siendo un
traslado y no un cruce— y además se lee mejor que si el mosaico se quedara
quieto mostrando lo mismo que la pantalla de al lado: el objeto se fue, y el
board lo dice. Al volver a otra pestaña el mosaico regresa a su casillero por el
mismo camino.

La comparación es contra la pestaña activa y no contra las abiertas, porque el
panel sólo monta la activa — que es exactamente cuando el otro plano existe.

### `glance` y `full` son funciones, no `ReactNode`

El board monta muchos widgets a la vez y de cada uno sólo necesita el vistazo;
con nodos ya construidos armaría los tres escalones de todos en cada render. Es
la diferencia con `WorkspaceTab.content`, que sí es un nodo: ahí ya se decidió
abrir esa pestaña.

### El tamaño es una escalera, no un arrastre

`1x1`, `2x1` y `2x2` sobre una grilla de filas de alto fijo. Una grilla
arrastrable trae su propia librería, sus estilos y una segunda fuente de verdad
sobre el layout — y contradice la regla de la casa: la densidad es una decisión
de región, no del usuario acomodando cajas.

El reparto sale de `@container` y no de un breakpoint de viewport, por el mismo
motivo que el `LoginBlock`: el board vive adentro del panel, que cambia de ancho
con el sidebar.

### Hover y clic no se pisan

El plano es el trigger de la `PeekCard`, y Base UI la abre también por clic
—lo hace para que en un táctil quede alguna forma de verla—. Acá el clic ya está
tomado por la vista entera, así que el botón del mosaico lo corta antes de que
suba: queda **hover** para el escalón del medio y **clic** para el de arriba. En
un táctil eso significa que el dedo abre la vista entera derecho, que es lo que
uno espera de un mosaico.

### Contra los cuatro sistemas

El mosaico sube los dos escalones de cualquier capa (`Elevated offset={2}`) y
publica ese nivel hacia adentro, así un menú abierto adentro de un widget sigue
subiendo desde donde subía. La esquina sale de `shape.container` en los dos
escalones —si no comparten radio, el traslado se ve como un cambio de figura y
no como el mismo objeto creciendo—, el texto del mosaico sale de la escalera de
tamaños, y con reduced motion el objeto no viaja pero el relevo se hace igual.

### El board es una región del shell, no contenido

El riel se monta en [`src/App.tsx`](src/App.tsx), al lado del
`WorkspaceOutlet` y del mismo rango que el sidebar del otro costado — no adentro
de ninguna pestaña. Los widgets de esta app se declaran en
[`src/widgets.tsx`](src/widgets.tsx), separados de la sección de demo
justamente porque quien los declara ya no es una pantalla.

Se apoya en el sustrato de la página igual que el panel y con los mismos
márgenes, así los dos planos arrancan del mismo escalón. Va **después** del
`WorkspaceOutlet` en el DOM y no antes: mide a su hermano anterior para saber
cuánto se están repartiendo.

### El panel nunca baja del 55%

El riel se agarra del borde y se estira, pero no contra un número máximo escrito
en ningún lado: contra el panel. La regla es una sola y sale de para qué está
cada uno — el panel es la columna de lectura de la app, y un costado que se la
come deja de ser un costado.

De esa regla salen tres comportamientos, y el del medio es el que le da carácter:

1. **El tirón se frena solo.** El riel crece hasta que el panel toca su 55% de
   la pantalla. Como el tope se calcula contra la ventana, cambia con ella —y
   el riel tiene además un techo propio de 560px, para que en un monitor ancho
   no se coma media pantalla sólo porque el 55% se lo permite.
2. **Antes de frenar, el sidebar cede.** Si al llegar al límite el sidebar
   todavía está abierto, se pliega — y con esos 256px de vuelta el tirón sigue
   en el mismo movimiento. Es el orden correcto de las prioridades: entre
   navegar y leer, primero leer.
3. **Recién ahí el freno es duro.** Con el sidebar ya plegado y el panel en su
   55%, no se puede seguir. No hay nada más que ceder.

La regla también vale sin tocar nada: al montar, al mover la ventana y al plegar
o desplegar el sidebar, el ancho se recorta contra el mismo tope. Y si el tope
cae por debajo de lo que mide un widget, el riel se va del todo — mostrar una
columna de 160px no es mostrar el board.

El cálculo no modela el layout —ni el ancho del sidebar, ni los márgenes—: mide.
Lo que los dos se reparten es `panel + riel`, que no cambia cuando uno crece a
costa del otro, y de ahí sale el tope en una línea:

```
topeDelRiel = anchoDelPanel + anchoDelRiel − 0,55 × ventana
```

### Los controles de la barra

El extremo derecho de la barra de pestañas es de la app, igual que el botón del
sidebar lo es del otro lado: `WorkspacePanel` lo expone por la prop `controls` y
lo deja **afuera de la fila que scrollea**, porque con muchas pestañas abiertas
se iría de vista justo cuando más hace falta.

[`src/App.tsx`](src/App.tsx) pone ahí un `WindowControls` con
`sidebar={false} more={false}` —el botón del sidebar ya está en el otro extremo
de esta misma barra, y el menú del navegador no tiene por qué acompañar a tres
controles de la app— y tres items propios adentro de su `TravelTooltip`, que es
lo que hace que el resalte cruce de un botón al otro sin cerrarse:

| botón | qué hace |
|---|---|
| tema | claro ⇄ oscuro. Vivía en el pie del sidebar; dos botones para lo mismo en la misma pantalla no son una comodidad, son una duda sobre cuál manda |
| avisos | todavía nada — está para reservarle el lugar |
| redimensionar | **mantenido apretado**, redimensiona el panel |

Los tres son `Button` en su escalón compacto —`icon-compact`, los 28px de la
escalera de tamaños— sin achicarlos a mano: la barra tiene su propia escalera y
un tamaño inventado al lado de ella se nota. Lo que cambia son dos cosas: el
**ícono en gris** (`text-muted-foreground`, que se enciende al pasar; un control
del marco no tiene por qué pesar lo mismo que un botón del contenido) y el
**fondo blanco**.

«Blanco» acá quiere decir el escalón más alto de la escalera de superficies:
`#FFFFFF` en claro y el gris que le corresponde en oscuro. Contra el `#FAFAFA`
de la barra eso es apenas un 2%, así que **lo que separa de verdad es la
sombra** — `shadow-surface-3` no es decoración sino la mitad del efecto. Es el
mismo recurso con el que el plano del panel se separa de la barra, donde la
escalera también está aplanada en blanco.

Se pisa `--btn-bg`, que es la variable con la que la variante `secondary` pinta
el relleno **y** su anillo, así los dos se mueven juntos y el hover de la
variante sigue resuelto. Va sobre la capa del botón y no sobre su raíz: la
variante declara esa variable en la capa, y una declaración de arriba nunca la
alcanza — las variables se heredan, pero la que el elemento define para sí mismo
gana.

El tercero no tiene lógica propia: le pasa su evento de puntero a la manija que
`WidgetRail` expone por `controlRef` y el riel hace el resto. Un tirón empezado
desde la barra y uno empezado desde el canto son el mismo tirón, y tienen que
frenar contra el mismo límite y plegar el mismo sidebar. Va por `onPointerDown`
y no por `onClick` porque lo que lo dispara es mantenerlo, no soltarlo.

Que se pueda empezar desde un botón lejos del canto es lo que obligó a que el
tirón sea **relativo** —el ancho es lo que se movió la mano desde donde apretó,
no la distancia del puntero al borde—. La cuenta absoluta mandaba el riel al
tope apenas se apretaba el botón. De paso arregla el canto: agarrarlo unos px
afuera del centro ya no lo hace saltar.

**El único que redimensiona es el botón de la barra.** El canto no se agarra:
no hay tirador ahí, ni línea que se encienda, ni tooltip. Un solo control, en un
solo lugar, con su etiqueta al lado — «Mantené apretado para redimensionar»— en
vez de un borde de 12px que hay que descubrir.

Con las flechas hace lo mismo en pasos de 16px, plegado del sidebar incluido:
`WidgetRail` publica `nudge` y `step` en la misma manija que expone
`beginResize`, y el botón las cablea a `ArrowLeft`/`ArrowRight`. Sin eso,
redimensionar quedaría sólo para quien puede arrastrar.

**Mientras el botón está por usarse o se está usando, el panel se marca**, con
las dos cosas que el sistema ya sabe decir:

| | reposo | armado |
|---|---|---|
| sombra del panel | `shadow-surface-2` | `shadow-surface-4` |
| canto del panel | `--shadow-color`, 6% | `--foreground` 25% |

- **la sombra sube dos escalones** y la tarjeta se despega de la página. Van dos
  y no uno porque uno solo, contra una sombra que ya está puesta, no se
  distingue de un cambio de luz;
- **el canto se oscurece**, el mismo recurso con el que el riel del sidebar
  marca su borde del otro lado. El anillo de la escalera es un 6% de negro
  —suficiente para separar dos superficies apoyadas, no para decir «este objeto
  está tomado»—, así que mientras dure se cambia por el 25% del color del texto.
  En oscuro eso es un anillo **más claro**, no más oscuro: lo que sube es el
  contraste, que es lo que se quiere decir.

El anillo va como `ring` y no pisando `--shadow-color`: esa variable la leen las
cuatro capas de la sombra, así que oscurecerla ahí convertiría el halo entero en
una mancha. Como anillo aparte, lo que se oscurece es el canto y nada más.

Lo que **no** se toca es el relleno ni el nivel que el panel publica hacia
adentro: así lo que tiene montado encima —las pestañas, los popups— no se
recalcula entero cada vez que el puntero roza el botón.

Las dos mitades del estado se juntan en `App`: el hover del botón lo sabe él,
que lo renderiza, y el tirón lo avisa `WidgetRail` por `onResizingChange`, que
es quien lo hace.


Tres detalles que costaron y conviene no deshacer:

- **La regla y el techo del riel son dos cuentas separadas.** Sólo la regla
  —el 55% del panel— puede plegar el sidebar; llegar al techo de 560px no es
  quedarse sin lugar, es haber llegado hasta donde el riel llega, y ceder ahí no
  gana nada. Se compara además contra el ancho que el riel de verdad va a tomar
  y no contra lo que la mano pidió: pedir 760 en un riel que termina en 560 es
  haber seguido de largo.
- **El reparto se mide una vez, al apretar, no en cada movimiento.** Medirlo en
  cada movimiento parece más correcto y es justo lo que rompe: plegar el sidebar
  no devuelve sus 256px de golpe sino a lo largo de una transición, así que a
  mitad de camino la medición dice que hay menos lugar del que va a haber y el
  riel se clava en un tope que ya no existe. Al soltar se vuelve a medir y el
  riel se acomoda a lo que de verdad hay.
- **Los handlers se cuelgan al apretar, no desde un efecto.** Con la vuelta por
  el estado, un tirón rápido alcanza a mover y soltar antes de que React vuelva
  a renderizar, y los listeners llegan a una fiesta que ya terminó.
  `setPointerCapture` manda todo al botón hasta que suelte, así soltar afuera
  del panel termina el tirón igual.
- **El ancho pedido se guarda crudo; el recorte se aplica al dibujar.** Si el
  tirón guardara el ancho ya recortado, la intención se perdería: al liberarse
  lugar —se pliega el sidebar, se agranda la ventana— el riel se quedaría en el
  recorte viejo en vez de volver al ancho que le habían pedido.

La sección del showcase ya no muestra el board de verdad —está a la derecha
mientras se la lee—: documenta el componente con descriptores propios, que es
también la forma de no repetir un id.

---

## El otro habitante del riel

`LateralPreview` ocupa **el mismo lugar** que el `WidgetBoard` y es su
contracara. No es una casualidad de layout: son la misma pregunta en dos
momentos.

| | qué pregunta | qué muestra |
|---|---|---|
| `WidgetBoard` | ¿cómo viene todo? | muchas cosas, cada una reducida a un número |
| `LateralPreview` | ¿qué es esto? | una sola cosa, abierta lo suficiente como para decidir |

Se mira el board hasta que algo llama la atención, y entonces el riel pasa a
mostrar eso. Cerrarlo devuelve el board.

### Cómo entran y cómo se van

El riel **abre y cierra su propio ancho**, no aparece encima de lo que hay: es
una región del shell y las regiones se hacen lugar. Animar el ancho es lo que
hace que el panel recupere el suyo en el mismo movimiento en vez de saltar
cuando el riel se desmonta — el panel es `flex-1` y sigue solo al hueco que
queda. Medido, cuadro a cuadro:

| | riel | panel |
|---|---|---|
| saliendo | 348 → 110 → 4 → 0 | 770 → 1014 → 1122 → 1126 |
| entrando | 0 → 175 → 326 → 348 | 1126 → 945 → 792 → 770 |

Al ancho lo acompaña un desplazamiento corto hacia afuera: sin él la columna se
estruja contra el borde y se lee como un error de layout; con él se lee como
algo que se fue para ese lado.

Va envuelto en un `AnimatePresence` con `initial={false}`: sin el primero el
riel se desmonta en el mismo cuadro en que se cierra el board y la salida no
llega a correr; sin el segundo haría una entrada en cada carga de la página, y
la entrada es para cuando alguien lo abre, no para cuando llega.

**El ancho espera a que se vaya lo que estaba.** El cambio entre el board y un
preview mueve dos cosas —el contenido y el ancho—, y sin esa espera el riel se
ensancha mientras el board todavía está puesto: el board alcanza a reacomodar
sus casilleros a dos columnas para desaparecer un cuadro después, un parpadeo de
layout por algo que ya se estaba yendo. Con el retraso puesto en lo que dura la
salida, el board se mantiene en una columna durante todo el cruce. El lugar se
hace para lo que llega.

Lo único que no espera nada es el arrastre: ahí el ancho va sin transición, o
seguiría al puntero un cuadro atrás.

### Se reemplazan, no se apilan

Tener los dos a la vez obligaría a elegir a cuál mirar, que es justo lo que el
riel existe para no pedir. `WidgetRail` recibe el preview por su prop `preview`
y muestra el board cuando no hay ninguno — **el riel es el lugar y el board es
su contenido por defecto**.

El cambio se cruza en vez de saltar, con `spring.moderate` —el de los popups y
las pestañas, no el de los diálogos— y en `mode="wait"`: en una columna angosta,
dos cuerpos superpuestos son ilegibles.

### Más ancho, y más pegado a los bordes

Un preview no mide lo mismo que el board. El board vive de números cortos en
casilleros; un preview vive de renglones —mensajes, filas de datos— y en la
columna del board se parten cada tres palabras. Así que mientras hay un preview
el riel **se ensancha 140px** y el preview **se apoya contra sus bordes** en vez
de llevar canto propio: queda lo más cerca posible del panel de un lado y del
borde de la pantalla del otro. Medido, sobre el board:

| | ancho del riel | ancho del contenido | al panel | al borde |
|---|---|---|---|---|
| board | 348 | 316 | 24 | 34 |
| preview | **500** | **500** | **8** | **18** |

Es lo contrario de lo que hace el board, y por una razón: el board separa sus
casilleros del borde porque son varios y necesitan un marco común; el preview es
uno solo y el marco es él. Arriba y abajo sí respira, que es donde no compite
con nada.

Los 140 se suman **al dibujar** y nunca al ancho guardado: lo que la persona
arrastró es el ancho del board, y sumárselo al estado dejaría el riel ensanchado
para siempre. Al cerrar el preview vuelve solo a donde estaba.

**Y si no hay lugar, el sidebar cede** — la misma maniobra que hace el tirón
cuando toca el límite, por la misma razón: entre navegar y leer, primero leer.
Sin eso, en una pantalla donde el panel ya está en su 55% el preview se abriría
exactamente del ancho del board y el ensanche no se vería nunca. No hay vuelta
automática: el sidebar se recupera cuando la persona lo abre.

### El marco es uno

Un componente por cada tipo de cosa —conversación, perfil, estadísticas— serían
tres marcos iguales con tres cuerpos distintos, y **el marco es lo único que no
cambia**: cabecera con el nombre y el botón de cerrar, cuerpo que scrollea, pie
con «abrir esto entero». Así que `LateralPreview` no sabe qué está mostrando, y
el cuerpo se arma con las piezas que vienen con él —`PreviewGroup`,
`PreviewRow`, `PreviewStat`, `PreviewMessage`— o con lo que sea.

Tres decisiones más:

- **Es un solo plano, no una lista de tarjetas.** El board es una grilla porque
  muestra cosas que no se tocan entre sí; acá todo lo que se ve es del mismo
  objeto, y partirlo sugeriría lo contrario. Lo que separa las zonas adentro es
  el aire, como en la `PeekCard`.
- **La cabecera y el pie no scrollean.** El nombre de lo que se está mirando y
  el botón de cerrar tienen que estar siempre, sobre todo en un cuerpo largo
  como una conversación. El único que cede es el cuerpo.
- **Llena el alto que le den.** En el riel es la columna entera; un preview que
  se encogiera a su contenido dejaría media columna vacía debajo, y el riel no
  es una lista de tarjetas sino un lugar que se ocupa entero.

### Quién lo abre

[`preview-context`](src/components/preview-context.tsx), que es el mismo
recurso que `workspace-context` y por el mismo motivo: el riel se dibuja en un
lado del shell y lo que pide un preview está en cualquier otro —una fila de una
lista, un nombre en una tabla, un mosaico del board—. `usePreview().show()`
desde donde haga falta.

`LateralPreview` no se entera de nada de eso: recibe su contenido por props y
sirve igual suelto, sin provider. Es la misma división que entre
`WorkspacePanel` y su contexto.

### `PreviewMessage` no es `ChatMessage`

El del registry está hecho para el ancho de lectura de un chat, con su fila de
acciones al hover y sus adjuntos. Acá es un vistazo en una columna angosta: lo
que hace falta es quién dijo qué, y que el propio se distinga del ajeno.

---

## El calendario y sus tres caras

No es una grilla con modo rango: **la respuesta es el sujeto** y la grilla es una
de las formas de decirla. Las otras dos son los campos de arriba —¿cuál estoy
completando?— y los atajos de abajo, que para la mayoría de la gente son la
respuesta más rápida de las tres.

| | qué contesta |
|---|---|
| los campos | de cuándo a cuándo —o qué día y a qué hora—, y cuál está abierto |
| la grilla | dónde cae eso en el mes |
| los atajos | un finde, una semana, mañana — sin contar nada |

Hay tres exports y **una sola implementación**:

| export | la respuesta | qué cambia |
|---|---|---|
| `RangeCalendar` | una estadía | dos puntas, la banda entre ellas, un contador de noches |
| `DatePicker` | un día | una punta, sin banda, y el contador dice qué *es* ese día |
| `DateTimePicker` | un momento | el mismo día, y el segundo campo se lleva el plano a las horas |

Son uno y no tres porque partirlos obligaría a mantener tres veces la misma
anatomía —las marcas que viajan, el cruce de mes, el teclado, los dos planos,
las escaleras de forma y de tamaño— para terminar eligiendo por lo más de
afuera: cuántas puntas tiene la respuesta. Eso acá es una prop.

### La banda es por fila, no por día

Lo obvio es pintarle un fondo a cada celda seleccionada y redondear las dos
puntas. Eso **no se puede animar**: un rango que crece un día es un elemento que
aparece, no una forma que se estira. Acá cada semana pinta una sola píldora
posicionada por porcentaje —`left` y `width` sobre siete columnas—, así estirar
el rango la hace *crecer*, y crece desde el check-in porque el estado de entrada
ancla ahí.

Cuando el rango pasa a la semana siguiente son dos píldoras, una por fila, cada
una con sus dos puntas redondeadas. No hay una banda continua que cruce el
salto de línea: en un calendario ese salto es real, y dibujarlo como si no lo
fuera obliga a inventar esquinas que no existen.

### Las puntas viajan

El círculo lleno lleva `layoutId`, así que mover el check-in lo **desliza** por
el mes en vez de apagar un círculo y prender otro. El círculo neutro debajo del
puntero es el mismo truco con un escalón más rápido: persigue al cursor, y eso
es lo que hace que pasar el mouse por la grilla se sienta como arrastrar un
objeto y no como prender celdas. Las horas usan esas dos mismas marcas, y por
eso elegir una hora se siente igual que elegir un día.

Los dos `layoutId` llevan adentro el mes y un `useId`. El mes, porque viajar
dentro de un mes es la gracia y viajar entre dos sería un círculo volando por
encima de una grilla que se va para el otro lado. El `useId`, porque dos
calendarios en la misma pantalla serían el mismo objeto en dos lugares — el
mismo cuidado que en `widget-drag`.

### Pasar el mouse *es* el preview

Mientras el campo abierto es el check-out, la banda llega hasta el día que está
debajo del puntero y el contador dice cuántas noches serían. No hay nada
confirmado —eso lo hace el clic—, pero la respuesta a «¿cuánto duraría esto?»
ya está en pantalla, que es toda la pregunta. Con el teclado pasa lo mismo: el
foco mueve el preview, así que las flechas cuentan igual que el puntero. Las
caras de un día no previsualizan nada: no hay una segunda punta a la que
llegar.

### El alto del plano se mide

Un mes de cinco filas al lado de uno de seis es un salto de 40px, y la lista de
horas es más alta que los dos. El contenedor anima hacia el alto **medido** de
lo que entra —`useMeasuredHeight`, el mismo cruce que en `PeekCard`—, así la
tarjeta se acomoda con el deslizamiento y no después. Se nota mejor que en
ningún lado con cuatro horarios sueltos: el plano se achica hasta ellos.

### Los campos dicen para qué es el plano

En `DateTimePicker` el segundo campo no abre un popup propio: **convierte el
plano en las tres columnas de la hora**, y elegir el día avanza hasta ahí igual
que elegir el check-in avanza al check-out. Un solo estado —qué campo está
abierto— maneja el subrayado y el plano, así que los dos no pueden
contradecirse.

### Tres columnas, y el reloj entero

La hora se elige como en una rueda: una columna de horas, una de minutos y,
donde el reloj tiene dos mitades, una de AM/PM. Están **el reloj entero** —de
00 a 12 y de 00 a 59— y lo que no se puede elegir va apagado, no sacado: es el
mismo trato que el mes hace con `minDate`, que muestra todos los días y apaga
los que ya pasaron. Una columna que listara sólo lo disponible cambiaría de
largo cada vez que se mueve otra, y el lugar al que ibas a hacer clic estaría
en otra parte.

Arriba de las dos columnas de números va un rótulo —`HORA`, `MIN`, en la misma
caja que los rótulos de los campos— porque en reposo las horas y los minutos
son dos columnas idénticas de dos dígitos. La mitad del día dice sola lo que es
y no lleva ninguno. Los rótulos son props (`hourLabel`, `minuteLabel`), como
todo el texto visible del componente.

**El 00 y el 12 no son la misma fila dos veces.** En un reloj de doce horas la
medianoche es `00` y el mediodía es `12`, así que `12` está apagado mientras se
ve AM y `00` mientras se ve PM. Una fila por hora del día, y ningún par de
filas que signifique el mismo momento — que es justo lo que un selector de
doce horas suele hacer mal.

Cada clic confirma **un horario entero**: cambiar la hora se lleva los minutos
donde estaban, y si ese horario exacto no se ofrece toma el más cercano que esa
hora sí tenga. Por eso el campo de arriba se completa mientras se elige y no
hay un tercer estado que mantener sincronizado.

Qué horarios existen sigue saliendo de `timeStep` —cada minuto, por defecto— y
`timeRange`, o de `times` suelto en minutos desde medianoche. Que el reloj
tenga doce horas y una columna de mitad del día, o veinticuatro y ninguna, lo
contesta el locale —`Intl` ya lo sabe— y no una prop.

### Un momento es un `Date`, no una fecha más una hora

`DateTimePicker` devuelve un solo `Date` con las dos mitades adentro. El costo
es una ambigüedad —un valor exactamente a medianoche se lee como un día al que
todavía no le eligieron la hora— y vale la pena: la alternativa son dos props y
un llamador que tiene que rearmar un momento que nunca estuvo partido. La hora,
además, sobrevive a cambiar de día: se contestó aparte y mover el día no es
motivo para volver a preguntarla.

### Dos planos, y una sola variable de color

El mes se apoya en su propio plano levantado y los campos, el contador y los
atajos quedan en la tarjeta de abajo: la grilla es la parte a la que se le
apunta, el resto es lo que produjo. Los dos escalones los da `Elevated`, que
además publica el nivel hacia adentro — el calendario funciona igual metido en
un diálogo.

El acento —la banda, las puntas, la hora elegida y el subrayado del campo— sale
de `--calendar-accent`, con `#3b82f6` de fábrica, que es el azul que `Badge` ya
pinta. Una variable y no cuatro constantes: cambiar el acento tiene que mover
todas las marcas juntas o dejan de leerse como la misma cosa. `--calendar-band`
pisa sólo el relleno de la banda, para un tema donde el 12% del acento no
alcanza.

### Las flechas del mes

El diseño del que salió esto no las tenía. Están igual: un mes al que sólo se
llega escribiendo es un mes al que no se llega. Son lo más callado del plano
—`ghost` en el escalón compacto— y viven al final de la línea del mes.

---

## Blocks propios

Un block no es un componente: no resuelve una pieza sino una pantalla entera,
armada con las piezas del registry y de `components/`. Viven en el mismo
`src/components/` y tienen su propio grupo en el sidebar, *Blocks Propios*.

| block | qué es |
|---|---|
| `LoginBlock` | la pantalla de acceso completa: plano de marca a la izquierda, formulario y proveedores a la derecha |

### Mide su contenedor, no la ventana

El reparto en dos columnas sale de una container query (`@container` en la raíz
y `@2xl:` adentro), no de un breakpoint de viewport. Por eso el mismo código
sirve para el marco de 720px del showcase y para la pantalla completa, y por
eso la página del showcase puede mostrar la variante angosta al lado de la
ancha sin dos juegos de clases.

**El `@container` y las clases `@2xl:` no pueden ir en el mismo nodo.** Una
container query mide el contenedor para sus *descendientes*, nunca para sí
mismo: con `@2xl:flex-row` sobre el propio `@container` la regla no matchea
nunca y las dos mitades quedan apiladas, desbordando su marco en silencio. El
reparto va en un div hijo.

### Un tema adentro de otro

El block se pinta claro u oscuro por su cuenta, sin tocar el `<html>`: la clase
va en su raíz y los tokens cascadean hacia adentro. Para que eso funcione en
las dos direcciones, `index.css` declara los valores claros en `:root, .light`
en vez de sólo en `:root` — sin ese `.light` no habría forma de volver a claro
adentro de una app en oscuro.

La contrapartida: **adentro del block no se puede usar ni una utilidad
`dark:`**. Esa variante está definida como `&:is(.dark *)`, así que un block
claro colgando de un `<html class="dark">` seguiría matcheándola y se pintaría
mal. Sale barato porque el sistema es de variables — hay 11 utilidades `dark:`
en todo el registry y ninguna en Button ni en los campos.

El plano de marca es una superficie oscura en los dos temas — la tapa del libro
— pero no la misma. En el tema claro va una clave levantada: la base arranca
varios pasos por encima del casi-negro (luminancia 3,4× la de la clave oscura)
y los focos van más brillantes, así los detalles se leen más claros y el plano
no se hace un agujero negro al lado de una app clara.

La familia de color no cambia entre claves — ciruela, granate y violeta, en las
mismas posiciones. Cambian la altura de la base y el brillo de los focos, y eso
es todo lo que vive en `PANEL_ART`. Como las dos claves son oscuras, la tinta
es una sola copia en `PANEL_INK` y no se puede desincronizar. La clave se elige
con el tema ya resuelto, no con utilidades `dark:`.

El texto secundario sale de un blanco con la temperatura del degradado y no de
un gris neutro, que sobre una superficie con color se ve sucio.

### Meterle un ícono a un `Button`

Va por la prop `leadingIcon`, nunca como hijo. `Button` mete todos sus hijos en
un mismo span de etiqueta, y el preflight de Tailwind pone `svg { display:
block }`: un `<svg>` suelto ahí adentro se apila **arriba** del texto en vez de
quedar al lado. La prop además le da el tamaño del ícono según la escala y
ajusta el padding del lado correcto.

`leadingIcon` espera un `IconComponent` — la firma `{ size?, strokeWidth?,
className? }` de `lib/icon-context`. Como lucide sacó las marcas comerciales en
la v1, el logotipo de GitHub va dibujado en el propio block respetando esa
firma.

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
pie del sidebar de la demo. A diferencia del sitio de docs, este proyecto no
sigue al sistema operativo — si lo querés, el cambio va en el `useState` del toggle
leyendo `matchMedia`, no en el CSS.

Los valores claros están declarados en `:root, .light` y no sólo en `:root`.
Ese `.light` es lo que permite anidar un tema — marcar un subárbol y que vuelva
a claro aunque el `<html>` esté en oscuro — sin duplicar los tokens ni
arriesgar que las dos copias se desincronicen. Lo usa `LoginBlock`; ver
[Blocks propios](#blocks-propios).

---

## Llevar esto a otro proyecto

Acá no hay ningún paquete de npm que instalar: el `shadcn add` copió el código
fuente al repo, y los componentes propios nacieron adentro. Llevarlos a otra
app es copiar archivos — lo único que se elige es quién resuelve el grafo de
dependencias, vos a mano o el CLI.

Por eso este repo **también es un registry**. [`registry.json`](registry.json)
publica lo propio como items de shadcn, cada uno declarando de qué cuelga.

```bash
npm run build:registry
```

`shadcn build` lee `registry.json` y escribe un JSON por item en `public/r/`.
Como es `public/`, Vite ya lo sirve en desarrollo —`/r/peek-card.json`— y lo
copia a `dist/` en el build: el mismo deploy que muestra el showcase publica el
registry. Los JSON generados están en el `.gitignore`, porque salen de
`registry.json` y de los `.tsx` — no son fuente.

Está publicado en **[reynsu/wabi-registry](https://github.com/reynsu/wabi-registry)**,
que sirve por GitHub Pages y **tiene sólo la salida**. El código de `@fluid`
copiado en `src/components/ui/` no viaja ahí: los items lo declaran como
dependencia por URL, no lo inlinean. Después de tocar un componente propio:

```bash
npm run build:registry && cp public/r/*.json ../wabi-registry/r/
```

y un commit en ese repo.

### Los items

| item | tipo | qué es |
|---|---|---|
| `tokens` | `registry:theme` | los tokens y las utilidades que ningún item de `@fluid` instala — ver abajo |
| `use-measured-height` | `registry:hook` | el hook propio, el que mide el alto que `PeekCard` anima |
| `animated-empty`, `travel-tooltip`, `inset-dialog`, `mobile-action-confirmation`, `peek-card`, `calendar`, `widget`, `widget-board`, `widget-rail`, `lateral-preview`, `preview-context`, `filter-menu`, `workspace-panel`, `workspace-context`, `window-controls` | `registry:component` | van a `components/`, al lado de `ui/` y no adentro, igual que acá |
| `login-block` | `registry:block` | el block |

Las dependencias de `@fluid` van por **URL absoluta**
(`https://www.fluidfunctionalism.com/r/base/button.json`), que es lo que el
registry de fluid hace con las suyas: así el que instala no necesita tener
`@fluid` dado de alta en su `components.json`. Las internas van como
`@wabi/<item>`, sin host adentro, para que no haya una URL que corregir cada
vez que cambie dónde está publicado — `mobile-action-confirmation` se lleva
`inset-dialog`, `window-controls` se lleva `travel-tooltip`,
`workspace-context` se lleva el panel, y `widget` se lleva la `PeekCard` y el
`workspace-context` porque sus dos escalones de arriba son esos.

El prefijo `base/` está puesto item por item, con la regla de [Agregar
componentes](#agregar-componentes). Lo único que entra sin él es `card`, que no
tiene gemelo Base UI.

### Cómo se publica

`registry.json` es la fuente; lo que se instala son los JSON que `shadcn build`
escribe en `public/r/`. Esa carpeta está en el `.gitignore` —es salida, se
regenera— y **no se sirve desde este repo**: la URL de la que cuelga todo es el
`homepage` del `registry.json`, que es un repo aparte con Pages prendido y un
`.nojekyll` adentro, sirviendo esos archivos y nada más.

```bash
npm run publish:registry
```

Construye y empuja la salida al repo que dice `homepage`. Tres cosas que hace y
conviene saber:

  · **el destino sale de `homepage`**, no está escrito dos veces: si el registry
    se muda, el script lo sigue en vez de publicar donde ya no es;
  · **espeja, no mezcla**: un archivo que dejó de estar en el build se borra
    allá. `shadcn build` no limpia lo que quedó de un item renombrado, y un
    `range-calendar.json` viejo en el sitio instala un componente que ya no
    existe;
  · **no toca nada que no sea `r/`**: el `.nojekyll` —que es lo que hace que
    Pages sirva una carpeta que si no trataría como entrada de Jekyll— y el
    README de allá son asunto suyo.

Pages tarda un minuto en reconstruir; hasta que termina, la URL sigue
devolviendo lo anterior.

### Del otro lado

En el `components.json` del proyecto que consume:

```json
"registries": { "@wabi": "https://reynsu.github.io/wabi-registry/r/{name}.json" }
```

```bash
npx shadcn@latest add @wabi/filter-menu
```

Eso baja el componente propio, los items de `@fluid` de los que cuelga
—`base/button`, `base/scroll-area`, los libs, los hooks—, el `tokens`, y
reescribe el `index.css` del destino.

Los imports `@/…` **de los items propios** se reescriben a los alias del
proyecto que instala: probado con `components` en `~/piezas`, `lib` en
`~/utilidades` y `hooks` en `~/ganchos`, los tres archivos llegaron a su lugar
con los imports corregidos.

**Los de `@fluid` no.** Cada archivo suyo declara un `target` fijo
—`components/ui/button.tsx`— que shadcn resuelve desde la raíz del proyecto, o
desde `src/` si existe, sin mirar el alias `ui`. Con un layout distinto los
`.tsx` caen en `components/ui/` de la raíz mientras el import reescrito apunta
al alias, y no resuelve. Eso es del registry de fluid y no de este, así que el
conviene que el proyecto destino tenga el layout estándar —`src/`, alias `@/*`, y
`ui` en `@/components/ui`—, que es el que el CLI de shadcn arma por defecto.

Cada item lleva su `docs`, que el CLI imprime al terminar: el `next/link` de
`card.tsx`, el `SidebarProvider` que `WorkspacePanel` y `WindowControls` dan
por presente, y el `:root, .light` que `LoginBlock` necesita para pintarse en
su propio tema.

### Por qué hay un item de tokens

Copiar los `.tsx` no alcanza, por el mismo motivo de [Estilos vendorizados en
`index.css`](#estilos-vendorizados-en-indexcss): `bg-hover`, `bg-active`,
`bg-destructive-light`, `scroll-fade`, `scroll-divider` y `scrollbar-hide` no
las instala **ningún** item del registry de fluid. En un proyecto nuevo el
resalte por proximidad pintaría transparente y el scroll no tendría ni el
difuminado ni la hairline.

`@wabi/tokens` los lleva: los `cssVars`, con el mapeo a `@theme` incluido
—sin él Tailwind no genera esas clases—, y el CSS vendorizado, `@property` y
los dos `@supports` adentro. Además depende de `@fluid/surfaces`, el tema de
los `--surface-1…8` y las sombras, que tampoco viene arrastrado por los
componentes aunque medio sistema lo lea.

Queda afuera lo que es decisión de la app y no de los componentes: el fondo
sobre `<html>`, los scrollbars nativos y el damero del ColorPicker.

### Lo que el registry no puede llevar

Tres cosas siguen siendo a mano del otro lado:

- **los providers del root** — los [cuatro sistemas](#los-cuatro-sistemas) se
  cablean una vez en [`src/main.tsx`](src/main.tsx). Un componente sin
  `SurfaceProvider` arriba no sabe en qué escalón está;
- **el tema** — la paleta de `:root, .light` y `.dark`. `tokens` suma los suyos
  al archivo que ya haya; no instala un tema;
- **el parche de `next/link`** —
  [`scripts/patch-fluid.mjs`](scripts/patch-fluid.mjs) vive acá; del otro lado
  el import se cambia por un ancla a mano.
