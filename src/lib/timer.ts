/** Cronômetro baseado em timestamp: imune a aba em segundo plano e recarga. */

export function criarTerminaEm(
  inicioMs: number,
  duracaoMin: number,
  adicionalMin = 0,
): number {
  return inicioMs + (duracaoMin + adicionalMin) * 60_000;
}

export function restanteMs(terminaEm: number, agora = Date.now()): number {
  return Math.max(0, terminaEm - agora);
}

export function expirou(terminaEm: number, agora = Date.now()): boolean {
  return agora >= terminaEm;
}

export function formatarDuracao(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatarHoraCurta(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export const DURACAO_PROVA_MIN = 300; // 5 horas — edital 2027
export const EXAME_ISO = "2027-03-14T13:00:00-03:00";
export const EXAME_LABEL = "14 de março de 2027";
