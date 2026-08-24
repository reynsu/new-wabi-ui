"use client";

/**
 * LoginBlock — la pantalla de acceso completa de un producto.
 *
 * Un block, no un componente: no resuelve una pieza sino una pantalla entera,
 * armada con las piezas del sistema. Dos mitades que hacen trabajos distintos.
 * A la izquierda un plano de marca — degradado, logo y promesa del producto —
 * que no pide nada; a la derecha la única columna donde hay algo que hacer.
 * Esa asimetría es la que dirige la vista: todo lo accionable vive junto.
 *
 * Tres decisiones que conviene no deshacer sin mirar el resto:
 *
 * 1. **Mide su contenedor, no la ventana.** El layout se parte en dos con
 *    container queries (`@container` + `@2xl:`), así que el mismo block sirve a
 *    pantalla completa y adentro del marco angosto del showcase. Con media
 *    queries habría que elegir una de las dos.
 *
 * 2. **Se pinta en su propio tema.** La clase `.light` / `.dark` va en la raíz
 *    del block, no en el <html>, y los tokens cascadean hacia adentro. Por eso
 *    adentro no se usa ni una utilidad `dark:`: esa variante es
 *    `&:is(.dark *)`, o sea que un block claro adentro de una app oscura
 *    seguiría matcheando y se pintaría mal.
 *
 * 3. **El error empuja, no tapa.** Aparece adentro del marco, encima de la
 *    tarjeta, y le corre el contenido hacia abajo. Un toast se iría solo y un
 *    modal taparía los campos que hay que corregir.
 */

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { IconComponentProps } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";

/** El tema que el block se aplica a sí mismo. `system` sigue al sistema
 *  operativo y lo sigue mirando mientras esté montado. */
type LoginBlockTheme = "light" | "dark" | "system";

interface LoginBlockProps {
  /** La marca del plano izquierdo. Va como nodo y no como src para poder
   *  entregar un SVG que herede el color del tema. */
  logo?: ReactNode;
  /** Titular del plano. Corto: entra en dos renglones al ancho del panel. */
  title: string;
  /** Qué hace el producto, en una o dos oraciones. */
  description: string;
  /** Mensaje de error. `null` cierra el aviso; el texto tiene que nombrar el
   *  problema, no el código de estado. */
  error?: string | null;
  /** Deja los controles quietos mientras el submit está en vuelo. */
  pending?: boolean;
  /** Tema controlado. Sin esta prop el block maneja el suyo. */
  theme?: LoginBlockTheme;
  defaultTheme?: LoginBlockTheme;
  onThemeChange?: (theme: LoginBlockTheme) => void;
  onSubmit?: (credentials: { email: string; password: string }) => void;
  onGitHub?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  className?: string;
}

/* El plano de marca. Es una superficie oscura en los dos temas — la tapa del
   libro — pero no la misma: en el tema claro va una clave levantada, con la
   base varios pasos por encima del casi-negro y los focos más brillantes, así
   los detalles se leen más claros y el plano no compite con una app clara
   haciéndose un agujero negro al lado.

   La familia de color no cambia entre claves: ciruela, granate y violeta, en
   las mismas posiciones. Cambian la altura de la base y el brillo de los focos.

   La clave se elige acá, con el tema ya resuelto, y no con utilidades `dark:`:
   esa variante es `&:is(.dark *)` y un block claro colgando de un <html>
   oscuro la seguiría matcheando. */
const PANEL_ART = {
  dark: [
    "radial-gradient(120% 78% at 28% 16%, rgba(186, 128, 152, 0.44) 0%, rgba(186, 128, 152, 0) 62%)",
    "radial-gradient(92% 62% at 74% 6%, rgba(154, 84, 92, 0.40) 0%, rgba(154, 84, 92, 0) 58%)",
    "radial-gradient(104% 72% at 10% 54%, rgba(98, 76, 132, 0.30) 0%, rgba(98, 76, 132, 0) 60%)",
    "linear-gradient(180deg, #1d1a1e 0%, #131215 46%, #0c0b0d 100%)",
  ].join(", "),
  light: [
    "radial-gradient(120% 78% at 28% 16%, rgba(228, 178, 200, 0.42) 0%, rgba(228, 178, 200, 0) 62%)",
    "radial-gradient(92% 62% at 74% 6%, rgba(206, 132, 140, 0.34) 0%, rgba(206, 132, 140, 0) 58%)",
    "radial-gradient(104% 72% at 10% 54%, rgba(150, 126, 190, 0.26) 0%, rgba(150, 126, 190, 0) 60%)",
    "linear-gradient(180deg, #3d3038 0%, #2c242b 46%, #211a20 100%)",
  ].join(", "),
} as const;

/* La tinta del plano no depende del tema de la app: las dos claves son
   oscuras, así que lo de encima siempre va claro. Una sola copia, para que no
   se desincronicen. */
