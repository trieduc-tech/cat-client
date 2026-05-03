"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "./motion";
import { formatSaeb, thetaToSaeb } from "@/lib/saeb";

const D = 1.7;
function prob3pl(theta: number, a: number, b: number, c: number) {
  return c + (1 - c) / (1 + Math.exp(-D * a * (theta - b)));
}
function infoItem(theta: number, a: number, b: number, c: number) {
  const p = prob3pl(theta, a, b, c);
  const q = 1 - p;
  return D ** 2 * a ** 2 * (q / p) * ((p - c) ** 2 / (1 - c) ** 2);
}
function eapEstimate(responses: number[], params: { a: number; b: number; c: number }[]) {
  const n = 100;
  const pts = Array.from({ length: n }, (_, i) => -4 + (8 * i) / (n - 1));
  const w = pts.map((p) => Math.exp(-0.5 * p * p) / Math.sqrt(2 * Math.PI));
  const ws = w.reduce((a, b) => a + b, 0);
  w.forEach((_, i) => (w[i] /= ws));
  const ll = new Array(n).fill(0);
  for (let j = 0; j < responses.length; j++) {
    const { a, b, c } = params[j];
    for (let k = 0; k < n; k++) {
      let p = prob3pl(pts[k], a, b, c);
      p = Math.max(1e-10, Math.min(1 - 1e-10, p));
      ll[k] += responses[j] === 1 ? Math.log(p) : Math.log(1 - p);
    }
  }
  const post = ll.map((l, k) => Math.exp(l) * w[k]);
  const ps = post.reduce((a, b) => a + b, 0);
  post.forEach((_, i) => (post[i] /= ps));
  const theta = post.reduce((s, p, k) => s + pts[k] * p, 0);
  const se = Math.sqrt(post.reduce((s, p, k) => s + (pts[k] - theta) ** 2 * p, 0));
  return { theta, se };
}

interface DemoAlternativa {
  id: string;
  conteudo: string;
  ordem: number;
  correta: boolean;
}

interface DemoTextoBase {
  id: string;
  titulo?: string | null;
  conteudo?: string | null;
  referencia?: string | null;
}

interface DemoQuestion {
  id: string;
  codigo: string;
  conteudo: string;
  a: number;
  b: number;
  c: number;
  textosBase: DemoTextoBase[];
  alternativas: DemoAlternativa[];
}

interface Step { step: number; theta: number; se: number; correct: boolean; qIdx: number; }

const EASE = [0.32, 0.72, 0, 1] as const;
const MAX_STEPS = 8;
const chartConfig = { saeb: { label: "Proficiência SAEB", color: "var(--color-chart-1)" } } satisfies ChartConfig;

type Phase = "idle" | "question" | "calculating" | "result" | "done";

