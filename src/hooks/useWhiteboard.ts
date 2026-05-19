import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STATE,
  type WhiteboardItem,
  type WhiteboardState,
  type Viewport,
} from "@/types/whiteboard";

const STORAGE_KEY = "o2-whiteboard-v1";

function loadState(): WhiteboardState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as WhiteboardState;
    if (!parsed.items || !parsed.viewport) return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: WhiteboardState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}

export function useWhiteboard() {
  const [state, setState] = useState<WhiteboardState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const addItem = useCallback((item: WhiteboardItem) => {
    setState((s) => ({ ...s, items: [...s.items, item] }));
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<WhiteboardItem>) => {
      setState((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === id ? ({ ...it, ...patch } as WhiteboardItem) : it,
        ),
      }));
    },
    [],
  );

  const removeItems = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setState((s) => ({ ...s, items: s.items.filter((it) => !set.has(it.id)) }));
  }, []);

  const setViewport = useCallback((vp: Viewport | ((prev: Viewport) => Viewport)) => {
    setState((s) => ({
      ...s,
      viewport: typeof vp === "function" ? (vp as any)(s.viewport) : vp,
    }));
  }, []);

  const clear = useCallback(() => {
    setState({ ...DEFAULT_STATE });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setState((s) => {
      const maxZ = s.items.reduce((m, it) => Math.max(m, it.z), 0);
      return {
        ...s,
        items: s.items.map((it) => (it.id === id ? { ...it, z: maxZ + 1 } : it)),
      };
    });
  }, []);

  return {
    state,
    hydrated,
    addItem,
    updateItem,
    removeItems,
    setViewport,
    clear,
    bringToFront,
  };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 11);
}
