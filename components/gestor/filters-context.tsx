"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_FILTERS,
  type GestorFilters,
} from "@/lib/gestor-mock";

interface FiltersContextValue {
  filters: GestorFilters;
  setFilter: <K extends keyof GestorFilters>(key: K, value: GestorFilters[K]) => void;
  resetFilters: () => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function GestorFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GestorFilters>(DEFAULT_FILTERS);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilter: (key, value) =>
        setFilters((prev) => {
          const next = { ...prev, [key]: value };
          // se mudar DRE, limpa escola selecionada
          if (key === "dre" && prev.escola !== "all") next.escola = "all";
          return next;
        }),
      resetFilters: () => setFilters(DEFAULT_FILTERS),
    }),
    [filters]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useGestorFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useGestorFilters must be used inside GestorFiltersProvider");
  return ctx;
}
