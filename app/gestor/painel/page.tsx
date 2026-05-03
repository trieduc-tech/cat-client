"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/gestor/section-header";
import { FilterBar } from "@/components/gestor/filter-bar";
import { KpiCard } from "@/components/gestor/kpi-card";
import { AnimatedCounter } from "@/components/gestor/animated-counter";
import { useGestorFilters } from "@/components/gestor/filters-context";
import {
  getHistogramaSAEB,
  getMediasProficiencia,
  getQuantitativo,
} from "@/lib/gestor-mock";

export default function PainelPage() {
  const { filters } = useGestorFilters();
  const quantitativo = useMemo(() => getQuantitativo(filters), [filters]);
  const medias = useMemo(() => getMediasProficiencia(filters), [filters]);
  const histLP = useMemo(() => getHistogramaSAEB(filters, "Língua Portuguesa"), [filters]);
  const histMT = useMemo(() => getHistogramaSAEB(filters, "Matemática"), [filters]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Painel"
        title={
          <>
            Visão consolidada <span className="text-primary">das avaliações</span>
          </>
        }
        description="Quantitativo de participantes, médias de proficiência e distribuição na escala SAEB para os filtros selecionados."
      />

      <FilterBar />

      {/* Quantitativo */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="font-display text-xl tracking-tight">Quantitativo de participantes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            highlight
            size="lg"
            label="Estudantes inscritos"
            value={<AnimatedCounter value={quantitativo.inscritos} />}
            sublabel="No processo avaliativo"
          />
          <KpiCard
            label="Linguagens"
            value={<AnimatedCounter value={quantitativo.participantes_lp} />}
            sublabel={`${quantitativo.participacao_lp_pct}% de participação`}
            footer={
              <ParticipacaoBar pct={quantitativo.participacao_lp_pct} />
            }
          />
          <KpiCard
            label="Matemática"
            value={<AnimatedCounter value={quantitativo.participantes_mt} />}
            sublabel={`${quantitativo.participacao_mt_pct}% de participação`}
            footer={
              <ParticipacaoBar pct={quantitativo.participacao_mt_pct} />
            }
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="rounded-xl h-9 text-xs gap-1.5">
            <DownloadIcon /> Baixar comparecimento
          </Button>
        </div>
      </motion.section>

      {/* Médias */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="font-display text-xl tracking-tight">Média das proficiências</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard
            highlight
            size="lg"
            label="Média geral"
            value={
              <>
                <AnimatedCounter value={medias.geral} />
                <span className="text-base text-muted-foreground font-sans"> pts</span>
              </>
            }
            sublabel={
              <>
                Média TRIEduc:{" "}
                <span className="font-mono font-semibold text-foreground">{medias.trieduc_geral} pts</span>
              </>
            }
          />
          <KpiCard
            label="Linguagens"
            value={
              <>
                <AnimatedCounter value={medias.lp} />
                <span className="text-base text-muted-foreground font-sans"> pts</span>
              </>
            }
            sublabel={
              <>
                Média TRIEduc:{" "}
                <span className="font-mono font-semibold text-foreground">{medias.trieduc_lp} pts</span>
              </>
            }
            trend={{ value: Math.round(((medias.lp - medias.trieduc_lp) / medias.trieduc_lp) * 100) }}
          />
          <KpiCard
            label="Matemática"
            value={
              <>
                <AnimatedCounter value={medias.mt} />
                <span className="text-base text-muted-foreground font-sans"> pts</span>
              </>
            }
            sublabel={
              <>
                Média TRIEduc:{" "}
                <span className="font-mono font-semibold text-foreground">{medias.trieduc_mt} pts</span>
              </>
            }
            trend={{ value: Math.round(((medias.mt - medias.trieduc_mt) / medias.trieduc_mt) * 100) }}
          />
        </div>
      </motion.section>

      {/* Histograma SAEB */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="font-display text-xl tracking-tight">Distribuição de desempenho na escala SAEB</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HistogramaCard titulo="Linguagens" dados={histLP} />
          <HistogramaCard titulo="Matemática" dados={histMT} />
        </div>
      </motion.section>
    </div>
  );
}

function ParticipacaoBar({ pct }: { pct: number }) {
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="h-full rounded-full bg-primary"
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function HistogramaCard({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { bin: string; binStart: number; alunos: number; trieducPct: number }[];
}) {
  const config = {
    alunos: { label: "Seus resultados", color: "var(--color-chart-2)" },
    trieducPct: { label: "Resultados TRIEduc", color: "var(--color-chart-4)" },
  } satisfies ChartConfig;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display text-lg tracking-tight">{titulo}</p>
        <div className="flex items-center gap-3 text-[10.5px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-chart-2)]" />
            Seus resultados
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-chart-4)]" />
            Média TRIEduc
          </span>
        </div>
      </div>
      <ChartContainer config={config} className="h-[280px] w-full">
        <ComposedChart data={dados} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-bar-${titulo}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id={`grad-area-${titulo}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis
            dataKey="bin"
            tickLine={false}
            axisLine={false}
            fontSize={10}
            className="fill-muted-foreground"
            tickMargin={6}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={10}
            className="fill-muted-foreground"
            tickMargin={4}
            tickFormatter={(v) => `${v}%`}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-foreground)", fillOpacity: 0.04 }}
            content={
              <ChartTooltipContent
                formatter={(v, name) => {
                  const num = typeof v === "number" ? v : parseFloat(v as string);
                  if (name === "alunos") return [`${num.toFixed(1)}%`, "Seus resultados"];
                  if (name === "trieducPct") return [`${num.toFixed(1)}%`, "Média TRIEduc"];
                  return null;
                }}
              />
            }
          />
          <Bar dataKey="alunos" fill={`url(#grad-bar-${titulo})`} radius={[6, 6, 2, 2]} />
          <Area
            dataKey="trieducPct"
            type="monotone"
            stroke="var(--color-chart-4)"
            strokeWidth={2.5}
            fill={`url(#grad-area-${titulo})`}
            dot={false}
            activeDot={{ r: 3.5 }}
          />
        </ComposedChart>
      </ChartContainer>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2">
          <span className="block text-[9.5px] uppercase tracking-wider font-semibold">Concentração</span>
          <span className="font-mono font-semibold text-foreground">
            {(() => {
              const max = dados.reduce((a, b) => (b.alunos > a.alunos ? b : a));
              return max.bin;
            })()}
          </span>
        </div>
        <div className="rounded-lg border border-border/40 bg-foreground/[0.02] px-3 py-2">
          <span className="block text-[9.5px] uppercase tracking-wider font-semibold">Pontuações &lt; 250</span>
          <span className="font-mono font-semibold text-foreground">
            {Math.round(
              dados.filter((d) => d.binStart < 250).reduce((s, d) => s + d.alunos, 0)
            )}
            %
          </span>
        </div>
      </div>
    </div>
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
