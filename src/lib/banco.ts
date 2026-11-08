import type { Banco, Contexto, Questao } from "./types";
import raw from "@/data/banco.json";

export const banco = raw as unknown as Banco;

export const questoes: Questao[] = banco.questoes;

export const porId: Record<string, Questao> = Object.fromEntries(
  banco.questoes.map((q) => [q.id, q]),
);

export const contextos: Record<string, Contexto> = Object.fromEntries(
  banco.contextos.map((c) => [c.id, c]),
);

export function getQuestao(idOuNumero: string | number): Questao | undefined {
  if (typeof idOuNumero === "number") {
    return banco.questoes.find((q) => q.edicao === "2025" && q.numero === idOuNumero);
  }
  return porId[idOuNumero];
}

export function contextoDa(q: Questao): Contexto | undefined {
  return q.contexto_id ? contextos[q.contexto_id] : undefined;
}

export const EDICOES = Object.entries(banco.meta.edicoes)
  .map(([ano, dados]) => ({ ano, ...dados }))
  .sort((a, b) => Number(b.ano) - Number(a.ano));

/** Matriz do edital 2027 (Anexo VIII), usada para montar o simulado. */
export const QUOTAS = {
  lp: 16,
  direito: 30,
  geraisTotal: 24,
  gerais: {
    Atualidades: 4,
    Matemática: 4,
    Informática: 9,
    "Raciocínio Lógico": 7,
  } as Record<string, number>,
} as const;

/** Assuntos usados nos filtros de treino, na ordem em que aparecem na prova. */
export const ASSUNTOS = [
  "Interpretação de texto",
  "Direito Penal",
  "Direito Processual Penal",
  "Direito Processual Civil",
  "Direito Constitucional",
  "Direito Administrativo",
  "Legislação interna (TJSP)",
  "Atualidades",
  "Matemática",
  "Informática",
  "Raciocínio Lógico",
] as const;

export const BLOCOS = [
  "Língua Portuguesa",
  "Conhecimentos em Direito",
  "Conhecimentos Gerais",
] as const;

/** Matriz em formato de contagem por assunto (para validação do simulado). */
export const MATRIZ_OFICIAL: Record<string, number> = {
  "Língua Portuguesa": QUOTAS.lp,
  "Conhecimentos em Direito": QUOTAS.direito,
  ...QUOTAS.gerais,
};

export const META = banco.meta;
