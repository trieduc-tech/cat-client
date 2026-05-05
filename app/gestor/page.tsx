"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/gestor/section-header";
import { KpiCard } from "@/components/gestor/kpi-card";
import { AnimatedCounter } from "@/components/gestor/animated-counter";
import { useGestorFilters } from "@/components/gestor/filters-context";
import {
  ANOS_ESCOLARES,
  DISCIPLINAS,
  NIVEIS,
  NIVEL_COLORS,
  TURMAS,
  getDistribuicaoNiveis,
  getExtremos,
  getMediasProficiencia,
  getParticipantesPorAplicacao,
  getQuantitativo,
  type Disciplina,
} from "@/lib/gestor-mock";

const ALL = "all";

export default function GestorHomePage() {
  const { filters, setFilter } = useGestorFilters();

  const quantitativo = useMemo(() => getQuantitativo(filters), [filters]);
  const medias = useMemo(() => getMediasProficiencia(filters), [filters]);
  const extremos = useMemo(() => getExtremos(filters), [filters]);
  const porAplicacao = useMemo(() => getParticipantesPorAplicacao(filters), [filters]);

  const distLP = useMemo(
    () => getDistribuicaoNiveis(filters, "Língua Portuguesa", quantitativo.participantes_lp),
    [filters, quantitativo.participantes_lp]
  );
  const distMT = useMemo(
    () => getDistribuicaoNiveis(filters, "Matemática", quantitativo.participantes_mt),
    [filters, quantitativo.participantes_mt]
  );

  const totalParticipantes = quantitativo.participantes_lp + quantitativo.participantes_mt;

  return (
    <div className="space-y-8">
      <SectionHeader
        title={
          <>
            Visão geral do <span className="text-primary">CAT</span>
          </>
        }
        description="Panorama dos alunos avaliados — proficiência, participação e distribuição por nível em cada disciplina."
        action={
          <Button asChild size="sm" variant="outline" className="rounded-xl h-9 text-xs">
            <Link href="/gestor/painel">Ver painel completo →</Link>
          </Button>
        }
      />

      {/* Mini-filtros: disciplina, série, turma */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        <MiniFilter
          label="Disciplina"
          value={filters.disciplina}
          onChange={(v) => setFilter("disciplina", v as never)}
          options={[{ value: ALL, label: "Todas" }, ...DISCIPLINAS.map((d) => ({ value: d, label: d }))]}
        />
        <MiniFilter
          label="Série"
          value={filters.ano}
          onChange={(v) => setFilter("ano", v as never)}
          options={[{ value: ALL, label: "Todas" }, ...ANOS_ESCOLARES.map((a) => ({ value: a, label: a }))]}
        />
        <MiniFilter
          label="Turma"
          value={filters.turma}
          onChange={(v) => setFilter("turma", v as never)}
          options={[{ value: ALL, label: "Todas" }, ...TURMAS.map((t) => ({ value: t, label: `Turma ${t}` }))]}
        />
      </motion.div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard
          highlight
          size="lg"
          label="Total de estudantes"
          value={<AnimatedCounter value={totalParticipantes} />}
          sublabel={
            <>
              <strong className="text-foreground">{quantitativo.inscritos}</strong> inscritos no
              processo
            </>
          }
          icon={<UsersIcon />}
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Participação média</span>
              <span className="font-mono font-semibold text-primary">
                {Math.round(
                  (quantitativo.participacao_lp_pct + quantitativo.participacao_mt_pct) / 2
                )}
                %
              </span>
            </div>
          }
        />
        <KpiCard
          label="Linguagens"
          value={<AnimatedCounter value={quantitativo.participantes_lp} />}
          sublabel={`${quantitativo.participacao_lp_pct}% de participação`}
          icon={<BookIcon />}
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Proficiência média</span>
              <span className="font-mono font-semibold">
                <AnimatedCounter value={medias.lp} /> pts
              </span>
            </div>
          }
        />
        <KpiCard
          label="Matemática"
          value={<AnimatedCounter value={quantitativo.participantes_mt} />}
          sublabel={`${quantitativo.participacao_mt_pct}% de participação`}
          icon={<CalcIcon />}
          footer={
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Proficiência média</span>
              <span className="font-mono font-semibold">
                <AnimatedCounter value={medias.mt} /> pts
              </span>
            </div>
          }
        />
      </div>

      {/* Disciplinas detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DisciplinaCard
          disciplina="Língua Portuguesa"
          media={medias.lp}
          maior={extremos[0].maior}
          menor={extremos[0].menor}
          alunoMaior={extremos[0].alunoMaior}
          alunoMenor={extremos[0].alunoMenor}
          distribuicao={distLP}
        />
        <DisciplinaCard
          disciplina="Matemática"
          media={medias.mt}
          maior={extremos[1].maior}
          menor={extremos[1].menor}
          alunoMaior={extremos[1].alunoMaior}
          alunoMenor={extremos[1].alunoMenor}
          distribuicao={distMT}
        />
      </div>

      {/* Participação por aplicação */}
      <ParticipacaoChart data={porAplicacao} />
    </div>
  );
}

function MiniFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== ALL;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`h-10 rounded-xl text-sm transition-colors ${
            isActive ? "border-primary/40 bg-primary/[0.04]" : ""
          }`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DisciplinaCard({
  disciplina,
  media,
  maior,
  menor,
  alunoMaior,
  alunoMenor,
  distribuicao,
}: {
  disciplina: Disciplina;
  media: number;
  maior: number;
  menor: number;
  alunoMaior: string;
  alunoMenor: string;
  distribuicao: { nivel: (typeof NIVEIS)[number]; alunos: number; percentual: number }[];
}) {
  const totalAlunos = distribuicao.reduce((s, d) => s + d.alunos, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            {disciplina === "Língua Portuguesa" ? "Linguagens" : "Matemática"}
          </p>
          <p className="font-display text-3xl tracking-tight mt-1">
            <AnimatedCounter value={media} /> <span className="text-base text-muted-foreground font-sans">pts</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Proficiência média (escala SAEB)</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {disciplina === "Língua Portuguesa" ? <BookIcon /> : <CalcIcon />}
        </div>
      </div>

      {/* Maior / Menor */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-foreground/[0.03] border border-border/40 p-3">
          <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Maior proficiência
          </p>
          <p className="text-xl font-display mt-1">
            <AnimatedCounter value={maior} /> pts
          </p>
          <p className="text-[10.5px] text-muted-foreground truncate mt-0.5" title={alunoMaior}>
            {alunoMaior}
          </p>
        </div>
        <div className="rounded-xl bg-foreground/[0.03] border border-border/40 p-3">
          <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
            Menor proficiência
          </p>
          <p className="text-xl font-display mt-1">
            <AnimatedCounter value={menor} /> pts
          </p>
          <p className="text-[10.5px] text-muted-foreground truncate mt-0.5" title={alunoMenor}>
            {alunoMenor}
          </p>
        </div>
      </div>

      {/* Distribuição por nível - barras horizontais */}
      <div className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          Distribuição por nível
        </p>
        <div className="space-y-1.5">
          {distribuicao.map((d, i) => {
            const max = Math.max(...distribuicao.map((x) => x.alunos), 1);
            const widthPct = (d.alunos / max) * 100;
            return (
              <div key={d.nivel} className="grid grid-cols-[120px_1fr_auto] items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: NIVEL_COLORS[d.nivel] }}
                  />
                  <span className="text-muted-foreground truncate">{d.nivel}</span>
                </div>
                <div className="h-5 rounded-md bg-foreground/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                    className="h-full rounded-md"
                    style={{ backgroundColor: NIVEL_COLORS[d.nivel] }}
                  />
                </div>
                <span className="text-[11px] font-mono font-semibold w-10 text-right">
                  {d.alunos}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10.5px] text-muted-foreground pt-1">
          {totalAlunos} alunos avaliados em {disciplina === "Língua Portuguesa" ? "Linguagens" : "Matemática"}
        </p>
      </div>
    </motion.div>
  );
}

function ParticipacaoChart({
  data,
}: {
  data: { aplicacao: string; alunos: number }[];
}) {
  const config = {
    alunos: { label: "Estudantes", color: "var(--color-chart-2)" },
  } satisfies ChartConfig;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 sm:p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Participação por aplicação
          </p>
          <h2 className="font-display text-xl tracking-tight mt-1">
            Estudantes que participaram em cada mês
          </h2>
        </div>
      </div>
      <ChartContainer config={config} className="h-[260px] w-full">
        <BarChart data={data} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-alunos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
          <XAxis
            dataKey="aplicacao"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            className="fill-muted-foreground"
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} fontSize={11} className="fill-muted-foreground" tickMargin={4} />
          <ChartTooltip
            cursor={{ fill: "var(--color-foreground)", fillOpacity: 0.04 }}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(v) => [`${v} estudantes`, ""]}
              />
            }
          />
          <Bar dataKey="alunos" fill="url(#grad-alunos)" radius={[8, 8, 4, 4]} />
        </BarChart>
      </ChartContainer>
    </motion.div>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function CalcIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="14" x2="8" y2="14" />
      <line x1="12" y1="14" x2="12" y2="14" />
      <line x1="16" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="8" y2="18" />
      <line x1="12" y1="18" x2="12" y2="18" />
      <line x1="16" y1="18" x2="16" y2="18" />
    </svg>
  );
}
