"use client";

import { useSize, type SizeVariant } from "@/lib/size-context";

/**
 * El vocabulario del embutido: el par bandeja/tarjeta que usan `InsetDialog` y
 * `PeekCard`.
 *
 * Vive en `lib/` y no adentro del diálogo porque no es de él: es la medida que
 * hace que las dos piezas se lean como una familia y no como dos que se
 * parecen. Dos copias del mismo número se despegan a la primera que alguien
 * afine una.
 */

/** La sombra de la tarjeta embutida, fija. No sigue a su escalón porque no
 *  flota: lo único que necesita es el anillo que la recorta contra la bandeja. */
export const CARD_SHADOW = 2;

/** El aire de la bandeja alrededor de la tarjeta, y el inset de más que se
 *  corren cabecera y pie para que el título no arranque pegado al canto.
 *
 *  Acepta el mismo override que el resto de la escalera: quien reciba un
 *  `size` por prop tiene que pasarlo acá también. Su propio `SizeProvider`
 *  cuelga más abajo en el árbol y no llega a este renglón, así que sin el
 *  override el marco se queda con el aire del contexto de afuera mientras el
 *  ancho y la tipografía ya se movieron. */
export function useInsetMetrics(size?: SizeVariant | null) {
  const compact = useSize(size).variant === "compact";
  const pad = compact ? 12 : 16;
  return { pad, rail: pad / 2, compact };
}
