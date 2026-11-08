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
  return `${q.edicao}-${String(q.numero).padStart(2, "0")}`;
}

export function getExplicacao(q: Questao): Explicacao | null {
  const especifica = mapa[chave(q)];
  if (especifica) return especifica;
  // compatibilidade: explicações antigas só tinham o número (edição 2025)
  if (q.edicao === "2025") return mapa[String(q.numero).padStart(2, "0")] ?? null;
  return null;
}

export function temExplicacao(q: Questao): boolean {
  return Boolean(getExplicacao(q));
}

export function coberturaExplicacoes(questoes: Questao[]): number {
  const total = questoes.filter((q) => temExplicacao(q)).length;
  return Math.round((total / questoes.length) * 100);
}
