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
                    + inset-metrics (el aire del embutido, propio)
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

Por dentro es un
[`InsetDialog`](#un-diálogo-con-el-contenido-embutido) puesto en un ancla: el
mismo par bandeja/tarjeta, el mismo aire y la misma tipografía de título, pero
abierto al lado de algo en vez de encima de todo.

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

### El contenido va embutido

El marco es lo estable: el título con su acción y las pestañas arriba, el pie
abajo. Lo que cambia —el cuerpo de la pestaña elegida— se levanta en su propia
tarjeta adentro de la bandeja, igual que el contenido de un `InsetDialog`. El
reparto no es decorativo: al cambiar de pestaña se mueve una sola cosa y todo
lo que la rodea se queda quieto, que es exactamente lo que hace la hoja del
teléfono con sus pasos.

Las pestañas van en la zona del título y no adentro de la tarjeta porque dicen
lo mismo que él: qué es esto y qué parte se está mirando. Lo que contestan está
en la tarjeta.

El aire sale de `useInsetMetrics`, el mismo que reparte el diálogo: `pad` entre
la bandeja y la tarjeta, `pad + rail` en cabecera y pie para que el título no
arranque pegado al canto. Vive en `lib/inset-metrics.ts` junto con la sombra de
la tarjeta, y no adentro del diálogo, porque no es de él: dos copias del mismo
número se despegan a la primera que alguien afine una. El
relleno de adentro de la tarjeta sí es propio, por el mismo motivo que en la
hoja del teléfono: el inset de `InsetDialogGroup`, sumado al de la bandeja, le
come el renglón a una columna de 360. El ancho también sale de la escalera —
360, y 320 en una región compacta: el ancho, no el relleno.

El riel es el `Tabs` del registry —el segmentado con fondo, no el `TabsSubtle`
sin él—, estirado al ancho de la bandeja: las pestañas se reparten el sobrante
pero ninguna baja de lo que mide su texto, así que con etiquetas largas el riel
scrollea de costado en vez de que las etiquetas se pisen. Ahí hay una excepción que vale
señalar: **el riel vuelve a publicar el escalón de la bandeja**, que es sobre lo
que está apoyado. El segmento activo se pinta tres escalones arriba de lo que
lee, así que con el escalón de la tarjeta terminaría en el 6 y en oscuro
aterrizaría en el mismo valor que el riel — la pestaña elegida desaparece. Es la
única parte del marco que necesita el número de abajo: lo que se pinta contra la
bandeja lee la bandeja, y lo que se abre encima —un menú, otro popover— sigue
leyendo la tarjeta.

**La bandeja baja; la tarjeta se queda.** Lo que se publica hacia adentro es el
escalón que publica cualquier popup —sustrato + 2—, así un menú abierto adentro
de la tarjeta sigue subiendo desde donde subía, y el que se corre para abajo es
el marco, que cae justo en el sustrato. Es el mismo movimiento que hace el
diálogo con sus cuatro escalones, y por el mismo motivo: en claro la escalera
está aplanada en blanco de 3 para arriba, así que el contraste hay que ir a
buscarlo abajo. La sombra de la bandeja queda fija en la de un popup y la de la
tarjeta en la de un embutido —el anillo y una línea—, que es lo que la despega
en claro, donde los dos planos son casi el mismo blanco.

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
tarjeta le agrega los dos planos, el aire del diálogo y el spring de entrada,
que crece desde el borde pegado al trigger: `moderate`, el escalón de los
popups y las pestañas, con la salida un escalón más rápida.

El techo lo pone `--available-height`, lo que Base UI midió entre el ancla y el
borde de la pantalla: la tarjeta nunca se sale del viewport, y cuando el cuerpo
no entra el que cede es él —scrollea por dentro— mientras el título, el riel y
el pie se quedan donde están. Es el mismo reparto que en el diálogo: la bandeja
no se mueve.

El índice de la pestaña vive afuera del popup: el popup se desmonta al cerrar,
así que la tarjeta reabre donde la dejaron. Se puede manejar desde afuera con
`tab` / `onTabChange`, igual que `open` / `onOpenChange`; se recorta contra la
lista, y la dirección del cruce se deriva del cambio de índice —no de quién lo
disparó— para que un cambio hecho desde afuera entre por el lado correcto.

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
header de la demo. A diferencia del sitio de docs, este proyecto no sigue al
sistema operativo — si lo querés, el cambio va en el `useState` del toggle
leyendo `matchMedia`, no en el CSS.

Los valores claros están declarados en `:root, .light` y no sólo en `:root`.
Ese `.light` es lo que permite anidar un tema — marcar un subárbol y que vuelva
a claro aunque el `<html>` esté en oscuro — sin duplicar los tokens ni
arriesgar que las dos copias se desincronicen. Lo usa `LoginBlock`; ver
[Blocks propios](#blocks-propios).