const PANEL_INK = {
  edge: "ring-white/10",
  ink: "text-white",
  // El secundario sale del propio plano — un blanco con la temperatura del
  // degradado — y no de un gris neutro, que sobre color se ve sucio.
  body: "text-[rgb(238_226_232_/_0.72)]",
  knobOn: "text-white",
  knobOff: "text-white/45 hover:text-white/80",
  knobBg: "bg-white/12 ring-white/15",
  focus: "focus-visible:ring-white/70",
} as const;

/* El resplandor del error: nace en el canto de arriba del marco y se apaga
   antes de llegar a la tarjeta, así el rojo tiñe el aviso y no el formulario. */
const ERROR_GLOW =
  "radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, var(--destructive) 34%, transparent) 0%, transparent 72%)";

/** GitHub no está en lucide desde la v1 — sacaron las marcas comerciales — así
 *  que el logotipo va dibujado acá. Respeta la firma `IconComponentProps` para
 *  poder viajar por la prop `leadingIcon` del Button, que es la única forma
 *  correcta de meterle un ícono: como hijo cae adentro del span de la etiqueta,
 *  y ahí el preflight de Tailwind (`svg { display: block }`) lo apila arriba
 *  del texto en vez de dejarlo al lado. */
function GitHubMark({ size = 16, className }: IconComponentProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      fill="currentColor"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/** El ícono del aviso. Un círculo lleno con la cruz calada: el hueco toma el
 *  color del marco, así que se lee igual en claro y en oscuro. */
function ErrorMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM7.3 6.24a.75.75 0 0 0-1.06 1.06L8.94 10l-2.7 2.7a.75.75 0 1 0 1.06 1.06l2.7-2.7 2.7 2.7a.75.75 0 1 0 1.06-1.06L11.06 10l2.7-2.7a.75.75 0 0 0-1.06-1.06l-2.7 2.7-2.7-2.7Z"
      />
    </svg>
  );
}

/* Un campo del formulario. Los del registry (InputField) esconden el borde
   hasta que el cursor se acerca, que es lo correcto adentro de una app llena
   de controles; acá el formulario es lo único que hay en la pantalla y los
   campos tienen que verse desde el primer vistazo. Por eso van dibujados. */
function Field({
  id,
  label,
  action,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>
      <input
        id={id}
        className={cn(
          "h-9 w-full rounded-[10px] bg-surface-2 px-3 text-[13px] text-foreground",
          "border border-border outline-none transition-colors duration-100",
          "placeholder:text-muted-foreground",
          "hover:border-muted-foreground/70",
          // Borde por `border` y foco por `ring`: cada uno en su propiedad, así
          // el anillo se suma al borde en vez de reemplazarlo. Es como marcan
          // el foco los controles del registry (ver `buttonVariants`).
          "focus:ring-2 focus:ring-[color:var(--focus-ring)]",
          "disabled:opacity-50",
        )}
        {...props}
      />
    </div>
  );
}

const THEME_OPTIONS = [
  { value: "light", icon: Sun, label: "Tema claro" },
  { value: "dark", icon: Moon, label: "Tema oscuro" },
  { value: "system", icon: Monitor, label: "Seguir al sistema" },
] as const;

/** Sigue a `prefers-color-scheme` y no deja de mirarlo: si el sistema cambia
 *  con el block abierto, el modo `system` tiene que acompañar. */
