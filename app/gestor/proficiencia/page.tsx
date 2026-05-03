"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/gestor/section-header";
import { FilterBar } from "@/components/gestor/filter-bar";
import { useGestorFilters } from "@/components/gestor/filters-context";
import { getRankingEstudantes, nivelDeProficiencia, NIVEL_COLORS } from "@/lib/gestor-mock";

type SortKey = "rankingTrieduc" | "rankingEscola" | "lc" | "mt" | "mediaGeral" | "nome";

export default function ProficienciaPage() {
  const { filters } = useGestorFilters();
  const [busca, setBusca] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rankingEscola");
  const [sortAsc, setSortAsc] = useState(true);

  const lista = useMemo(() => getRankingEstudantes(filters), [filters]);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let out = !q
      ? lista
      : lista.filter(
          (e) =>
            e.nome.toLowerCase().includes(q) ||
            e.escola.toLowerCase().includes(q) ||
            e.turma.toLowerCase().includes(q)
        );
    out = [...out].sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return out;
  }, [lista, busca, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "nome" || key === "rankingTrieduc" || key === "rankingEscola");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Proficiência por estudante"
        title={
          <>
            Ranking <span className="text-primary">individual</span> de proficiência
          </>
        }
        description="Clique nas colunas para ordenar. A coluna LC indica Linguagens e MT, Matemática — ambas em pontos SAEB."
        action={
          <Button size="sm" variant="outline" className="rounded-xl h-9 text-xs gap-1.5">
            <DownloadIcon /> Exportar CSV
          </Button>
        }
      />

      <FilterBar />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, escola ou turma..."
            className="w-full h-10 rounded-xl border border-border/60 bg-card/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
        </div>
        <div className="text-[11px] text-muted-foreground">
          {filtrada.length} estudante{filtrada.length === 1 ? "" : "s"}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-foreground/[0.025] hover:bg-foreground/[0.025]">
                <SortableHead onClick={() => toggleSort("rankingTrieduc")} active={sortKey === "rankingTrieduc"} asc={sortAsc} className="w-[88px]">
                  TRIEduc
                </SortableHead>
                <SortableHead onClick={() => toggleSort("rankingEscola")} active={sortKey === "rankingEscola"} asc={sortAsc} className="w-[88px]">
                  Escola
                </SortableHead>
                <SortableHead onClick={() => toggleSort("nome")} active={sortKey === "nome"} asc={sortAsc}>
                  Estudante
                </SortableHead>
                <TableHead className="hidden lg:table-cell text-[11px] uppercase tracking-wider text-muted-foreground">Login</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Escola</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Turma</TableHead>
                <SortableHead onClick={() => toggleSort("lc")} active={sortKey === "lc"} asc={sortAsc} className="text-right">
                  LC
                </SortableHead>
                <SortableHead onClick={() => toggleSort("mt")} active={sortKey === "mt"} asc={sortAsc} className="text-right">
                  MT
                </SortableHead>
                <SortableHead onClick={() => toggleSort("mediaGeral")} active={sortKey === "mediaGeral"} asc={sortAsc} className="text-right">
                  Média
                </SortableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrada.map((e, i) => {
                const nivelGeral = nivelDeProficiencia(e.mediaGeral);
                return (
                  <motion.tr
                    key={`${e.nome}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.25 }}
                    className="border-b border-border/40 hover:bg-foreground/[0.02] transition-colors"
                  >
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      #{e.rankingTrieduc}
                    </TableCell>
                    <TableCell className="font-mono text-[12px]">
                      <span className={`inline-flex items-center justify-center rounded-md w-7 h-6 text-[11px] font-semibold ${
                        e.rankingEscola <= 3
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-foreground/[0.05] text-muted-foreground"
                      }`}>
                        {e.rankingEscola}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                          {e.nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </span>
                        <span className="text-[13px] font-medium">{e.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[11.5px] text-muted-foreground truncate max-w-[200px]" title={e.login}>
                      {e.login}
                    </TableCell>
                    <TableCell className="text-[12px]">{e.escola}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10.5px] font-mono">
                        {e.turma}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[12.5px]">{e.lc}</TableCell>
                    <TableCell className="text-right font-mono text-[12.5px]">{e.mt}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: NIVEL_COLORS[nivelGeral] }}
                          title={nivelGeral}
                        />
                        <span className="font-mono text-[13px] font-semibold">{e.mediaGeral}</span>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
              {filtrada.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                    Nenhum estudante encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}

function SortableHead({
  children,
  onClick,
  active,
  asc,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  asc: boolean;
  className?: string;
}) {
  return (
    <TableHead className={`text-[11px] uppercase tracking-wider text-muted-foreground ${className ?? ""}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          active ? "text-foreground" : ""
        }`}
      >
        {children}
        <span className="text-[9px] opacity-50">{active ? (asc ? "▲" : "▼") : "↕"}</span>
      </button>
    </TableHead>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
