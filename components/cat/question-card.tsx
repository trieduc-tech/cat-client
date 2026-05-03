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

export function QuestionCard({
  item,
  onSubmit,
  loading,
  feedback,
  onFeedbackDone,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Reseta estado quando muda o item
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [item.id]);

  // Avança automaticamente assim que a resposta da API chega
  useEffect(() => {
    if (submitted && feedback) {
      onFeedbackDone();
    }
  }, [submitted, feedback, onFeedbackDone]);

  const handleSubmit = () => {
    if (selected) {
      setSubmitted(true);
      onSubmit(selected);
    }
  };

  return (
    <div className="space-y-5">
      {/* Textos base */}
      {item.textosBase.map((tb) => (
        <div
          key={tb.id}
          className="rounded-xl border border-border/60 bg-muted/30 p-4 md:p-5"
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

      {/* Enunciado */}
      <div
        className="text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: item.conteudo }}
      />

      {/* Alternativas */}
      <div className="space-y-2">
        {item.alternativas
          .sort((a, b) => a.ordem - b.ordem)
          .map((alt, idx) => {
            const isSelected = selected === alt.id;
            const isDisabled = submitted;
            return (
              <button
                key={alt.id}
                type="button"
                onClick={() => !isDisabled && setSelected(alt.id)}
                disabled={isDisabled}
                className={`
                  w-full text-left flex items-start gap-3 rounded-xl border p-3.5 md:p-4
                  transition-all duration-200
                  ${isDisabled ? "cursor-default" : "cursor-pointer"}
                  ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  }
                  ${isDisabled && !isSelected ? "opacity-50" : ""}
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
        disabled={!selected || loading || submitted}
        size="lg"
        className="w-full rounded-xl h-12 text-sm font-medium"
      >
        {loading || submitted ? "Enviando..." : "Confirmar Resposta"}
      </Button>
    </div>
  );
}
