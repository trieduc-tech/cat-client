"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGestorFilters } from "./filters-context";
import {
  ANOS_ESCOLARES,
  APLICACOES,
  DISCIPLINAS,
  DRES,
  TURMAS,
  escolasFiltradasPorDre,
} from "@/lib/gestor-mock";

const ALL = "all";

const FILTER_DEFS = [
  { key: "dre", label: "DRE", short: "DRE" },
  { key: "escola", label: "Escola", short: "Escola" },
  { key: "disciplina", label: "Disciplina", short: "Disc." },
  { key: "ano", label: "Ano escolar", short: "Ano" },
  { key: "turma", label: "Turma", short: "Turma" },
  { key: "aplicacao", label: "Aplicação", short: "Aplic." },
] as const;

interface FilterBarProps {
  hide?: Array<(typeof FILTER_DEFS)[number]["key"]>;
  className?: string;
}

export function FilterBar({ hide = [], className }: FilterBarProps) {
  const { filters, setFilter, resetFilters } = useGestorFilters();
  const escolas = escolasFiltradasPorDre(filters.dre);

  const visibleDefs = FILTER_DEFS.filter((def) => !hide.includes(def.key));
  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v !== ALL && !hide.includes(k as (typeof FILTER_DEFS)[number]["key"])
  ).length;

  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-3 sm:p-4 ${
        className ?? ""
      }`}
    >
      <div className="flex flex-wrap items-end gap-2.5">
        {visibleDefs.map((def) => {
          let options: { value: string; label: string }[] = [];
          if (def.key === "dre") {
            options = DRES.map((d) => ({ value: d, label: d }));
          } else if (def.key === "escola") {
            options = escolas.map((e) => ({ value: e, label: e }));
          } else if (def.key === "disciplina") {
            options = DISCIPLINAS.map((d) => ({ value: d, label: d }));
          } else if (def.key === "ano") {
            options = [...ANOS_ESCOLARES].map((a) => ({ value: a, label: a }));
          } else if (def.key === "turma") {
            options = [...TURMAS].map((t) => ({ value: t, label: `Turma ${t}` }));
          } else if (def.key === "aplicacao") {
            options = APLICACOES.map((m) => ({ value: m, label: m }));
          }

          const value = filters[def.key as keyof typeof filters] as string;
          const isActive = value !== ALL;

          return (
            <div key={def.key} className="flex flex-col gap-1.5 min-w-[150px] flex-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {def.label}
              </label>
              <Select
                value={value}
                onValueChange={(v) =>
                  setFilter(def.key as keyof typeof filters, v as never)
                }
              >
                <SelectTrigger
                  className={`h-9 rounded-xl text-xs transition-colors ${
                    isActive ? "border-primary/40 bg-primary/[0.04]" : ""
                  }`}
                >
                  <SelectValue placeholder={`Todas`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}

        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-end pb-px"
            >
              <Button
                onClick={resetFilters}
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-3 text-[11px] font-medium"
              >
                Limpar ({activeCount})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
