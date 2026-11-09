import { listarSessoes, type SessaoRow } from "@/lib/db";
import { porId, questoes } from "@/lib/banco";
import { corrigir } from "@/lib/scoring";
import type { Questao, Resultado } from "@/lib/types";

export interface ItemHistorico {
  id: string;
  quando: number;
  nota: number;
  acertos: number;
  total: number;
  aprovado: boolean;
  tempoMin: number | null;
}

export interface Desempenho {
  simulados: number;
  media: number;
  melhor: number;
  ultima: number | null;
  aprovacoes: number;
  porAssunto: { assunto: string; acertos: number; total: number; pct: number }[];
  historico: ItemHistorico[];
}

function selecao(s: SessaoRow): Questao[] {
  if (s.questaoIds?.length) {
    return s.questaoIds.map((id) => porId[id]).filter(Boolean) as Questao[];
  }
  return questoes.filter((q) => q.edicao === "2025").slice(0, 70);
}

function resultadoDe(s: SessaoRow): Resultado {
  const tempoRestanteMs = Math.max(0, s.terminaEm - (s.finalizadaEm ?? s.terminaEm));
  return corrigir(selecao(s), s.respostas, { tempoRestanteMs });
}

export async function calcularDesempenho(): Promise<Desempenho> {
  const todas = await listarSessoes();
  const sessoes = todas
    .filter((s) => s.finalizadaEm && s.modo === "simulado")
    .sort((a, b) => (b.finalizadaEm ?? 0) - (a.finalizadaEm ?? 0));

  const porAssunto = new Map<string, { acertos: number; total: number }>();
  const historico: ItemHistorico[] = [];
  let somaNotas = 0;
  let melhor = 0;
  let aprovacoes = 0;

  for (const s of sessoes) {
    const r = resultadoDe(s);
    somaNotas += r.nota;
    melhor = Math.max(melhor, r.nota);
    if (r.aprovado) aprovacoes += 1;

    for (const a of r.porAssunto) {
      const atual = porAssunto.get(a.assunto) ?? { acertos: 0, total: 0 };
      atual.acertos += a.acertos;
      atual.total += a.total;
      porAssunto.set(a.assunto, atual);
    }

    const duracaoMs =
      s.finalizadaEm && s.criadaEm ? s.finalizadaEm - s.criadaEm : null;
    historico.push({
      id: s.id,
      quando: s.finalizadaEm ?? s.criadaEm,
      nota: r.nota,
      acertos: r.acertos,
      total: r.total,
      aprovado: r.aprovado,
      tempoMin: duracaoMs && duracaoMs > 0 ? Math.round(duracaoMs / 60000) : null,
    });
  }

  return {
    simulados: sessoes.length,
    media: sessoes.length ? Math.round((somaNotas / sessoes.length) * 100) / 100 : 0,
    melhor: Math.round(melhor * 100) / 100,
    ultima: historico[0]?.nota ?? null,
    aprovacoes,
    porAssunto: [...porAssunto.entries()]
      .map(([assunto, v]) => ({
        assunto,
        acertos: v.acertos,
        total: v.total,
        pct: v.total ? Math.round((v.acertos / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total),
    historico: historico.slice(0, 12),
  };
}
