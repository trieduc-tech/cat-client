"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/gestor/section-header";
import { FilterBar } from "@/components/gestor/filter-bar";
import { useGestorFilters } from "@/components/gestor/filters-context";
import {
  ANOS_ESCOLARES,
  ANOS_HISTORICO,
  NIVEIS,
  NIVEL_COLORS,
  getHistoricoPorAno,
  type AnoEscolar,
} from "@/lib/gestor-mock";

export default function HistoricoPage() {
  const { filters } = useGestorFilters();
  const [anoAlvo, setAnoAlvo] = useState<AnoEscolar>("6º ano");
  const [anosSelecionados, setAnosSelecionados] = useState<string[]>([...ANOS_HISTORICO]);

  const data = useMemo(
    () => getHistoricoPorAno(filters, anoAlvo, anosSelecionados as readonly string[]),
    [filters, anoAlvo, anosSelecionados]
  );

  const toggleAno = (ano: string) => {
    setAnosSelecionados((prev) => {
      if (prev.includes(ano)) {
        if (prev.length === 1) return prev; // mantém pelo menos um
        return prev.filter((a) => a !== ano);
      }
      return [...prev, ano].sort();
    });
  };

  const ultimo = data[data.length - 1];
  const primeiro = data[0];
  const deltaAvancado = ultimo["Avançado"] - primeiro["Avançado"];
  const deltaAbaixoBasico = ultimo["Abaixo do básico"] - primeiro["Abaixo do básico"];

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Histórico de desempenho"
        title={
          <>
            Como o mesmo ano <span className="text-primary">evoluiu ao longo do tempo</span>
          </>
        }
        description="Compare a distribuição de proficiência de uma série em diferentes anos para identificar avanços e gargalos persistentes."
      />

      <FilterBar hide={["aplicacao", "ano"]} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Ano escolar de referência
          </label>
          <Select value={anoAlvo} onValueChange={(v) => setAnoAlvo(v as AnoEscolar)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANOS_ESCOLARES.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Anos exibidos
          </label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {ANOS_HISTORICO.map((ano) => {
              const active = anosSelecionados.includes(ano);
              return (
                <button
                  key={ano}
                  type="button"
                  onClick={() => toggleAno(ano)}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-primary/40 bg-primary/[0.08] text-primary"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ano}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              Série {anoAlvo}
            </p>
            <h2 className="font-display text-xl sm:text-2xl tracking-tight mt-1">
              Distribuição por faixa de proficiência
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <DeltaBadge value={deltaAvancado} label="Avançado" tone="good" />
            <DeltaBadge value={deltaAbaixoBasico} label="Abaixo do básico" tone="bad" invert />
          </div>
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
              fontSize={11}
              tickMargin={8}
              className="fill-muted-foreground"
              tickFormatter={(v: string) => v.split(" · ")[1] ?? v}
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

        <div className="mt-4 flex items-center justify-between">
          <NivelLegenda />
          <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs gap-1.5">
            <DownloadIcon /> Exportar
          </Button>
        </div>
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

function DeltaBadge({
  value,
  label,
  tone,
  invert,
}: {
  value: number;
  label: string;
  tone: "good" | "bad";
  invert?: boolean;
}) {
  // se invert: queda em "abaixo do básico" é boa
  const positive = invert ? value < 0 : value > 0;
  const color = positive
    ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
    : "text-red-600 bg-red-500/10 dark:text-red-400";
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${color}`}>
      <p className="text-[9.5px] font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono font-semibold mt-0.5">
        {value >= 0 ? "+" : ""}
        {value.toFixed(1)}%
      </p>
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
