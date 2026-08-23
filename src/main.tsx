import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";

import "./index.css";
import App from "./App.tsx";
import { ShapeProvider } from "@/lib/shape-context";
import { SizeProvider } from "@/lib/size-context";
import { SurfaceProvider } from "@/lib/surface-context";
import { TooltipProvider } from "@/components/ui/tooltip";

/*
 * The four system layers from the docs, wired once at the root:
 *
 *  motion    — MotionConfig with reducedMotion="user". Every component
 *              animates on spring.fast / .moderate / .slow from lib/springs;
 *              this makes the OS reduced-motion setting drop the position
 *              changes and keep only the opacity fades.
 *  sizes     — SizeProvider is the 36px default / 28px compact ladder. Wrap
 *              any dense region in its own <SizeProvider size="compact">.
 *  surfaces  — SurfaceProvider declares the substrate level of the page (1).
 *              Popovers and dialogs read it and lift relative to it, so they
 *              stay visible however deeply they nest.
 *  shape     — ShapeProvider drives the radius ladder every component reads.
 *
 *  scrollbars is the fourth docs page, but it's a component (ScrollArea) plus
 *  the scroll-fade / scroll-divider CSS utilities in index.css — no provider.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ShapeProvider defaultShape="rounded">
        <SizeProvider defaultSize="default">
          <SurfaceProvider value={1}>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </SurfaceProvider>
        </SizeProvider>
      </ShapeProvider>
    </MotionConfig>
  </StrictMode>
);
