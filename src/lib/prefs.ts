"use client";

const CHAVE_TEMPO = "tjsp:tempoAdicionalMin";
const CHAVE_DISPOSITIVO = "tjsp:deviceId";

export function lerTempoAdicional(): number {
  if (typeof window === "undefined") return 0;
  const valor = Number(window.localStorage.getItem(CHAVE_TEMPO) ?? "0");
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

export function salvarTempoAdicional(min: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE_TEMPO, String(Math.max(0, Math.floor(min))));
}

export function deviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(CHAVE_DISPOSITIVO);
  if (!id) {
    id = crypto.randomUUID?.() ?? `d-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(CHAVE_DISPOSITIVO, id);
  }
  return id;
}

export function exportarProgresso(dados: unknown): void {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tjsp-escrevente-progresso-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
