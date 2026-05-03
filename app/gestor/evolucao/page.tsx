"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SectionHeader } from "@/components/gestor/section-header";
import { FilterBar } from "@/components/gestor/filter-bar";
import { useGestorFilters } from "@/components/gestor/filters-context";
import {
  NIVEIS,
  NIVEL_COLORS,
  getEvolucaoPorProva,
  getEvolucaoStackedPorProva,
} from "@/lib/gestor-mock";

export default function EvolucaoPage() {
  const { filters } = useGestorFilters();

  const linha = useMemo(() => getEvolucaoPorProva(filters), [filters]);
  const stack = useMemo(() => getEvolucaoStackedPorProva(filters), [filters]);

  const baseline = Math.round(linha.reduce((s, p) => s + p.media, 0) / linha.length);
  const min = Math.min(...linha.map((d) => d.media));
  const max = Math.max(...linha.map((d) => d.media));
  const delta = linha[linha.length - 1].media - linha[0].media;

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Evolução"
        title={
          <>
            Como a proficiência <span className="text-primary">se transforma</span> ao longo das aplicações
          </>
        }
        description="Acompanhe a média e a distribuição de níveis a cada aplicação para identificar tendências."
      />

      <FilterBar hide={["aplicacao"]} />

      {/* Linha: proficiência média por prova */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              Proficiência média por aplicação
            </p>
            <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">
              Tendência da média geral
            </h2>
          </div>
          <div className="flex gap-2">
            <Stat label="Mínima" value={`${min} pts`} />
            <Stat label="Máxima" value={`${max} pts`} />
            <Stat
              label="Variação"
              value={`${delta >= 0 ? "+" : ""}${delta} pts`}
              tone={delta >= 0 ? "good" : "bad"}
            />
          </div>
        </div>

        <ChartContainer
          config={{
            media: { label: "Proficiência média", color: "var(--color-chart-2)" },
          }}
          className="h-[320px] w-full"
        >
          <AreaChart data={linha} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-evol-line" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
            <XAxis
              dataKey="prova"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={8}
              className="fill-muted-foreground"
              tickFormatter={(v: string) => v.split(" · ")[0]}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={4}
              className="fill-muted-foreground"
              domain={[(d: number) => Math.max(150, Math.floor(d - 20)), (d: number) => Math.min(450, Math.ceil(d + 20))]}
            />
            <ReferenceLine
              y={baseline}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `média ${baseline}`,
                fill: "var(--color-muted-foreground)",
                fontSize: 10,
                position: "right",
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) => [`${v} pts`, "Proficiência média"]}
                />
              }
            />
            <Area
              dataKey="media"
              type="monotone"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              fill="url(#grad-evol-line)"
              dot={{ r: 4, fill: "var(--color-chart-2)", stroke: "var(--color-background)", strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ChartContainer>
      </motion.section>

      {/* Stacked: distribuição por prova */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              Distribuição por nível
            </p>
            <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">
              Estudantes por faixa em cada aplicação
            </h2>
          </div>
          <NivelLegenda />
        </div>

        <ChartContainer
          config={Object.fromEntries(
            NIVEIS.map((n) => [n, { label: n, color: NIVEL_COLORS[n] }])
          ) as ChartConfig}
          className="h-[340px] w-full"
        >
          <BarChart data={stack} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
            <XAxis
              dataKey="categoria"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={8}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={4}
              className="fill-muted-foreground"
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <ChartTooltip
              cursor={{ fill: "var(--color-foreground)", fillOpacity: 0.04 }}
              content={
                <ChartTooltipContent
                  formatter={(v, name) => {
                    const num = typeof v === "number" ? v : parseFloat(v as string);
                    return [`${num.toFixed(1)}%`, name as string];
                  }}
                />
              }
            />
            {NIVEIS.map((nivel, i) => (
              <Bar
                key={nivel}
                dataKey={nivel}
                stackId="dist"
                fill={NIVEL_COLORS[nivel]}
                radius={i === NIVEIS.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive
                animationDuration={900}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </motion.section>
    </div>
  );
}

function NivelLegenda() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {NIVEIS.map((n) => (
        <span key={n} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: NIVEL_COLORS[n] }}
          />
          {n}
        </span>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-2 min-w-[88px]">
      <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-sm font-mono font-semibold tracking-tight mt-0.5 ${
          tone === "good"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "bad"
              ? "text-red-600 dark:text-red-400"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
