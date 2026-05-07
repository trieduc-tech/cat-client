"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Item, PreviousAnswer } from "@/lib/types";

interface QuestionCardProps {
  item: Item;
  step: number;
  totalSteps: number;
  onSubmit: (alternativaId: string) => void;
  loading: boolean;
  feedback: PreviousAnswer | null;
  onFeedbackDone: () => void;
}

const MIN_SHIMMER_MS = 700;

export function QuestionCard({
  item,
  onSubmit,
  loading,
  feedback,
  onFeedbackDone,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [item.id]);

  // Espera ao menos MIN_SHIMMER_MS antes de avançar para suavizar a transição
  useEffect(() => {
    if (submitted && feedback) {
      const timer = setTimeout(() => onFeedbackDone(), MIN_SHIMMER_MS);
      return () => clearTimeout(timer);
    }
  }, [submitted, feedback, onFeedbackDone]);

  const handleSubmit = () => {
    if (selected) {
      setSubmitted(true);
      onSubmit(selected);
    }
  };

  if (submitted) {
    return <ThinkingShimmer />;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {item.textosBase.map((tb) => (
        <div
          key={tb.id}
          className="rounded-2xl border border-border/60 bg-muted/30 p-4 md:p-5"
        >
          {tb.titulo && (
            <p className="text-sm font-semibold mb-2">{tb.titulo}</p>
          )}
          {tb.conteudo && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&_img]:max-w-full [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: tb.conteudo }}
            />
          )}
          {tb.referencia && (
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              {tb.referencia}
            </p>
          )}
        </div>
      ))}

      <div
        className="text-[15px] leading-relaxed [&_p]:m-0 [&_p+p]:mt-3"
        dangerouslySetInnerHTML={{ __html: item.conteudo }}
      />

      <div className="space-y-2">
        {item.alternativas
          .sort((a, b) => a.ordem - b.ordem)
          .map((alt, idx) => {
            const isSelected = selected === alt.id;
            return (
              <button
                key={alt.id}
                type="button"
                onClick={() => setSelected(alt.id)}
                className={`
                  w-full text-left flex items-start gap-3 rounded-2xl border p-3.5 md:p-4
                  transition-all duration-200 cursor-pointer
                  ${
                    isSelected
                      ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  }
                `}
              >
                <span
                  className={`
                    shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold
                    transition-colors duration-200
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <div
                  className="text-sm leading-relaxed pt-0.5 [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: alt.conteudo }}
                />
              </button>
            );
          })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selected || loading}
        size="lg"
        className="w-full rounded-2xl h-13 text-sm font-medium shadow-sm"
      >
        Confirmar Resposta
      </Button>
    </div>
  );
}

function ThinkingShimmer() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Texto base placeholder */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 md:p-5 space-y-2.5">
        <div className="shimmer h-3.5 w-2/5 rounded-md" />
        <div className="shimmer h-3 w-full rounded-md" />
        <div className="shimmer h-3 w-[92%] rounded-md" />
        <div className="shimmer h-3 w-3/4 rounded-md" />
      </div>

      {/* Enunciado placeholder */}
      <div className="space-y-2.5">
        <div className="shimmer h-3.5 w-[88%] rounded-md" />
        <div className="shimmer h-3.5 w-[78%] rounded-md" />
      </div>

      {/* Alternativas placeholder */}
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border/60 p-3.5 md:p-4"
          >
            <span className="shrink-0 w-7 h-7 rounded-lg shimmer" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-3 w-[85%] rounded-md" />
              {i % 2 === 0 && <div className="shimmer h-3 w-[55%] rounded-md" />}
            </div>
          </div>
        ))}
      </div>

      {/* Pensando indicator */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2.5 pt-2"
      >
        <span className="inline-flex items-end gap-1 h-3">
          <span
            className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: "180ms" }}
          />
          <span
            className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: "360ms" }}
          />
        </span>
        <span className="text-[12px] font-medium text-muted-foreground">
          Calculando próxima questão...
        </span>
      </div>
    </div>
  );
}
