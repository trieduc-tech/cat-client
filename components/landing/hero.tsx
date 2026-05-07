"use client";

import Link from "next/link";
import { FadeIn } from "./motion";
import { Button } from "@/components/ui/button";
import { ItemCurveHero } from "./item-curve-hero";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-primary/[0.05] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 pt-28 pb-16 sm:pt-40 sm:pb-24 md:pt-44 md:pb-32">
        <div className="flex flex-col items-center text-center">
          <FadeIn delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.06] bg-foreground/[0.03] px-3.5 py-1.5 mb-7 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Avaliação Inteligente
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1
              className="font-display tracking-[-0.045em] leading-[0.9]"
              style={{ fontSize: "clamp(6rem, 26vw, 14rem)" }}
            >
              <span className="bg-gradient-to-br from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                CAT
              </span>
            </h1>
            <p
              className="mt-5 sm:mt-6 font-semibold uppercase text-foreground/80"
              style={{
                fontSize: "clamp(0.85rem, 2.4vw, 1.25rem)",
                letterSpacing: "0.18em",
              }}
            >
              Teste Adaptativo Computadorizado
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-7 sm:mt-8 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Cada questão se adapta ao aluno em tempo real. Avaliação precisa
              em uma fração das questões.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-9 sm:mt-10 flex justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-2xl h-13 px-8 text-sm font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Link href="/teste">Iniciar Teste</Link>
              </Button>
            </div>
          </FadeIn>

          {/* Interactive ICC curve */}
          <FadeIn direction="up" delay={0.4} className="hidden lg:block w-full max-w-[420px] mt-16">
            <ItemCurveHero />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
