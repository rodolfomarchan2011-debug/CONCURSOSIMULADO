import type { BlocoResumo, Letra, Questao, Resultado } from "./types";
import { MATRIZ_OFICIAL } from "./banco";

export const NOTA_MINIMA = 5;
export const MINIMO_LP = 8; // 50% de 16
export const MINIMO_DIREITO = 15; // 50% de 30
export const NOTA_REDACAO_MAX = 40;
export const NOTA_REDACAO_MINIMA = 24;

export function calcularNota(acertos: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((acertos / total) * 1000) / 100; // 0,00 a 10,00
}

export function corrigir(
  questoes: Questao[],
  respostas: Record<string, Letra>,
  opts: { tempoRestanteMs?: number } = {},
): Resultado {
  const total = questoes.length;
  let acertos = 0;
  const erros: number[] = [];

  const porAssunto = new Map<string, { acertos: number; total: number }>();
  const porBloco = new Map<string, { acertos: number; total: number }>();

  for (const q of questoes) {
    const marcada = respostas[String(q.numero)];
    const certa = marcada === q.correta;
    if (certa) acertos += 1;
    else erros.push(q.numero);

    const a = porAssunto.get(q.assunto) ?? { acertos: 0, total: 0 };
    a.total += 1;
    if (certa) a.acertos += 1;
    porAssunto.set(q.assunto, a);

    const b = porBloco.get(q.materia) ?? { acertos: 0, total: 0 };
    b.total += 1;
    if (certa) b.acertos += 1;
    porBloco.set(q.materia, b);
  }

  const blocos: BlocoResumo[] = [
    bloco("Língua Portuguesa", MINIMO_LP),
    bloco("Conhecimentos em Direito", MINIMO_DIREITO),
    bloco("Conhecimentos Gerais", null),
  ];

  function bloco(nome: string, minimo: number | null): BlocoResumo {
    const dados = porBloco.get(nome) ?? { acertos: 0, total: 0 };
    return {
      bloco: nome,
      acertos: dados.acertos,
      total: dados.total,
      minimo,
      ok: minimo === null ? true : dados.acertos >= minimo,
    };
  }

  const nota = calcularNota(acertos, total);
  const aprovado =
    nota >= NOTA_MINIMA && blocos.every((b) => b.ok);

  return {
    total,
    acertos,
    nota,
    blocos,
    porAssunto: [...porAssunto.entries()]
      .map(([assunto, d]) => ({ assunto, ...d }))
      .sort((x, y) => y.total - x.total),
    aprovado,
    erros,
    tempoRestanteMs: opts.tempoRestanteMs ?? 0,
  };
}

export interface ValidacaoMatriz {
  ok: boolean;
  contagem: Record<string, number>;
  esperado: Record<string, number>;
  problemas: string[];
}

/** Confere a matriz do simulado contra o Anexo VIII do edital 2027. */
export function validarMatriz(questoes: Questao[]): ValidacaoMatriz {
  const contagem: Record<string, number> = {};
  for (const q of questoes) {
    contagem[q.assunto] = (contagem[q.assunto] ?? 0) + 1;
  }

  const esperado: Record<string, number> = { ...MATRIZ_OFICIAL };
  const problemas: string[] = [];

  const lp = questoes.filter((q) => q.materia === "Língua Portuguesa").length;
  const direito = questoes.filter((q) => q.materia === "Conhecimentos em Direito").length;
  const atualidades = contagem["Atualidades"] ?? 0;
  const matematica = contagem["Matemática"] ?? 0;
  const informatica = contagem["Informática"] ?? 0;
  const rl = contagem["Raciocínio Lógico"] ?? 0;

  if (lp !== esperado["Língua Portuguesa"]) problemas.push(`Português: ${lp}/16`);
  if (direito !== esperado["Conhecimentos em Direito"]) problemas.push(`Direito: ${direito}/30`);
  if (atualidades !== esperado["Atualidades"]) problemas.push(`Atualidades: ${atualidades}/4`);
  if (matematica !== esperado["Matemática"]) problemas.push(`Matemática: ${matematica}/4`);
  if (informatica !== esperado["Informática"]) problemas.push(`Informática: ${informatica}/9`);
  if (rl !== esperado["Raciocínio Lógico"]) problemas.push(`Raciocínio Lógico: ${rl}/7`);
  if (questoes.length !== 70) problemas.push(`Total: ${questoes.length}/70`);
  if (questoes.some((q) => q.anulada)) problemas.push("Há questão anulada na seleção");

  return { ok: problemas.length === 0, contagem, esperado, problemas };
}

export function totalDoAssunto(assunto: string): number {
  switch (assunto) {
    case "Língua Portuguesa":
      return MATRIZ_OFICIAL["Língua Portuguesa"];
    case "Conhecimentos em Direito":
      return MATRIZ_OFICIAL["Conhecimentos em Direito"];
    default:
      return MATRIZ_OFICIAL[assunto as keyof typeof MATRIZ_OFICIAL] ?? 0;
  }
}
