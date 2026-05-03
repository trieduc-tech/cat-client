/**
 * Mock data para a área do gestor.
 *
 * Gera dados determinísticos via PRNG seeded — assim a mesma combinação
 * de filtros sempre devolve os mesmos números, mas combinações diferentes
 * resultam em distribuições diferentes (sensação de "filtro funciona").
 */

export const DRES = ["DRE Norte", "DRE Sul", "DRE Centro"] as const;
export const ESCOLAS_POR_DRE: Record<(typeof DRES)[number], string[]> = {
  "DRE Norte": ["EMEF Castro Alves", "EMEF Paulo Freire", "EMEF Tarsila do Amaral"],
  "DRE Sul": ["EMEF Cecília Meireles", "EMEF Anita Malfatti", "EMEF Drummond"],
  "DRE Centro": ["EMEF Machado de Assis", "EMEF Clarice Lispector", "EMEF Guimarães Rosa"],
};
export const TODAS_ESCOLAS = Object.values(ESCOLAS_POR_DRE).flat();

export const DISCIPLINAS = ["Língua Portuguesa", "Matemática"] as const;
export type Disciplina = (typeof DISCIPLINAS)[number];

export const ANOS_ESCOLARES = ["6º ano", "7º ano", "8º ano", "9º ano"] as const;
export type AnoEscolar = (typeof ANOS_ESCOLARES)[number];

// 2 turmas por escola, disciplina e ano — aqui usamos só A/B para simplicidade
export const TURMAS = ["A", "B"] as const;

export const APLICACOES = ["Março", "Maio", "Julho", "Setembro", "Novembro"] as const;
export type Aplicacao = (typeof APLICACOES)[number];

export const ANOS_HISTORICO = ["2022", "2023", "2024", "2025"] as const;

export const NIVEIS = [
  "Abaixo do básico",
  "Básico",
  "Proficiente",
  "Avançado",
] as const;
export type Nivel = (typeof NIVEIS)[number];

export const NIVEL_COLORS: Record<Nivel, string> = {
  "Abaixo do básico": "hsl(0 78% 58%)",
  "Básico": "hsl(32 95% 60%)",
  "Proficiente": "hsl(48 96% 60%)",
  "Avançado": "hsl(142 71% 45%)",
};

// Faixas SAEB por nível (Matemática 9EF como referência — usado como aproximação)
const NIVEL_RANGES: Record<Nivel, [number, number]> = {
  "Abaixo do básico": [0, 200],
  "Básico": [200, 275],
  "Proficiente": [275, 350],
  "Avançado": [350, 500],
};

export function nivelDeProficiencia(saeb: number): Nivel {
  for (const nivel of NIVEIS) {
    const [lo, hi] = NIVEL_RANGES[nivel];
    if (saeb >= lo && saeb < hi) return nivel;
  }
  return "Avançado";
}

// PRNG mulberry32
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 16777619;
  }
  return h >>> 0;
}

