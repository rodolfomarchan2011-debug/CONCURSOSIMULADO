import type { Letra, Questao } from "./types";
import { getExplicacao, type Explicacao } from "./explicacoes";
import raw from "@/data/explicacoes-v2.json";

export interface FundamentoLegal {
  lei: string;
  artigo: string;
  trecho: string;
  fonte: string;
}

export interface ExplicacaoV2 {
  questao_id: string;
  raciocinio: string[];
  porque_correta: string;
  porque_erradas: { letra: Letra; motivo: string }[];
  pegadinha: string;
  fundamento_legal: FundamentoLegal[];
  como_lembrar: string;
  fonte: string;
  confianca: number;
  revisado: boolean;
  versao: number;
}

const mapa = raw as Record<string, ExplicacaoV2>;

function detectarLei(texto: string): string {
  const t = texto.toLowerCase();
  if (/processual penal|\bcpp\b/.test(t)) return "CPP";
  if (/processual civil|\bcpc\b/.test(t)) return "CPC";
  if (/constitui|\bcf\b/.test(t)) return "CF";
  if (/penal|\bcp\b/.test(t)) return "CP";
  return "";
}

/** Converte o formato legado em V2 em tempo de execução (compatibilidade). */
export function converterLegado(q: Questao, antiga: Explicacao): ExplicacaoV2 {
  const base = (antiga.base ?? "").trim();
  const artigo = /art\.?\s*(\d{1,4})/i.exec(base)?.[1];
  return {
    questao_id: q.id,
    raciocinio: base ? [base] : [],
    porque_correta: antiga.correta,
    porque_erradas: [],
    pegadinha: "",
    fundamento_legal: artigo
      ? [
          {
            lei: detectarLei(base) || detectarLei(q.assunto),
            artigo,
            trecho: base,
            fonte: antiga.fonte ?? q.fonte,
          },
        ]
      : [],
    como_lembrar: "",
    fonte: antiga.fonte ?? q.fonte,
    confianca: 0.8,
    revisado: Boolean(antiga.revisado),
    versao: 1,
  };
}

export function getExplicacaoV2(q: Questao): ExplicacaoV2 | null {
  const pronta = mapa[q.id];
  if (pronta) return pronta;
  const antiga = getExplicacao(q);
  return antiga ? converterLegado(q, antiga) : null;
}

export function coberturaExplicacoes(questoes: Questao[]): {
  total: number;
  cobertas: number;
  pct: number;
  direitoTotal: number;
  direitoCobertas: number;
} {
  const cobertas = questoes.filter((q) => Boolean(getExplicacaoV2(q))).length;
  const direito = questoes.filter((q) => q.materia === "Conhecimentos em Direito");
  const direitoCobertas = direito.filter((q) => Boolean(getExplicacaoV2(q))).length;
  return {
    total: questoes.length,
    cobertas,
    pct: questoes.length ? Math.round((cobertas / questoes.length) * 100) : 0,
    direitoTotal: direito.length,
    direitoCobertas: direito.length
      ? Math.round((direitoCobertas / direito.length) * 100)
      : 0,
  };
}
