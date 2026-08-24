"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Mide el alto del nodo montado. Devuelve un ref estable y el alto en px.
 *
 *  Para animar el alto de un contenedor cuyo contenido se reemplaza con un
 *  cruce: el que entra publica su medida antes de que el que sale termine de
 *  irse, así el contenedor viaja a la medida final y no en dos tirones.
 *
 *  Dos detalles que parecen de más y no lo son:
 *
 *  - **El ref es el mismo callback en todos los renders.** Uno nuevo por
 *    render hace que React lo desmonte y lo vuelva a montar, y cada vuelta
 *    invalida la medición.
 *
 *  - **No suelta el observer cuando lo llaman con `null`.** Durante el cruce
 *    los dos contenidos están montados, así que el nodo que se va llama al ref
 *    con `null` *después* de que el que entra ya se anotó: soltar ahí borraría
 *    la medición del que se está quedando.
 *
 *  `offsetHeight` y no `getBoundingClientRect`: bajo un ancestro escalado —un
 *  popup que entra con un spring de escala— el rect devuelve el alto visual y
 *  el contenedor animaría hacia un número que deja de ser cierto en cuanto la
 *  escala llega a 1. */
export function useMeasuredHeight<T extends HTMLElement = HTMLDivElement>() {
  const [height, setHeight] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    if (!node) return;
    observer.current?.disconnect();
    const next = new ResizeObserver(() => setHeight(node.offsetHeight));
    next.observe(node);
    observer.current = next;
    setHeight(node.offsetHeight);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, height] as const;
}