// Distribuição normal aproximada via box-muller
function gauss(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

export interface GestorFilters {
  dre: string | "all";
  escola: string | "all";
  disciplina: Disciplina | "all";
  ano: AnoEscolar | "all";
  turma: string | "all";
  aplicacao: Aplicacao | "all";
}

export const DEFAULT_FILTERS: GestorFilters = {
  dre: "all",
  escola: "all",
  disciplina: "all",
  ano: "all",
  turma: "all",
  aplicacao: "all",
};

export function escolasFiltradasPorDre(dre: string): string[] {
  if (dre === "all") return TODAS_ESCOLAS;
  return ESCOLAS_POR_DRE[dre as keyof typeof ESCOLAS_POR_DRE] ?? [];
}

// Valores médios base (ligeiramente diferentes para LP/MT) — modulados pelos filtros
function mediaBase(filters: GestorFilters, disciplina: Disciplina): number {
  const seed = hashStr(
    `${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}|${filters.aplicacao}|${disciplina}`
  );
  const rng = mulberry32(seed);

  // base por disciplina
  let base = disciplina === "Matemática" ? 252 : 268;

  // ajustes por filtro (cada filtro empurra para um lado)
  if (filters.dre === "DRE Norte") base += 8;
  if (filters.dre === "DRE Sul") base -= 6;
  if (filters.dre === "DRE Centro") base += 2;

  if (filters.ano === "6º ano") base -= 18;
  if (filters.ano === "7º ano") base -= 6;
  if (filters.ano === "8º ano") base += 6;
  if (filters.ano === "9º ano") base += 18;

  if (filters.turma === "A") base += 4;
  if (filters.turma === "B") base -= 4;

  // pequena variação determinística
  base += (rng() - 0.5) * 18;

  return Math.round(base);
}

export interface QuantitativoCard {
  inscritos: number;
  participantes_lp: number;
  participantes_mt: number;
  participacao_lp_pct: number;
  participacao_mt_pct: number;
}

export function getQuantitativo(filters: GestorFilters): QuantitativoCard {
  const seed = hashStr(`qt:${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}|${filters.aplicacao}`);
  const rng = mulberry32(seed);

  // escala baseada em quanto filtro foi aplicado
  let base = 800;
  if (filters.dre !== "all") base = Math.round(base / 3);
  if (filters.escola !== "all") base = Math.round(base / 3);
  if (filters.ano !== "all") base = Math.round(base / 4);
  if (filters.turma !== "all") base = Math.round(base / 2);

  base = Math.max(28, base);

  const inscritos = base + Math.floor(rng() * 30) - 15;
  const partLP = Math.round(inscritos * (0.88 + rng() * 0.1));
  const partMT = Math.round(inscritos * (0.84 + rng() * 0.1));

  return {
    inscritos,
    participantes_lp: partLP,
    participantes_mt: partMT,
    participacao_lp_pct: Math.round((partLP / inscritos) * 100),
    participacao_mt_pct: Math.round((partMT / inscritos) * 100),
  };
}

export interface MediasProficiencia {
  geral: number;
  lp: number;
  mt: number;
  trieduc_geral: number;
  trieduc_lp: number;
  trieduc_mt: number;
}

export function getMediasProficiencia(filters: GestorFilters): MediasProficiencia {
  const lp = mediaBase(filters, "Língua Portuguesa");
  const mt = mediaBase(filters, "Matemática");
  return {
    geral: Math.round((lp + mt) / 2),
    lp,
    mt,
    trieduc_geral: 258,
    trieduc_lp: 264,
    trieduc_mt: 252,
  };
}

export interface ProficienciaExtremos {
  disciplina: Disciplina;
  maior: number;
  menor: number;
  alunoMaior: string;
  alunoMenor: string;
}

const NOMES = [
  "Adriana Santos", "Marcelo Borges", "Beatriz Ferreira", "Carlos Mendes",
  "Daniela Costa", "Eduardo Lima", "Fernanda Rocha", "Gabriel Souza",
  "Helena Martins", "Igor Pereira", "Júlia Almeida", "Kauan Ribeiro",
  "Laura Carvalho", "Mateus Oliveira", "Natália Dias", "Otávio Castro",
  "Paula Nogueira", "Rafael Cardoso", "Sofia Barbosa", "Tiago Moreira",
  "Vitória Pinto", "Yuri Fonseca", "Zoe Vieira", "Bruno Cunha",
  "Camila Gomes", "Diego Araújo", "Elisa Faria", "Felipe Andrade",
];

export function getExtremos(filters: GestorFilters): ProficienciaExtremos[] {
  const out: ProficienciaExtremos[] = [];
  for (const disc of DISCIPLINAS) {
    const media = mediaBase(filters, disc);
    const seed = hashStr(`ext:${disc}|${filters.dre}|${filters.escola}|${filters.ano}`);
    const rng = mulberry32(seed);
    const maior = Math.min(420, Math.round(media + 60 + rng() * 30));
    const menor = Math.max(110, Math.round(media - 70 - rng() * 30));
    out.push({
      disciplina: disc,
      maior,
      menor,
      alunoMaior: NOMES[Math.floor(rng() * NOMES.length)],
      alunoMenor: NOMES[Math.floor(rng() * NOMES.length)],
    });
  }
  return out;
}

export interface DistribuicaoNivel {
  nivel: Nivel;
  alunos: number;
  percentual: number;
}

export function getDistribuicaoNiveis(
  filters: GestorFilters,
  disciplina: Disciplina,
  totalAlunos?: number
): DistribuicaoNivel[] {
  const media = mediaBase(filters, disciplina);
  const total = totalAlunos ?? Math.max(40, Math.min(160, Math.round(120 - (media - 250) * 0.1)));
  const seed = hashStr(`dist:${disciplina}|${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}|${filters.aplicacao}`);
  const rng = mulberry32(seed);

  // simula 'total' alunos numa normal centrada em 'media'
  const counts: Record<Nivel, number> = {
    "Abaixo do básico": 0,
    "Básico": 0,
    "Proficiente": 0,
    "Avançado": 0,
  };
  for (let i = 0; i < total; i++) {
    const score = gauss(rng, media, 50);
    counts[nivelDeProficiencia(Math.max(60, Math.min(450, score)))]++;
  }

  return NIVEIS.map((nivel) => ({
    nivel,
    alunos: counts[nivel],
    percentual: Math.round((counts[nivel] / total) * 1000) / 10,
  }));
}

export interface HistogramaBin {
  bin: string;
  binStart: number;
  alunos: number;
  trieducPct: number;
}

export function getHistogramaSAEB(
  filters: GestorFilters,
  disciplina: Disciplina
): HistogramaBin[] {
  const media = mediaBase(filters, disciplina);
  const seed = hashStr(`hist:${disciplina}|${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}|${filters.aplicacao}`);
  const rng = mulberry32(seed);
  const total = 200;

  const bins = Array.from({ length: 10 }, (_, i) => i * 50); // 0,50,100,...,450
  const counts = new Array(bins.length).fill(0);
  for (let i = 0; i < total; i++) {
    const score = gauss(rng, media, 55);
    const clamped = Math.max(0, Math.min(499, score));
    const idx = Math.min(bins.length - 1, Math.floor(clamped / 50));
    counts[idx]++;
  }

  // referência TRIEduc (curva fixa)
  const trieducCounts = bins.map((_, i) => {
    const center = i * 50 + 25;
    const z = (center - 250) / 60;
    return Math.exp(-0.5 * z * z) * 100;
  });
  const trieducSum = trieducCounts.reduce((a, b) => a + b, 0);

  return bins.map((b, i) => ({
    bin: `${b}-${b + 50}`,
    binStart: b,
    alunos: Math.round((counts[i] / total) * 1000) / 10, // %
    trieducPct: Math.round((trieducCounts[i] / trieducSum) * 1000) / 10,
  }));
}

export interface ProvaPoint {
  prova: string;
  media: number;
}

export function getEvolucaoPorProva(filters: GestorFilters): ProvaPoint[] {
  const disc = (filters.disciplina === "all" ? "Matemática" : filters.disciplina) as Disciplina;
  const seed = hashStr(`evo:${disc}|${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}`);
  const rng = mulberry32(seed);
  const start = mediaBase(filters, disc) - 25;
  const slope = 4 + rng() * 6;
  return APLICACOES.map((apl, i) => ({
    prova: `Aplicação ${i + 1} · ${apl}`,
    media: Math.round(start + slope * i + (rng() - 0.5) * 12),
  }));
}

export interface ComparacaoBar {
  categoria: string;
  "Abaixo do básico": number;
  "Básico": number;
  "Proficiente": number;
  "Avançado": number;
}

export function getComparacoesPorAno(filters: GestorFilters): ComparacaoBar[] {
  const disc = (filters.disciplina === "all" ? "Matemática" : filters.disciplina) as Disciplina;
  return ANOS_ESCOLARES.map((ano) => {
    const dist = getDistribuicaoNiveis({ ...filters, ano }, disc);
    const map = Object.fromEntries(dist.map((d) => [d.nivel, d.percentual]));
    return {
      categoria: ano,
      "Abaixo do básico": map["Abaixo do básico"] ?? 0,
      "Básico": map["Básico"] ?? 0,
      "Proficiente": map["Proficiente"] ?? 0,
      "Avançado": map["Avançado"] ?? 0,
    };
  });
}

export function getEvolucaoStackedPorProva(filters: GestorFilters): ComparacaoBar[] {
  const disc = (filters.disciplina === "all" ? "Matemática" : filters.disciplina) as Disciplina;
  return APLICACOES.map((apl, i) => {
    const subFilters: GestorFilters = { ...filters, aplicacao: apl };
    const dist = getDistribuicaoNiveis(subFilters, disc);
    const map = Object.fromEntries(dist.map((d) => [d.nivel, d.percentual]));
    return {
      categoria: `Aplicação ${i + 1}`,
      "Abaixo do básico": map["Abaixo do básico"] ?? 0,
      "Básico": map["Básico"] ?? 0,
      "Proficiente": map["Proficiente"] ?? 0,
      "Avançado": map["Avançado"] ?? 0,
    };
  });
}

export function getHistoricoPorAno(
  filters: GestorFilters,
  anoAlvo: AnoEscolar,
  anos: readonly string[] = ANOS_HISTORICO
): ComparacaoBar[] {
  const disc = (filters.disciplina === "all" ? "Matemática" : filters.disciplina) as Disciplina;
  const baseSeed = hashStr(`hist-tempo:${disc}|${anoAlvo}|${filters.dre}|${filters.escola}`);
  return anos.map((y, i) => {
    // tendência de melhora ao longo do tempo
    const fakeFilters: GestorFilters = { ...filters, ano: anoAlvo };
    const dist = getDistribuicaoNiveis(fakeFilters, disc);
    // melhora gradual com o tempo
    const factor = 1 + (i - (anos.length - 1) / 2) * 0.18;
    const map = Object.fromEntries(dist.map((d) => [d.nivel, d.percentual]));
    let av = (map["Avançado"] ?? 0) * factor;
    let pr = (map["Proficiente"] ?? 0) * (1 + (i - (anos.length - 1) / 2) * 0.05);
    let ba = (map["Básico"] ?? 0) * (1 - (i - (anos.length - 1) / 2) * 0.06);
    let ab = (map["Abaixo do básico"] ?? 0) * (1 - (i - (anos.length - 1) / 2) * 0.18);
    const sum = av + pr + ba + ab || 1;
    av = (av / sum) * 100;
    pr = (pr / sum) * 100;
    ba = (ba / sum) * 100;
    ab = (ab / sum) * 100;
    return {
      categoria: `${anoAlvo} · ${y}`,
      "Abaixo do básico": Math.round(ab * 10) / 10,
      "Básico": Math.round(ba * 10) / 10,
      "Proficiente": Math.round(pr * 10) / 10,
      "Avançado": Math.round(av * 10) / 10,
    };
  });
}

// --- Habilidades / prioridade de estudos ---
export interface Habilidade {
  codigo: string;
  descricao: string;
  unidadeTematica: string;
  disciplina: Disciplina;
  ano: AnoEscolar;
  percentualAcerto: number;
  estudantesAfetados: number;
  estudantesIds: string[];
}

const HABILIDADES_MT_9: Omit<Habilidade, "percentualAcerto" | "estudantesAfetados" | "estudantesIds">[] = [
  { codigo: "9A1.1", descricao: "Resolver uma equação polinomial de 1º grau.", unidadeTematica: "Álgebra", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9A1.3", descricao: "Identificar uma representação algébrica para o padrão ou a regularidade de uma sequência de números racionais.", unidadeTematica: "Álgebra", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9A1.4", descricao: "Identificar representações algébricas equivalentes.", unidadeTematica: "Álgebra", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9A1.5", descricao: "Associar uma equação polinomial de 1º grau com duas variáveis a uma reta no plano cartesiano.", unidadeTematica: "Geometria analítica", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9A1.6", descricao: "Inferir uma equação polinomial de 2º grau que modela um problema.", unidadeTematica: "Álgebra", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9A1.7", descricao: "Resolver uma equação polinomial de 2º grau.", unidadeTematica: "Álgebra", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9G2.1", descricao: "Calcular a área de figuras planas.", unidadeTematica: "Geometria", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9G2.4", descricao: "Aplicar o Teorema de Pitágoras na resolução de problemas.", unidadeTematica: "Geometria", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9N3.2", descricao: "Operar com números racionais em situações-problema.", unidadeTematica: "Números", disciplina: "Matemática", ano: "9º ano" },
  { codigo: "9P4.1", descricao: "Calcular a probabilidade de eventos simples.", unidadeTematica: "Probabilidade", disciplina: "Matemática", ano: "9º ano" },
];

const HABILIDADES_LP_9: Omit<Habilidade, "percentualAcerto" | "estudantesAfetados" | "estudantesIds">[] = [
  { codigo: "9L1.1", descricao: "Identificar a tese de um texto argumentativo.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L1.4", descricao: "Inferir o sentido de uma palavra ou expressão pelo contexto.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L2.2", descricao: "Reconhecer relações de causa e consequência entre partes do texto.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L3.1", descricao: "Identificar elementos coesivos do texto.", unidadeTematica: "Análise linguística", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L3.5", descricao: "Distinguir fato de opinião em diferentes gêneros.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L4.2", descricao: "Identificar marcas linguísticas que evidenciam o ponto de vista do narrador.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L5.1", descricao: "Reconhecer figuras de linguagem em textos literários.", unidadeTematica: "Análise linguística", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L6.3", descricao: "Identificar a função de elementos paratextuais.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L7.1", descricao: "Reconhecer a intencionalidade discursiva em textos publicitários.", unidadeTematica: "Leitura", disciplina: "Língua Portuguesa", ano: "9º ano" },
  { codigo: "9L8.2", descricao: "Empregar adequadamente a concordância verbal.", unidadeTematica: "Análise linguística", disciplina: "Língua Portuguesa", ano: "9º ano" },
];

export function getHabilidades(
  filters: GestorFilters,
  disciplina: Disciplina
): Habilidade[] {
  const base = disciplina === "Matemática" ? HABILIDADES_MT_9 : HABILIDADES_LP_9;
  const seed = hashStr(`hab:${disciplina}|${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}|${filters.aplicacao}`);
  const rng = mulberry32(seed);

  return base
    .map((h) => {
      const pct = Math.round(8 + rng() * 87);
      const afetados = Math.round(6 + rng() * 24);
      const ids = Array.from({ length: afetados }, (_, i) => NOMES[(Math.floor(rng() * NOMES.length) + i) % NOMES.length]);
      return {
        ...h,
        percentualAcerto: pct,
        estudantesAfetados: afetados,
        estudantesIds: ids,
      };
    })
    .sort((a, b) => a.percentualAcerto - b.percentualAcerto);
}

// --- Ranking de proficiência por estudante ---
export interface EstudanteRanking {
  rankingTrieduc: number;
  rankingEscola: number;
  nome: string;
  login: string;
  escola: string;
  turma: string;
  lc: number;
  mt: number;
  mediaGeral: number;
}

export function getRankingEstudantes(filters: GestorFilters): EstudanteRanking[] {
  const seed = hashStr(`rank:${filters.dre}|${filters.escola}|${filters.ano}|${filters.turma}|${filters.aplicacao}`);
  const rng = mulberry32(seed);
  const baseLP = mediaBase(filters, "Língua Portuguesa");
  const baseMT = mediaBase(filters, "Matemática");
  const escolas = filters.escola !== "all" ? [filters.escola] : escolasFiltradasPorDre(filters.dre);
  const ano = filters.ano !== "all" ? filters.ano : "9º ano";

  const total = 28;
  const list: EstudanteRanking[] = [];
  for (let i = 0; i < total; i++) {
    const lc = Math.max(120, Math.min(440, Math.round(gauss(rng, baseLP, 55))));
    const mt = Math.max(120, Math.min(440, Math.round(gauss(rng, baseMT, 55))));
    const nome = NOMES[i % NOMES.length];
    const escola = escolas[i % escolas.length];
    const turma = TURMAS[i % TURMAS.length];
    list.push({
      rankingTrieduc: 0,
      rankingEscola: 0,
      nome,
      login: `${nome.toLowerCase().split(" ")[0]}${i + 1}@aluno.${escola.toLowerCase().replace(/\s+/g, "")}.br`,
      escola,
      turma: `${ano.replace(/\D/g, "")}º${turma}`,
      lc,
      mt,
      mediaGeral: Math.round((lc + mt) / 2),
    });
  }

  list.sort((a, b) => b.mediaGeral - a.mediaGeral);
  list.forEach((e, i) => {
    e.rankingTrieduc = i + 1 + Math.floor(rng() * 50);
    e.rankingEscola = i + 1;
  });
  return list;
}

// utilitários para "aplicação por mês"
export function getParticipantesPorAplicacao(filters: GestorFilters) {
  return APLICACOES.map((apl) => {
    const qt = getQuantitativo({ ...filters, aplicacao: apl });
    return { aplicacao: apl, alunos: Math.round((qt.participantes_lp + qt.participantes_mt) / 2) };
  });
}
