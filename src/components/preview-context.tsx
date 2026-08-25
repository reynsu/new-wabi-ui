"use client";

/**
 * PreviewProvider — what the rail is showing, raised to app level.
 *
 * Same problem and same solution as `workspace-context`: the rail is drawn on
 * one side of the shell and whatever asks for a preview lives anywhere else —a
 * row in a list, a name in a table, a tile on the board—. Without this you'd
 * have to thread callbacks through props all the way there.
 *
 * Three pieces:
 *   PreviewProvider  holds the open preview
 *   usePreview()     what any part of the app consumes to open one
 *   the rail         reads it and shows it instead of the board
 *
 * `LateralPreview` knows none of this: it takes its content through props and
 * works just as well on its own, with no provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface PreviewContextValue {
  /** What the rail is showing, or `null` if it's showing the board. */
  preview: ReactNode | null;
  /** Puts a preview in the rail. It replaces whatever was there: the rail shows
   *  one thing at a time, which is what sets it apart from the board. */
  show: (preview: ReactNode) => void;
  /** Gives the rail back to the board. */
  close: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) {
    throw new Error("usePreview must be used inside a PreviewProvider");
  }
  return ctx;
}

function PreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<ReactNode | null>(null);

  const show = useCallback((next: ReactNode) => setPreview(next), []);
  const close = useCallback(() => setPreview(null), []);

  const value = useMemo<PreviewContextValue>(
    () => ({ preview, show, close }),
    [preview, show, close],
  );

  return (
    <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
  );
}

// `usePreview` lives next to its provider on purpose: splitting it out just to
// please fast refresh would break the module in two for nothing. Same decision
// as in `workspace-context`.
// oxlint-disable-next-line react/only-export-components
export { PreviewProvider, usePreview };
export type { PreviewContextValue };
