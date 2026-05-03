"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ANOS_ESCOLARES,
  NIVEIS,
  NIVEL_COLORS,
  getComparacoesPorAno,
  getDistribuicaoNiveis,
  type Disciplina,
} from "@/lib/gestor-mock";

export default function ComparacoesPage() {
  const { filters } = useGestorFilters();
  const data = useMemo(() => getComparacoesPorAno(filters), [filters]);

  // Cards comparativos por ano
  const disc = (filters.disciplina === "all" ? "Matemática" : filters.disciplina) as Disciplina;
  const cards = useMemo(
    () =>
      ANOS_ESCOLARES.map((ano) => {
        const dist = getDistribuicaoNiveis({ ...filters, ano }, disc);
        const total = dist.reduce((s, d) => s + d.alunos, 0);
        const proficienteOuAcima = dist
          .filter((d) => d.nivel === "Proficiente" || d.nivel === "Avançado")
          .reduce((s, d) => s + d.alunos, 0);
        return {
          ano,
          total,
          proficienteOuAcimaPct: total > 0 ? Math.round((proficienteOuAcima / total) * 100) : 0,
          dist,
        };
      }),
    [filters, disc]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Comparações"
        title={
          <>
            Distribuição <span className="text-primary">entre anos escolares</span>
          </>
        }
        description="Compare como cada ano se distribui nos níveis de proficiência. Útil para identificar onde estão as maiores defasagens."
      />

      <FilterBar hide={["aplicacao", "ano"]} />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              Distribuição por faixa de proficiência
            </p>
            <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">
              Quem está em cada nível, por ano escolar
            </h2>
          </div>
          <NivelLegenda />
        </div>

        <ChartContainer
          config={Object.fromEntries(
            NIVEIS.map((n) => [n, { label: n, color: NIVEL_COLORS[n] }])
          ) as ChartConfig}
          className="h-[360px] w-full"
        >
          <BarChart data={data} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
            <XAxis
              dataKey="categoria"
              tickLine={false}
              axisLine={false}
              fontSize={12}
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
                radius={i === NIVEIS.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive
                animationDuration={900}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </motion.section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.ano}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
            className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {c.ano}
            </p>
            <p className="font-display text-2xl tracking-tight mt-1">{c.proficienteOuAcimaPct}%</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">Proficiente ou avançado</p>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
              {c.dist.map((d) => (
                <div
                  key={d.nivel}
                  style={{
                    width: `${d.percentual}%`,
                    backgroundColor: NIVEL_COLORS[d.nivel],
                  }}
                />
              ))}
            </div>
            <p className="mt-2 text-[10.5px] text-muted-foreground">{c.total} alunos</p>
          </motion.div>
        ))}
      </div>
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
