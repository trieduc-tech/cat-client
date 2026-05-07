"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { catApi } from "@/lib/api";
import { useCat } from "@/hooks/use-cat";
import { useStudentTurmas } from "@/hooks/use-student-turma";
import { matchAnoInFilters, parseAno } from "@/lib/ano-escolar";
import { QuestionCard } from "@/components/cat/question-card";
import { ThetaChart } from "@/components/cat/theta-chart";
import { formatSaeb } from "@/lib/saeb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function TestePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      }
    >
      <TesteContent />
    </Suspense>
  );
}

function TesteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const disciplina = searchParams.get("disciplina");
  const anoEscolar = searchParams.get("ano");
  const view = (searchParams.get("view") ?? "aluno") as "aluno" | "gestor";
  const isGestor = view === "gestor";

  const {
    session,
    history,
    pendingFeedback,
    isStarting,
    isAnswering,
    error,
    startSession,
    submitAnswer,
    advanceToNext,
  } = useCat();

  const hasFilters = !!(disciplina && anoEscolar);

  useEffect(() => {
    if (hasFilters && !session && !isStarting && !error) {
      startSession({
        disciplina: disciplina ?? undefined,
        anoEscolar: anoEscolar ?? undefined,
        maxItems: 10,
        seThreshold: 0.3,
      });
    }
  }, [hasFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sem filtros, mostrar tela de seleção
  if (!hasFilters && !session) {
    return <SelectionScreen />;
  }

  // Loading inicial
  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center px-5 sm:px-6">
        {error ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline" className="rounded-xl">
              Voltar
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">Preparando teste...</p>
          </div>
        )}
      </div>
    );
  }

  const correctCount = history.filter((h) => h.correct).length;

  if (session.completed) {
    return (
      <CompletedView
        session={session}
        history={history}
        correctCount={correctCount}
        router={router}
        isGestor={isGestor}
      />
    );
  }

  const toggleView = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", isGestor ? "aluno" : "gestor");
    router.replace(`/teste?${params.toString()}`);
  };

  // Aluno: minimalist, single column, foco total nas questões
  if (!isGestor) {
    return (
      <div className="min-h-svh bg-background">
        <div className="mx-auto max-w-2xl px-5 sm:px-6 pt-5 pb-12 sm:pt-7">
          <div className="flex items-center justify-between mb-6">
            <Button
              type="button"
              onClick={() => router.push("/")}
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            >
              ← Sair
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] font-medium">
                {session.step + 1} / {session.totalSteps}
              </Badge>
              <button
                type="button"
                onClick={toggleView}
                title="Alternar para visão do gestor"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            </div>
          </div>

          {session.item && (
            <QuestionCard
              item={session.item}
              step={session.step}
              totalSteps={session.totalSteps}
              onSubmit={submitAnswer}
              loading={isAnswering}
              feedback={pendingFeedback}
              onFeedbackDone={advanceToNext}
            />
          )}
          {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  // Gestor: split view com gráfico e proficiência
  return (
    <div className="min-h-svh">
      <div className="lg:flex lg:h-svh">
        <aside className="border-b border-border/60 bg-muted/20 px-5 py-5 sm:px-6 lg:w-[400px] xl:w-[440px] lg:border-b-0 lg:border-r lg:overflow-y-auto lg:shrink-0 lg:py-8 lg:px-7">
          <div className="mx-auto max-w-2xl lg:max-w-none space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                onClick={() => router.push("/")}
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
              >
                ← Sair
              </Button>
              <div className="flex items-center gap-2">
                {(disciplina || anoEscolar) && (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {disciplina && <Badge variant="secondary" className="text-[11px]">{disciplina}</Badge>}
                    {anoEscolar && <Badge variant="secondary" className="text-[11px]">{anoEscolar}</Badge>}
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleView}
                  title="Alternar para visão do aluno"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border/60 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                </button>
              </div>
            </div>

            <StatMini label="Proficiência" value={`${formatSaeb(session.theta)} pts`} />

            {history.length > 0 && (
              <div className="hidden sm:block space-y-2">
                <h2 className="text-xs font-semibold">Evolução</h2>
                <div className="rounded-xl border border-border/60 bg-card p-2.5">
                  <ThetaChart history={history} currentTheta={session.theta} showSE={false} />
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 lg:py-8 lg:px-8 xl:px-12">
          <div className="mx-auto max-w-2xl lg:max-w-xl">
            {session.item && (
              <QuestionCard
                item={session.item}
                step={session.step}
                totalSteps={session.totalSteps}
                onSubmit={submitAnswer}
                loading={isAnswering}
                feedback={pendingFeedback}
                onFeedbackDone={advanceToNext}
              />
            )}
            {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
          </div>
        </main>
      </div>
    </div>
  );
}

function CompletedView({
  session,
  history,
  correctCount,
  router,
  isGestor,
}: {
  session: NonNullable<ReturnType<typeof useCat>["session"]>;
  history: ReturnType<typeof useCat>["history"];
  correctCount: number;
  router: ReturnType<typeof useRouter>;
  isGestor: boolean;
}) {
  return (
    <div className="min-h-svh px-5 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Teste Concluído</h1>
          <p className="text-sm text-muted-foreground">{session.step} questões respondidas</p>
        </div>

        {isGestor ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Proficiência" value={`${formatSaeb(session.theta)} pts`} />
              <StatCard label="Acertos" value={`${correctCount} / ${session.step}`} />
              <StatCard label="Taxa" value={`${session.step > 0 ? Math.round((correctCount / session.step) * 100) : 0}%`} />
            </div>

            <div className="hidden sm:block space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Evolução</h2>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Acerto
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    Erro
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 md:p-4">
                <ThetaChart history={history} currentTheta={session.theta} showSE={true} />
              </div>
            </div>

            <Separator />

            {history.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Respostas</h2>
                <div className="flex flex-wrap gap-1.5">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center font-medium ${
                        h.correct
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                      title={`Questão ${h.step}: ${formatSaeb(h.theta)} pts`}
                    >
                      {h.step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Resultado
            </p>
            <p className="text-2xl font-semibold">
              {correctCount} de {session.step} acertos
            </p>
            <p className="text-sm text-muted-foreground">
              Sua resposta foi registrada. Bom trabalho!
            </p>
          </div>
        )}

        <Button onClick={() => router.push("/")} className="w-full rounded-xl h-12 text-sm font-medium">
          Novo Teste
        </Button>
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-base font-semibold font-mono tracking-tight mt-0.5">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 md:p-4 space-y-1">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg md:text-xl font-semibold font-mono tracking-tight">{value}</p>
    </div>
  );
}

function DisciplinaIcon({ name, className }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("portugues") || lower.includes("língua") || lower.includes("lingua")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }
  if (lower.includes("matem")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h.008v.008H8.25V8.25Zm3.75 0h.008v.008H12V8.25Zm3.75 0h.008v.008h-.008V8.25Zm-7.5 3.75h.008v.008H8.25V12Zm3.75 0h.008v.008H12V12Zm3.75 0h.008v.008h-.008V12Z" />
      </svg>
    );
  }
  if (lower.includes("ciência") || lower.includes("ciencia") || lower.includes("biolog") || lower.includes("físic") || lower.includes("fisic") || lower.includes("quím") || lower.includes("quim")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    );
  }
  if (lower.includes("histó") || lower.includes("histo")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  if (lower.includes("geo")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function SelectionScreen() {
  const router = useRouter();
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
  const [selectedAno, setSelectedAno] = useState<string | null>(null);

  const { data: filters, isLoading } = useQuery({
    queryKey: ["cat-filters"],
    queryFn: () => catApi.getFilters(),
  });

  const { data: turmas } = useStudentTurmas();

  const { anoDetectado, turmaNome } = useMemo(() => {
    if (!turmas?.length) {
      return { anoDetectado: null as string | null, turmaNome: null as string | null };
    }
    const firstTurma = turmas[0]?.Nome ?? null;
    if (!filters?.length) {
      return { anoDetectado: null, turmaNome: firstTurma };
    }
    const anosDisponiveis = Array.from(
      new Set(filters.flatMap((f) => f.anos))
    );
    for (const turma of turmas) {
      const parsed = parseAno(turma.Nome);
      if (!parsed) continue;
      const match = matchAnoInFilters(parsed, anosDisponiveis);
      if (match) return { anoDetectado: match, turmaNome: turma.Nome };
    }
    return { anoDetectado: null, turmaNome: firstTurma };
  }, [turmas, filters]);

  useEffect(() => {
    if (anoDetectado && !selectedAno) {
      setSelectedAno(anoDetectado);
    }
  }, [anoDetectado, selectedAno]);

  const selectedFilter = filters?.find((f) => f.disciplina === selectedDisciplina);
  const anos = selectedFilter?.anos ?? [];

  const disciplinasDisponiveis = useMemo(() => {
    if (!filters) return [];
    const allowed = new Set(["Língua Portuguesa", "Matemática"]);
    const onlyAllowed = filters.filter((f) => allowed.has(f.disciplina));
    if (!anoDetectado) return onlyAllowed;
    return onlyAllowed.filter((f) => f.anos.includes(anoDetectado));
  }, [filters, anoDetectado]);

  const canStart = selectedDisciplina && selectedAno;

  const sortedAnos = [...anos].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, "")) || 0;
    const nb = parseInt(b.replace(/\D/g, "")) || 0;
    return na - nb;
  });

  const handleStart = () => {
    if (!canStart) return;
    const params = new URLSearchParams({ disciplina: selectedDisciplina, ano: selectedAno });
    router.push(`/teste?${params.toString()}`);
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-5 py-12 sm:px-6">
      {/* Sair top-left */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
        <Button
          type="button"
          onClick={() => router.push("/")}
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg"
        >
          ← Sair
        </Button>
      </div>

      {/* subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-xl space-y-10">
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.03em]">
            Iniciar <span className="text-primary">Teste</span>
          </h1>
          <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {anoDetectado
              ? "Escolha a disciplina para começar."
              : "Escolha a disciplina e a série para começar."}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : (
          <>
            {(anoDetectado || turmaNome) && (
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {anoDetectado ? "Sua série" : "Sua turma"}
                </span>
                {anoDetectado && (
                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                    {anoDetectado}
                  </Badge>
                )}
                {turmaNome && (
                  <span className="text-[11px] text-muted-foreground">
                    {anoDetectado ? "· " : ""}{turmaNome}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Disciplina
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {disciplinasDisponiveis.map((f) => {
                  const isSelected = selectedDisciplina === f.disciplina;
                  return (
                    <button
                      key={f.disciplina}
                      type="button"
                      onClick={() => {
                        setSelectedDisciplina(isSelected ? null : f.disciplina);
                        if (!anoDetectado) setSelectedAno(null);
                      }}
                      className={`group relative overflow-hidden rounded-2xl border p-5 sm:p-6 text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20 shadow-sm"
                          : "border-border/60 hover:border-border hover:bg-muted/30 hover:-translate-y-0.5 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                            isSelected
                              ? "bg-primary/15 text-primary"
                              : "bg-muted/60 text-foreground/70 group-hover:bg-muted"
                          }`}
                        >
                          <DisciplinaIcon name={f.disciplina} className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold tracking-tight">
                            {f.disciplina}
                          </p>
                          <p className="text-[11.5px] text-muted-foreground mt-0.5">
                            {f.total} {f.total === 1 ? "item" : "itens"} disponíveis
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {disciplinasDisponiveis.length === 0 && (
                  <p className="col-span-full text-center text-sm text-muted-foreground py-4">
                    Nenhuma disciplina disponível para sua série.
                  </p>
                )}
              </div>
            </div>

            {selectedDisciplina && !anoDetectado && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Série / Ano
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortedAnos.map((ano) => (
                    <button
                      key={ano}
                      type="button"
                      onClick={() => setSelectedAno(selectedAno === ano ? null : ano)}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                        selectedAno === ano
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/60 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      {ano}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="lg"
              className="w-full rounded-2xl h-13 text-sm font-medium shadow-sm"
            >
              Iniciar Teste
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