export function DemoSection() {
  const [questions, setQuestions] = useState<DemoQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [history, setHistory] = useState<Step[]>([]);
  const [usedQs, setUsedQs] = useState<Set<number>>(new Set());
  const [theta, setTheta] = useState(0);
  const [se, setSe] = useState<number | null>(null);
  const [curIdx, setCurIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/demo-questions.json")
      .then((r) => r.json())
      .then((data: DemoQuestion[]) => {
        setQuestions(data);
        setLoadingQuestions(false);
      })
      .catch(() => setLoadingQuestions(false));
  }, []);

  const selectNext = useCallback(
    (t: number, used: Set<number>, pool: DemoQuestion[]) => {
      let best = -1, bestI = -Infinity;
      pool.forEach((q, i) => {
        if (used.has(i)) return;
        const inf = infoItem(t, q.a, q.b, q.c);
        if (inf > bestI) { bestI = inf; best = i; }
      });
      return best;
    },
    []
  );

  const start = () => {
    if (!questions.length) return;
    setHistory([]); setUsedQs(new Set()); setTheta(0); setSe(null);
    setLastCorrect(null); setSelected(null);
    const first = questions.reduce(
      (bi, q, i) => Math.abs(q.b) < Math.abs(questions[bi].b) ? i : bi,
      0
    );
    setCurIdx(first);
    setPhase("question");
  };

  const submit = () => {
    if (curIdx === null || selected === null) return;
    const q = questions[curIdx];
    const correctAlt = q.alternativas.find((a) => a.correta);
    const correct = !!correctAlt && selected === correctAlt.id;
    setLastCorrect(correct);
    setPhase("calculating");

    const newUsed = new Set(usedQs); newUsed.add(curIdx);
    const responses = [...history.map((h) => (h.correct ? 1 : 0)), correct ? 1 : 0];
    const params = [...history.map((h) => questions[h.qIdx]), q];
    const { theta: nt, se: ns } = eapEstimate(responses, params.map((p) => ({ a: p.a, b: p.b, c: p.c })));
    const step = history.length + 1;
    const entry: Step = { step, theta: +nt.toFixed(3), se: +ns.toFixed(3), correct, qIdx: curIdx };

    setTimeout(() => {
      const nh = [...history, entry];
      setHistory(nh); setUsedQs(newUsed); setTheta(+nt.toFixed(3)); setSe(+ns.toFixed(3));
      setSelected(null);

      if (step >= MAX_STEPS || (step >= 5 && ns < 0.3) || newUsed.size >= questions.length) {
        setCurIdx(null); setPhase("done");
      } else {
        const next = selectNext(nt, newUsed, questions);
        setCurIdx(next); setPhase("result");
        setTimeout(() => setPhase("question"), 1600);
      }
    }, 1400);
  };

  const chartData = history.map((h) => ({
    step: h.step, saeb: Math.round(thetaToSaeb(h.theta)),
    upper: Math.round(thetaToSaeb(h.theta + h.se)), lower: Math.round(thetaToSaeb(h.theta - h.se)),
    correct: h.correct,
  }));

  const curQ = curIdx !== null ? questions[curIdx] : null;

  return (
    <section className="py-20 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.06] bg-foreground/[0.03] px-3.5 py-1.5 mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Interativo
              </span>
            </div>
            <h2 className="font-display tracking-[-0.03em]" style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}>
              Veja o CAT <span className="text-primary">em ação</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Responda questões reais e observe o algoritmo recalculando a proficiência em tempo real.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] overflow-hidden">
            <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="p-10 sm:p-14 text-center">
                  <div className="mx-auto max-w-sm space-y-5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-semibold">Simulação interativa do CAT</p>
                      <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                        Responda questões de Matemática (9º ano EF) e veja como o algoritmo adaptativo seleciona os itens e estima a proficiência.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                      <span>Banco SAEB · TRIEduc</span>
                      <span className="h-3 w-px bg-border" />
                      <span>Modelo 3PL</span>
                      <span className="h-3 w-px bg-border" />
                      <span>Estimação EAP</span>
                    </div>
                    <Button
                      onClick={start}
                      size="lg"
                      className="rounded-xl h-11 px-8 text-sm"
                      disabled={loadingQuestions || !questions.length}
                    >
                      {loadingQuestions ? "Carregando..." : "Iniciar Simulação"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {(phase === "question" || phase === "calculating" || phase === "result") && (
                <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                  {/* Stats bar */}
                  <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatPill label="Questão" value={`${history.length + (phase === "question" ? 1 : 0)} de ${MAX_STEPS}`} />
                      <StatPill label="Proficiência" value={`${formatSaeb(theta)} pts`} highlight />
                      {se != null && <StatPill label="Erro padrão" value={`±${Math.round(50 * se)} pts`} />}
                      <StatPill label="Acertos" value={`${history.filter((h) => h.correct).length}`} />
                      <div className="flex-1" />
                      <div className="flex gap-1">
                        {history.map((h, i) => (
                          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold ${h.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                            {h.correct ? "✓" : "✗"}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main: question left, chart right */}
                  <div className="grid lg:grid-cols-[1fr_1.1fr] gap-0">
                    {/* LEFT: Question */}
                    <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-foreground/[0.06] min-h-[320px] flex items-center">
                      <AnimatePresence mode="wait">
                        {phase === "question" && curQ && (
                          <motion.div key={`q-${curIdx}`} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}
                            transition={{ duration: 0.35, ease: EASE }} className="w-full space-y-5">
                            <div>
                              <Badge variant="secondary" className="text-[10px] mb-3">Questão {history.length + 1}</Badge>
                              {curQ.textosBase.map((tb) => (
                                <div key={tb.id} className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.03] p-3 mb-3">
                                  {tb.titulo && <p className="text-[12px] font-semibold mb-1.5">{tb.titulo}</p>}
                                  {tb.conteudo && (
                                    <div
                                      className="prose prose-sm dark:prose-invert max-w-none text-[13px] [&_p]:m-0 [&_img]:max-w-full [&_img]:rounded-md"
                                      dangerouslySetInnerHTML={{ __html: tb.conteudo }}
                                    />
                                  )}
                                  {tb.referencia && (
                                    <p className="text-[10px] text-muted-foreground mt-2">{tb.referencia}</p>
                                  )}
                                </div>
                              ))}
                              <div
                                className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed [&_img]:max-w-full [&_img]:rounded-md [&_p]:m-0 [&_p+p]:mt-2"
                                dangerouslySetInnerHTML={{ __html: curQ.conteudo }}
                              />
                            </div>

                            <div className="space-y-2">
                              {[...curQ.alternativas]
                                .sort((a, b) => a.ordem - b.ordem)
                                .map((alt, i) => (
                                  <button key={alt.id} type="button" onClick={() => setSelected(alt.id)}
                                    className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 transition-all duration-150 cursor-pointer ${
                                      selected === alt.id
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-foreground/[0.06] hover:border-foreground/10 hover:bg-foreground/[0.02]"
                                    }`}>
                                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                                      selected === alt.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}>
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <div
                                      className="text-sm leading-relaxed pt-0.5 [&_p]:m-0 [&_img]:max-w-full [&_img]:rounded-md"
                                      dangerouslySetInnerHTML={{ __html: alt.conteudo }}
                                    />
                                  </button>
                                ))}
                            </div>

                            <Button onClick={submit} disabled={selected === null} className="w-full rounded-xl h-11 text-sm font-medium">
                              Confirmar Resposta
                            </Button>
                          </motion.div>
                        )}

                        {phase === "calculating" && (
                          <motion.div key="calc" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="w-full text-center space-y-5 py-8">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${lastCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                              {lastCorrect ? "✓" : "✗"}
                            </motion.div>
                            <p className="text-sm font-medium">{lastCorrect ? "Resposta correta!" : "Resposta incorreta"}</p>
                            <div className="space-y-2 max-w-[200px] mx-auto">
                              {["Atualizando verossimilhança...", "Calculando posterior via EAP...", "Selecionando próximo item..."].map((t, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.35 }}
                                  className="flex items-center gap-2">
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.35 + 0.2 }}
                                    className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.35 + 0.4 }}
                                      className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  </motion.div>
                                  <span className="text-[12px] text-muted-foreground">{t}</span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {phase === "result" && (
                          <motion.div key="res" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="w-full text-center space-y-3 py-8">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Estimativa atualizada</p>
                            <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-display">
                              {formatSaeb(theta)} pontos
                            </motion.p>
                            <p className="text-[12px] text-muted-foreground">Erro padrão: ±{se != null ? Math.round(50 * se) : "—"} pts</p>
                            <p className="text-[11px] text-muted-foreground/60 animate-pulse">Carregando próxima questão...</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* RIGHT: Chart + stats */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Evolução da proficiência</p>
                          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Acerto</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Erro</span>
                          </div>
                        </div>
                        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
                          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                            <defs>
                              <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="step" tickLine={false} axisLine={false} fontSize={10} className="fill-muted-foreground" />
                            <YAxis domain={[100, 400]} tickLine={false} axisLine={false} fontSize={10} className="fill-muted-foreground" ticks={[100, 150, 200, 250, 300, 350, 400]} />
                            <ReferenceLine y={250} strokeDasharray="4 4" className="stroke-border" />
                            <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => { if (name === "saeb") return [`${value} pts`, "Proficiência SAEB"]; return null; }} hideIndicator />} />
                            <Area dataKey="upper" stroke="none" fill="var(--color-chart-1)" fillOpacity={0.06} type="monotone" dot={false} activeDot={false} tooltipType="none" />
                            <Area dataKey="lower" stroke="none" fill="var(--color-background)" fillOpacity={1} type="monotone" dot={false} activeDot={false} tooltipType="none" />
                            <Area dataKey="saeb" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#dg)" type="monotone"
                              dot={(props: any) => {
                                const { cx, cy, index } = props;
                                if (cx == null || cy == null) return <></>;
                                const e = chartData[index];
                                return <circle key={index} cx={cx} cy={cy} r={4} fill={e?.correct ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"} stroke="var(--color-background)" strokeWidth={2} />;
                              }}
                              isAnimationActive animationDuration={500}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>

                      {/* Item info */}
                      {curQ && phase === "question" && (
                        <motion.div key={`info-${curIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] p-4 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Parâmetros do item atual</p>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Discriminação</p>
                              <p className="text-sm font-mono font-semibold text-primary">a = {curQ.a.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Dificuldade</p>
                              <p className="text-sm font-mono font-semibold text-chart-2">b = {curQ.b >= 0 ? "+" : ""}{curQ.b.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Acerto ao acaso</p>
                              <p className="text-sm font-mono font-semibold text-destructive">c = {curQ.c.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="pt-1 text-[11px] text-muted-foreground">
                            Informação no nível atual: <span className="font-mono font-medium text-foreground">{infoItem(theta, curQ.a, curQ.b, curQ.c).toFixed(2)}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === "done" && (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-10">
                  <div className="mx-auto max-w-md space-y-6 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </motion.div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">Resultado da simulação</p>
                      <p className="text-4xl font-display">{formatSaeb(theta)} pontos</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] p-3">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Erro padrão</p>
                        <p className="text-sm font-mono font-semibold mt-0.5">±{se != null ? Math.round(50 * se) : "—"} pts</p>
                      </div>
                      <div className="rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] p-3">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Acertos</p>
                        <p className="text-sm font-mono font-semibold mt-0.5">{history.filter((h) => h.correct).length}/{history.length}</p>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      O algoritmo estimou a proficiência em <strong>{history.length} questões</strong> na
                      escala SAEB, usando seleção adaptativa por máxima informação de Fisher.
                    </p>
                    <Button onClick={start} variant="outline" className="rounded-xl h-10 px-6 text-sm">
                      Simular novamente
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] border ${
      highlight ? "border-primary/20 bg-primary/5" : "border-foreground/[0.06] bg-foreground/[0.02]"
    }`}>
      <span className="text-muted-foreground">{label}</span>
      <motion.span key={value} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }}
        className={`font-mono font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </motion.span>
    </div>
  );
}
