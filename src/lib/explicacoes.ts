import type { Questao } from "./types";
import raw from "@/data/explanations.json";

export interface Explicacao {
  correta: string;
  base?: string;
  fonte?: string;
  revisado?: boolean;
}

const mapa = raw as Record<string, Explicacao>;

function chave(q: Questao): string {
  return String(q.numero).padStart(2, "0");
}

export function getExplicacao(q: Questao): Explicacao | null {
  return mapa[chave(q)] ?? null;
}

export function temExplicacao(q: Questao): boolean {
  return Boolean(mapa[chave(q)]);
}

export function coberturaExplicacoes(questoes: Questao[]): number {
  const total = questoes.filter((q) => temExplicacao(q)).length;
  return Math.round((total / questoes.length) * 100);
}
