import raw from "@/data/aulas.json";
import type { Questao } from "./types";

export interface SecaoAula {
  titulo: string;
  texto_md: string;
  artigos: string[];
}

export interface Aula {
  id: string;
  materia: string;
  assunto: string;
  topico: string;
  edital_ref: string;
  objetivos: string[];
  secoes: SecaoAula[];
  exemplo_resolvido: {
    enunciado: string;
    passo_a_passo: string[];
    questao_id: string;
  };
  pegadinhas: string[];
  resumo: string;
  flashcards: { frente: string; verso: string }[];
  questoes_relacionadas: string[];
  fonte: string;
  revisado: boolean;
  versao: number;
}

export const aulas = raw as unknown as Aula[];

export function aulaPorId(id: string): Aula | undefined {
  return aulas.find((a) => a.id === id);
}

export function aulasPorAssunto(assunto: string): Aula[] {
  return aulas.filter((a) => a.assunto === assunto);
}

export function aulaDoTopico(topico: string): Aula | undefined {
  return aulas.find((a) => a.topico === topico);
}

/** Aula ligada à questão: tópico explícito ou, na falta, o assunto. */
export function aulasDaQuestao(q: Questao): Aula[] {
  if (q.topico) {
    const porTopico = aulas.filter((a) => a.topico === q.topico);
    if (porTopico.length) return porTopico;
  }
  return aulasPorAssunto(q.assunto);
}

export const MATERIAS_ESTUDO = [
  "Língua Portuguesa",
  "Conhecimentos em Direito",
  "Conhecimentos Gerais",
] as const;
