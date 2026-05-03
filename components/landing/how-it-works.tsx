"use client";

import { FadeIn, Stagger, StaggerItem } from "./motion";

const steps = [
  {
    number: "01",
    title: "Theta Inicial",
    desc: "O teste começa assumindo proficiência média (θ = 0). A primeira questão é selecionada próxima a esse nível.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Resposta e Estimação",
    desc: "Após cada resposta, o algoritmo EAP recalcula a proficiência usando todos os dados acumulados via integração numérica.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008ZM12 10.5V6m0 0L9 9m3-3 3 3m-3 3v6m0 0-3-3m3 3 3-3" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Seleção Adaptativa",
    desc: "O próximo item é escolhido por máxima informação de Fisher no theta atual. O item que mais reduz a incerteza.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Critério de Parada",
    desc: "O teste encerra automaticamente quando o erro padrão da estimativa atinge o limiar de precisão definido.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.06] bg-foreground/[0.03] px-3.5 py-1.5 mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Metodologia
              </span>
            </div>
            <h2
              className="font-display tracking-[-0.03em]"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}
            >
              Como o teste <span className="text-primary">se adapta</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A cada resposta, o algoritmo refina a estimativa de proficiência e
              seleciona a questão mais informativa para o nível atual do aluno.
            </p>
          </div>
        </FadeIn>

        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
          {steps.map((step) => (
            <StaggerItem key={step.number}>
              <div className="group relative rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-6 h-full transition-all duration-500 hover:border-primary/20 hover:bg-primary/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                    {step.icon}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/50">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-2">{step.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
