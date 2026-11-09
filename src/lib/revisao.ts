import {
  listarRevisoes,
  obterRevisao,
  salvarRevisao,
  type RevisaoRow,
} from "@/lib/db";

export const DIA = 24 * 60 * 60 * 1000;
/** intervalo em dias para cada nível (0 = errada, 5 = dominada) */
export const INTERVALOS_DIAS = [0, 1, 3, 7, 15, 30];

export function agendar(
  nivel: number,
  acertou: boolean,
  agora = Date.now(),
): Pick<RevisaoRow, "nivel" | "proximaEm"> {
  if (!acertou) {
    return { nivel: 0, proximaEm: agora + DIA };
  }
  const novo = Math.min(Math.max(nivel, 0) + 1, INTERVALOS_DIAS.length - 1);
  return { nivel: novo, proximaEm: agora + INTERVALOS_DIAS[novo] * DIA };
}

/** Adiciona à fila apenas questões que ainda não estão nela (idempotente). */
export async function registrarErros(ids: string[]): Promise<number> {
  let adicionadas = 0;
  for (const id of ids) {
    const atual = await obterRevisao(id);
    if (atual) continue;
    await salvarRevisao({
      id,
      nivel: 0,
      proximaEm: Date.now(),
      ultimaEm: Date.now(),
      erros: 1,
      acertos: 0,
    });
    adicionadas += 1;
  }
  return adicionadas;
}

export async function registrarResposta(
  id: string,
  acertou: boolean,
): Promise<RevisaoRow> {
  const agora = Date.now();
  const atual = await obterRevisao(id);
  const base: RevisaoRow = atual ?? {
    id,
    nivel: 0,
    proximaEm: agora,
    ultimaEm: 0,
    erros: 0,
    acertos: 0,
  };
  const agendamento = agendar(base.nivel, acertou, agora);
  const atualizada: RevisaoRow = {
    ...base,
    ...agendamento,
    ultimaEm: agora,
    erros: base.erros + (acertou ? 0 : 1),
    acertos: base.acertos + (acertou ? 1 : 0),
  };
  await salvarRevisao(atualizada);
  return atualizada;
}

export async function filaDevidas(limite = 20): Promise<RevisaoRow[]> {
  const agora = Date.now();
  const todas = await listarRevisoes();
  return todas
    .filter((r) => r.proximaEm <= agora)
    .sort((a, b) => a.proximaEm - b.proximaEm)
    .slice(0, limite);
}

export interface ResumoRevisao {
  total: number;
  devidas: number;
  dominadas: number;
}

export async function resumoRevisao(): Promise<ResumoRevisao> {
  const todas = await listarRevisoes();
  const agora = Date.now();
  return {
    total: todas.length,
    devidas: todas.filter((r) => r.proximaEm <= agora).length,
    dominadas: todas.filter((r) => r.nivel >= 4).length,
  };
}
