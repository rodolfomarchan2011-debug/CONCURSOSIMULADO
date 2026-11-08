import type { Banco, Contexto, Questao } from "./types";
import raw from "@/data/questions-2025.json";

export const banco = raw as unknown as Banco;

export const questoes: Questao[] = banco.questoes;

export const contextos: Record<string, Contexto> = Object.fromEntries(
  banco.contextos.map((c) => [c.id, c]),
);

export function getQuestao(numero: number): Questao | undefined {
  return questoes.find((q) => q.numero === numero);
}

export function contextoDa(q: Questao): Contexto | undefined {
  return q.contexto_id ? contextos[q.contexto_id] : undefined;
}

/** Matriz oficial do edital 2027 (Anexo VIII). */
export const MATRIZ_OFICIAL = {
  "Língua Portuguesa": 16,
  "Conhecimentos em Direito": 30,
  Atualidades: 4,
  Matemática: 4,
  Informática: 9,
  "Raciocínio Lógico": 7,
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

export const META = banco.meta;