function useSystemScheme(): "light" | "dark" {
  const [scheme, setScheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) =>
      setScheme(e.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return scheme;
}

function LoginBlock({
  logo,
  title,
  description,
  error = null,
  pending = false,
  theme: themeProp,
  defaultTheme = "system",
  onThemeChange,
  onSubmit,
  onGitHub,
  onForgotPassword,
  onSignUp,
  className,
}: LoginBlockProps) {
  const [uncontrolledTheme, setUncontrolledTheme] =
    useState<LoginBlockTheme>(defaultTheme);
  const theme = themeProp ?? uncontrolledTheme;
  const systemScheme = useSystemScheme();
  const resolved = theme === "system" ? systemScheme : theme;
  const panelArt = PANEL_ART[resolved];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // useId da ids únicos aunque haya dos blocks en la misma página — pasa en el
  // showcase, que muestra el estado normal y el de error uno al lado del otro.
  const fieldId = useId();

  const selectTheme = (next: LoginBlockTheme) => {
    if (themeProp === undefined) setUncontrolledTheme(next);
    onThemeChange?.(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  return (
    <div
      // La clase del tema va acá y no en el <html>: los tokens de color están
      // declarados en `:root, .light` y en `.dark`, así que cascadean a todo
      // lo que cuelgue de este nodo y a nada más.
      className={cn(
        resolved,
        "@container relative isolate h-full bg-surface-1 text-foreground",
        className,
      )}
    >
      {/* El reparto en dos columnas va en un nodo aparte del `@container`, y no
          es un detalle de escritura: una container query mide el contenedor
          para sus *descendientes*, nunca para sí mismo. Con `@2xl:flex-row` en
          el mismo nodo la regla no matchea nunca y las dos mitades quedan
          apiladas. */}
      <div className="flex h-full min-h-full flex-col @2xl:flex-row">
        {/* Plano de marca. Se esconde cuando el contenedor es angosto: en una
          columna de teléfono compite con el formulario en vez de acompañarlo. */}
        {/* No lleva `aria-hidden`: el plano no es decoración. Tiene el titular,
            la descripción y los tres botones de tema, y marcar como oculto un
            contenedor con controles enfocables deja que el tabulador aterrice
            en algo que el lector de pantalla no anuncia. */}
        <aside
          className="relative m-2 hidden shrink-0 overflow-hidden rounded-2xl @2xl:flex @2xl:w-[38%] @2xl:flex-col @2xl:justify-between @2xl:p-7"
          style={{ background: panelArt }}
        >
          {/* Canto interior: separa el plano del fondo cuando los dos tienen la
            misma clave — dos oscuros o dos claros — que es donde el degradado
            solo no alcanza. */}
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset",
              PANEL_INK.edge,
            )}
          />

          <div className={PANEL_INK.ink}>{logo}</div>

          <div className="flex items-end justify-between gap-6">
            <div className="flex max-w-[26ch] flex-col gap-3">
              <h2
                className={cn(
                  "text-balance font-medium leading-[1.08] tracking-[-0.03em]",
                  PANEL_INK.ink,
                )}
                // Tipografía fluida contra el ancho del contenedor: el mismo
                // titular tiene que entrar en el marco del showcase y llenar la
                // pantalla completa sin dos juegos de clases.
                style={{ fontSize: "clamp(1.375rem, 5.4cqi, 2.5rem)" }}
              >
                {title}
              </h2>
              <p className={cn("text-[13px] leading-relaxed", PANEL_INK.body)}>
                {description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-full p-1">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={active}
                    onClick={() => selectTheme(option.value)}
                    className={cn(
                      "relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg",
                      "outline-none transition-colors duration-100",
                      "focus-visible:ring-1",
                      PANEL_INK.focus,
                      active ? PANEL_INK.knobOn : PANEL_INK.knobOff,
                    )}
                  >
                    {active && (
                      <motion.span
                        // Un solo fondo compartido que viaja entre los tres, en
                        // vez de uno que aparece y otro que desaparece: así se
                        // lee como un selector y no como tres botones sueltos.
                        layoutId={`login-theme-${fieldId}`}
                        transition={spring.moderate}
                        className={cn(
                          "absolute inset-0 rounded-lg ring-1 ring-inset",
                          PANEL_INK.knobBg,
                        )}
                      />
                    )}
                    <Icon className="relative h-[15px] w-[15px]" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Columna de acceso */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
          <div className="w-full max-w-[380px]">
            {/* Marco: envuelve la tarjeta y la línea de registro, y le deja al
              aviso de error un lugar propio arriba. */}
            <div className="relative overflow-hidden rounded-[18px] bg-surface-2 p-1 shadow-surface-1">
              <AnimatePresence initial={false}>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring.moderate}
                    className="overflow-hidden"
                  >
                    <div className="relative flex items-center justify-center gap-2 px-4 py-3">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-8 bottom-0"
                        style={{ background: ERROR_GLOW }}
                      />
                      <ErrorMark className="relative h-4 w-4 shrink-0 text-destructive" />
                      <p
                        role="alert"
                        className="relative text-[13px] font-medium text-destructive"
                      >
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handleSubmit}
                className="relative flex flex-col gap-4 rounded-[14px] bg-surface-3 p-6 shadow-surface-1"
              >
                <Field
                  id={`${fieldId}-email`}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="vos@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={pending}
                />

                <Field
                  id={`${fieldId}-password`}
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                  action={
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="cursor-pointer rounded text-[13px] text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  }
                />

                <Button
                  type="submit"
                  className="mt-1 w-full"
                  disabled={pending}
                >
                  {pending ? "Entrando…" : "Continuar"}
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
                    O
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  leadingIcon={GitHubMark}
                  onClick={onGitHub}
                  disabled={pending}
                >
                  Continuar con GitHub
                </Button>
              </form>

              <p className="py-3 text-center text-[13px] text-muted-foreground">
                ¿Todavía no tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={onSignUp}
                  className="cursor-pointer rounded font-medium text-foreground outline-none transition-opacity duration-100 hover:opacity-70 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  Registrate
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LoginBlock };
export type { LoginBlockProps, LoginBlockTheme };
