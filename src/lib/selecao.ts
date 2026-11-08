import { QUOTAS, questoes } from "./banco";
import type { Questao } from "./types";

export type Rng = () => number;

function embaralhar<T>(lista: T[], rng: Rng = Math.random): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function utilizavel(q: Questao, incluirRevisar = false): boolean {
  if (q.anulada) return false;
  return incluirRevisar || q.status_vigencia === "vigente";
}

/**
 * Sorteia 70 questões respeitando a matriz do edital 2027:
 * 16 Língua Portuguesa, 30 Direito e 24 Gerais (4/4/9/7 dentro de Gerais).
 * Se alguma cota não existir no banco, completa com o mesmo bloco.
 */
export function sortearSimulado(
  pool: Questao[] = questoes,
  rng: Rng = Math.random,
): Questao[] {
  const validas = pool.filter((q) => utilizavel(q));
  const lp = embaralhar(
    validas.filter((q) => q.materia === "Língua Portuguesa"),
    rng,
  ).slice(0, QUOTAS.lp);
  const direito = embaralhar(
    validas.filter((q) => q.materia === "Conhecimentos em Direito"),
    rng,
  ).slice(0, QUOTAS.direito);

  const gerais: Questao[] = [];
  for (const [assunto, cota] of Object.entries(QUOTAS.gerais)) {
    gerais.push(
      ...embaralhar(
        validas.filter((q) => q.assunto === assunto),
        rng,
      ).slice(0, cota),
    );
  }

  if (gerais.length < QUOTAS.geraisTotal) {
    const usados = new Set(gerais.map((q) => q.id));
    const resto = embaralhar(
      validas.filter((q) => q.materia === "Conhecimentos Gerais" && !usados.has(q.id)),
      rng,
    );
    gerais.push(...resto.slice(0, QUOTAS.geraisTotal - gerais.length));
  }

  if (lp.length < QUOTAS.lp || direito.length < QUOTAS.direito || gerais.length < QUOTAS.geraisTotal) {
    throw new Error(
      `Banco insuficiente: LP ${lp.length}/16, Direito ${direito.length}/30, Gerais ${gerais.length}/24`,
    );
  }

  // blocos na ordem da prova; dentro de cada bloco, ordem sorteada
  return [...embaralhar(lp, rng), ...embaralhar(direito, rng), ...embaralhar(gerais, rng)];
}

/** Ordem aleatória para o treino de uma matéria. */
export function sortearTreino(
  pool: Questao[] = questoes,
  assunto?: string,
  rng: Rng = Math.random,
): Questao[] {
  const base = pool
    .filter((q) => utilizavel(q, true))
    .filter((q) => !assunto || q.assunto === assunto);
  return embaralhar(base, rng);
}

export { embaralhar };
