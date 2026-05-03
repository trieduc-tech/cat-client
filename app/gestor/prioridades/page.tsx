"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DISCIPLINAS,
  getHabilidades,
  type Disciplina,
  type Habilidade,
} from "@/lib/gestor-mock";

type Aba = "melhorar" | "fortes";

export default function PrioridadesPage() {
  const { filters } = useGestorFilters();
  const [disciplina, setDisciplina] = useState<Disciplina>("Matemática");
  const [aba, setAba] = useState<Aba>("melhorar");

  const habilidades = useMemo(
    () => getHabilidades(filters, disciplina),
    [filters, disciplina]
  );

  const filtradas = habilidades.filter((h) =>
    aba === "melhorar" ? h.percentualAcerto < 50 : h.percentualAcerto >= 50
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionHeader
        eyebrow="Prioridade de estudos"
        title={
          <>
            Onde concentrar <span className="text-primary">a próxima intervenção</span>
          </>
        }
        description="Habilidades organizadas pelo percentual de acerto. Comece pelas com menor desempenho — clique em Detalhes para ver os estudantes afetados."
        action={
          <Button size="sm" className="rounded-xl h-9 text-xs gap-1.5">
            <DownloadIcon /> Baixar relatório completo
          </Button>
        }
      />

      <FilterBar />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-[220px]">
          <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            Disciplina
          </label>
          <Select value={disciplina} onValueChange={(v) => setDisciplina(v as Disciplina)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCIPLINAS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="melhorar" className="rounded-lg text-xs">
              Pontos a melhorar
              <span className="ml-1.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 text-[10px] font-mono">
                {habilidades.filter((h) => h.percentualAcerto < 50).length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="fortes" className="rounded-lg text-xs">
              Pontos fortes
              <span className="ml-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-mono">
                {habilidades.filter((h) => h.percentualAcerto >= 50).length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${disciplina}-${aba}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="space-y-2"
        >
          {filtradas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma habilidade nessa categoria com os filtros atuais.
              </p>
            </div>
          )}
          {filtradas.map((hab, i) => (
            <HabilidadeRow
              key={hab.codigo}
              habilidade={hab}
              disciplina={disciplina}
              tone={aba}
              delay={i * 0.04}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HabilidadeRow({
  habilidade,
  disciplina,
  tone,
  delay,
}: {
  habilidade: Habilidade;
  disciplina: Disciplina;
  tone: Aba;
  delay: number;
}) {
  const accent = tone === "melhorar"
    ? "from-red-500/15 via-red-500/5 to-transparent"
    : "from-emerald-500/15 via-emerald-500/5 to-transparent";
  const barColor = tone === "melhorar" ? "bg-red-500" : "bg-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm`}
    >
      {/* gradient hint na lateral */}
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r ${accent}`} />

      <div className="relative grid grid-cols-1 lg:grid-cols-[120px_1fr_240px_120px] gap-4 items-center p-4">
        <div>
          <Badge variant="secondary" className="font-mono text-[10.5px]">
            {habilidade.codigo}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1.5 truncate" title={habilidade.unidadeTematica}>
            {habilidade.unidadeTematica}
          </p>
        </div>

        <div>
          <p className="text-[13.5px] leading-snug">{habilidade.descricao}</p>
          <p className="text-[10.5px] text-muted-foreground mt-1.5">
            {habilidade.estudantesAfetados} estudantes na faixa
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Acertos
            </span>
            <span className="font-mono text-sm font-semibold ml-auto">{habilidade.percentualAcerto}%</span>
          </div>
          <div className="h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${habilidade.percentualAcerto}%` }}
              transition={{ delay: delay + 0.1, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              className={`h-full rounded-full ${barColor}`}
            />
          </div>
        </div>

        <DetalhesDialog habilidade={habilidade} disciplina={disciplina} tone={tone} />
      </div>
    </motion.div>
  );
}

function DetalhesDialog({
  habilidade,
  disciplina,
  tone,
}: {
  habilidade: Habilidade;
  disciplina: Disciplina;
  tone: Aba;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs">
          Detalhes →
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-tight">
            <Badge variant="secondary" className="font-mono mr-2">{habilidade.codigo}</Badge>
            {habilidade.descricao}
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-[10.5px]">{disciplina}</Badge>
              <Badge variant="outline" className="text-[10.5px]">{habilidade.ano}</Badge>
              <Badge variant="outline" className="text-[10.5px]">{habilidade.unidadeTematica}</Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tone === "melhorar" ? "Estudantes que erraram a maior parte dos itens" : "Estudantes que acertaram a maior parte dos itens"}
            </p>
            <p className="font-display text-3xl tracking-tight mt-1">
              {habilidade.estudantesAfetados}
              <span className="text-base text-muted-foreground font-sans ml-1.5">estudantes</span>
            </p>
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Lista de estudantes
            </p>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/40">
              {habilidade.estudantesIds.slice(0, 12).map((nome, i) => (
                <div key={`${nome}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                      {nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                    </span>
                    <span className="text-[13px]">{nome}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">#{i + 1}</Badge>
                </div>
              ))}
              {habilidade.estudantesIds.length > 12 && (
                <div className="px-3 py-2 text-[11px] text-muted-foreground text-center">
                  + {habilidade.estudantesIds.length - 12} estudantes
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="rounded-xl">
                Fechar
              </Button>
            </DialogClose>
            <Button size="sm" className="rounded-xl gap-1.5">
              <DownloadIcon /> Exportar lista
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
