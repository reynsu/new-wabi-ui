"use client";

/**
 * WorkspaceProvider — las pestañas del WorkspacePanel, elevadas al nivel de la
 * app para que cualquier componente pueda abrir una sin tener que pasarse
 * callbacks por props hasta llegar al panel.
 *
 * Tres piezas:
 *   WorkspaceProvider  guarda las pestañas y cuál está activa
 *   useWorkspace()     lo que consume cualquier parte de la app para abrirlas
 *   WorkspaceOutlet    el sitio donde el panel se dibuja, normalmente uno solo
 *
 * WorkspacePanel no se entera de nada de esto: sigue recibiendo `tabs` por
 * props y sirve igual suelto, sin provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  WorkspacePanel,
  type WorkspacePanelProps,
  type WorkspaceTab,
} from "@/components/workspace-panel";

interface WorkspaceState {
  tabs: WorkspaceTab[];
  activeId: string | undefined;
}

interface WorkspaceContextValue extends WorkspaceState {
  /** Abre una pestaña y la enfoca. Si ya hay una con ese id no la duplica:
   *  sólo la enfoca, que es lo que se espera al volver a pedir algo abierto.
   *  Con `focus: false` la deja abierta en segundo plano. */
  openTab: (tab: WorkspaceTab, options?: { focus?: boolean }) => void;
  /** Cierra una pestaña. Si era la activa, el relevo pasa a su vecina — la de
   *  la derecha, o la de la izquierda si era la última. */
  closeTab: (id: string) => void;
  /** Enfoca una pestaña ya abierta. Ignora ids que no existan. */
  activateTab: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace debe usarse dentro de un WorkspaceProvider");
  }
  return ctx;
}

interface WorkspaceProviderProps {
  children: ReactNode;
  /** Pestañas con las que arranca. */
  defaultTabs?: WorkspaceTab[];
  /** Cuál queda activa al montar. Por defecto, la primera. */
  defaultActiveId?: string;
}

function WorkspaceProvider({
  children,
  defaultTabs = [],
  defaultActiveId,
}: WorkspaceProviderProps) {
  // Un solo objeto de estado y no dos: cerrar la activa tiene que quitarla de
  // la lista y mover la selección en el mismo paso, y para elegir la vecina
  // hace falta la lista de ANTES de quitarla. Con dos estados separados eso
  // obliga a leer uno desde el updater del otro, que en StrictMode se ejecuta
  // dos veces.
  const [state, setState] = useState<WorkspaceState>(() => ({
    tabs: defaultTabs,
    activeId: defaultActiveId ?? defaultTabs[0]?.id,
  }));

  const openTab = useCallback(
    (tab: WorkspaceTab, { focus = true }: { focus?: boolean } = {}) => {
      setState((s) => {
        const abierta = s.tabs.some((t) => t.id === tab.id);
        return {
          // Ya abierta: se respeta la que está. Reemplazarla por el descriptor
          // nuevo remontaría su contenido y se perdería lo que tuviera dentro
          // (scroll, un formulario a medias).
          tabs: abierta ? s.tabs : [...s.tabs, tab],
          activeId: focus ? tab.id : s.activeId ?? tab.id,
        };
      });
    },
    []
  );

  const closeTab = useCallback((id: string) => {
    setState((s) => {
      const i = s.tabs.findIndex((t) => t.id === id);
      if (i === -1) return s;
      return {
        tabs: s.tabs.filter((t) => t.id !== id),
        activeId:
          s.activeId === id
            ? (s.tabs[i + 1] ?? s.tabs[i - 1])?.id
            : s.activeId,
      };
    });
  }, []);

  const activateTab = useCallback((id: string) => {
    setState((s) =>
      s.tabs.some((t) => t.id === id) ? { ...s, activeId: id } : s
    );
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({ ...state, openTab, closeTab, activateTab }),
    [state, openTab, closeTab, activateTab]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/** Donde el panel se dibuja. Normalmente uno solo, al lado del sidebar. */
type WorkspaceOutletProps = Omit<
  WorkspacePanelProps,
  "tabs" | "value" | "defaultValue" | "onValueChange" | "onTabClose"
>;

function WorkspaceOutlet(props: WorkspaceOutletProps) {
  const { tabs, activeId, activateTab, closeTab } = useWorkspace();

  return (
    <WorkspacePanel
      tabs={tabs}
      // "" y no undefined: el panel trata `value === undefined` como "no
      // controlado" y volvería a su estado interno cuando no hay ninguna
      // activa. Un id vacío no coincide con nada y lo mantiene controlado.
      value={activeId ?? ""}
      onValueChange={activateTab}
      onTabClose={closeTab}
      {...props}
    />
  );
}

export { WorkspaceProvider, WorkspaceOutlet, useWorkspace };
export type { WorkspaceContextValue, WorkspaceProviderProps, WorkspaceOutletProps };
