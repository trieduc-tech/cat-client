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
        maxItems: 20,
        seThreshold: 0.3,
      });
    }
  }, [hasFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Se não tem filtros, mostrar tela de seleção
  if (!hasFilters && !session) {
    return <SelectionScreen />;
  }

  // Loading
  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
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

  // Completado
  if (session.completed) {
    return <CompletedView session={session} history={history} correctCount={correctCount} router={router} />;
  }

  // Em andamento - split view
  return (
    <div className="min-h-svh">
      {/* Mobile: stacked / Desktop: split */}
      <div className="lg:flex lg:h-svh">
        {/* Painel esquerdo - stats e gráfico (sticky no desktop) */}
        <aside className="border-b border-border/60 bg-muted/20 px-4 py-5 lg:w-[400px] xl:w-[440px] lg:border-b-0 lg:border-r lg:overflow-y-auto lg:shrink-0 lg:py-8 lg:px-6">
          <div className="mx-auto max-w-2xl lg:max-w-none space-y-5">
            {/* Contexto */}
            {(disciplina || anoEscolar) && (
              <div className="flex flex-wrap gap-1.5">
                {disciplina && <Badge variant="secondary" className="text-[11px]">{disciplina}</Badge>}
                {anoEscolar && <Badge variant="secondary" className="text-[11px]">{anoEscolar}</Badge>}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <StatMini label="Proficiência" value={`${formatSaeb(session.theta)} pts`} />
              <StatMini label="Erro Padrão" value={session.se != null ? `±${Math.round(50 * session.se)} pts` : "—"} />
            </div>

            {/* Grafico */}
            {history.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold">Evolução</h2>
                <div className="rounded-xl border border-border/60 bg-card p-2.5">
                  <ThetaChart history={history} currentTheta={session.theta} />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Painel direito - questão (rolável) */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:py-8 lg:px-8 xl:px-12">
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
}: {
  session: NonNullable<ReturnType<typeof useCat>["session"]>;
  history: ReturnType<typeof useCat>["history"];
  correctCount: number;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="min-h-svh px-4 py-8 md:py-12">
      <div className="mx-auto max-w-xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Teste Concluído</h1>
          <p className="text-sm text-muted-foreground">{session.step} questões respondidas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Proficiência" value={`${formatSaeb(session.theta)} pts`} />
          <StatCard label="Erro Padrão" value={session.se != null ? `±${Math.round(50 * session.se)} pts` : "—"} />
          <StatCard label="Acertos" value={`${correctCount} / ${session.step}`} />
          <StatCard label="Taxa" value={`${session.step > 0 ? Math.round((correctCount / session.step) * 100) : 0}%`} />
        </div>

        {/* Grafico */}
        <div className="space-y-3">
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

        {/* Histórico */}
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
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">Iniciar Teste</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {anoDetectado
              ? "Selecione a disciplina para começar."
              : "Selecione a disciplina e a série para começar."}
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

            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Disciplina
              </label>
              <div className="grid grid-cols-2 gap-2">
                {disciplinasDisponiveis.map((f) => (
                  <button
                    key={f.disciplina}
                    type="button"
                    onClick={() => {
                      setSelectedDisciplina(selectedDisciplina === f.disciplina ? null : f.disciplina);
                      if (!anoDetectado) setSelectedAno(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer ${
                      selectedDisciplina === f.disciplina
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border/60 hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-sm font-medium">{f.disciplina}</span>
                  </button>
                ))}
                {disciplinasDisponiveis.length === 0 && (
                  <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
                    Nenhuma disciplina disponível para sua série.
                  </p>
                )}
              </div>
            </div>

            {selectedDisciplina && !anoDetectado && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

            <Button onClick={handleStart} disabled={!canStart} size="lg" className="w-full rounded-xl h-12 text-sm font-medium">
              Iniciar Teste
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
