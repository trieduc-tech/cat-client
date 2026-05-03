"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
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
  getDistribuicaoNiveis,
  getQuantitativo,
  type Disciplina,
  type Nivel,
} from "@/lib/gestor-mock";

export default function DesempenhoPage() {
  const { filters } = useGestorFilters();
  const quantitativo = useMemo(() => getQuantitativo(filters), [filters]);

  const distLP = useMemo(
    () => getDistribuicaoNiveis(filters, "Língua Portuguesa", quantitativo.participantes_lp),
    [filters, quantitativo.participantes_lp]
  );
  const distMT = useMemo(
    () => getDistribuicaoNiveis(filters, "Matemática", quantitativo.participantes_mt),
    [filters, quantitativo.participantes_mt]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Desempenho"
        title={
          <>
            Distribuição de estudantes <span className="text-primary">por faixa de proficiência</span>
          </>
        }
        description="Compare lado a lado quantos estudantes estão em cada nível, em cada disciplina."
      />

      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DesempenhoCard disciplina="Língua Portuguesa" distribuicao={distLP} />
        <DesempenhoCard disciplina="Matemática" distribuicao={distMT} />
      </div>
    </div>
  );
}

function DesempenhoCard({
  disciplina,
  distribuicao,
}: {
  disciplina: Disciplina;
  distribuicao: { nivel: Nivel; alunos: number; percentual: number }[];
}) {
  const total = distribuicao.reduce((s, d) => s + d.alunos, 0);
  const data = distribuicao.map((d) => ({
    nivel: d.nivel,
    alunos: d.alunos,
    percentual: d.percentual,
  }));
  const config = Object.fromEntries(
    NIVEIS.map((n) => [n, { label: n, color: NIVEL_COLORS[n] }])
  ) as ChartConfig;

  const titulo = disciplina === "Língua Portuguesa" ? "Linguagens" : "Matemática";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
    >
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            {disciplina}
          </p>
          <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">{titulo}</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">{total} estudantes</p>
      </div>

      <ChartContainer config={config} className="h-[300px] w-full">
        <BarChart
          data={data}
          margin={{ top: 28, right: 16, left: -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis
            dataKey="nivel"
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
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-foreground)", fillOpacity: 0.04 }}
            content={
              <ChartTooltipContent
                formatter={(v, name, item) => {
                  if (name === "alunos") {
                    const pct = (item?.payload as { percentual?: number } | undefined)?.percentual;
                    return [`${v} alunos · ${pct?.toFixed(1)}%`, ""];
                  }
                  return null;
                }}
                hideIndicator
              />
            }
          />
          <Bar dataKey="alunos" radius={[8, 8, 2, 2]} isAnimationActive animationDuration={900}>
            {data.map((d) => (
              <Cell key={d.nivel} fill={NIVEL_COLORS[d.nivel]} />
            ))}
            <LabelList
              dataKey="alunos"
              position="top"
              className="fill-foreground"
              fontSize={11}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* Mini-stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {distribuicao.map((d) => (
          <div
            key={d.nivel}
            className="rounded-lg border border-border/40 bg-foreground/[0.02] px-2 py-2 text-center"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full mb-1"
              style={{ backgroundColor: NIVEL_COLORS[d.nivel] }}
            />
            <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground truncate">
              {d.nivel}
            </p>
            <p className="text-[12.5px] font-mono font-semibold mt-0.5">{d.percentual.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
