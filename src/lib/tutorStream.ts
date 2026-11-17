"use client";

import type { Letra, Questao } from "@/lib/types";
import { deviceId } from "@/lib/prefs";
import { obterExplicacaoIa, salvarExplicacaoIa } from "@/lib/db";
import { VERSAO_PROMPT } from "@/lib/tutorPrompt";

export interface StreamOpts {
  questao: Questao;
  escolha?: Letra | null;
  pergunta?: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
  historico?: { papel: "user" | "assistant"; texto: string }[];
}

/** Consome o SSE de /api/tutor e devolve o texto completo. */
export async function streamTutor({
  questao,
  escolha = null,
  pergunta = "",
  onDelta,
  signal,
  historico = [],
}: StreamOpts): Promise<string> {
  const res = await fetch("/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: questao.id,
      numero: questao.numero,
      escolha,
      pergunta,
      deviceId: deviceId(),
      historico,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`tutor ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acumulado = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const partes = buffer.split("\n\n");
    buffer = partes.pop() ?? "";
    for (const parte of partes) {
      const linha = parte.trim();
      if (!linha.startsWith("data:")) continue;
      const dados = linha.slice(5).trim();
      if (dados === "[DONE]") continue;
      try {
        const json = JSON.parse(dados) as { delta?: string; erro?: string };
        if (json.erro) throw new Error(json.erro);
        if (json.delta) {
          acumulado += json.delta;
          onDelta(json.delta);
        }
      } catch {
        /* chunk parcial */
      }
    }
  }
  return acumulado;
}

const cache = new Map<string, string>();

export function chaveExplicacao(q: Questao, escolha: Letra | null | undefined): string {
  return `${q.id}:${escolha ?? "nenhuma"}:v${VERSAO_PROMPT}`;
}

export function cacheExplicacao(q: Questao, escolha: Letra | null | undefined): string | undefined {
  return cache.get(chaveExplicacao(q, escolha));
}

/** Usado nos testes para forçar a leitura do IndexedDB. */
export function limparCacheMemoria(): void {
  cache.clear();
}

/** Memória → IndexedDB. Retorna o texto já gerado, se existir. */
export async function lerExplicacao(
  q: Questao,
  escolha: Letra | null | undefined,
): Promise<string | undefined> {
  const emMemoria = cacheExplicacao(q, escolha);
  if (emMemoria) return emMemoria;
  try {
    const linha = await obterExplicacaoIa(chaveExplicacao(q, escolha));
    if (linha?.texto) {
      cache.set(linha.chave, linha.texto);
      return linha.texto;
    }
  } catch {
    /* IndexedDB indisponível */
  }
  return undefined;
}

/** Cache primeiro; só chama o provedor se não houver texto salvo. */
export async function obterExplicacao(
  q: Questao,
  escolha: Letra | null | undefined,
  gerar: () => Promise<string>,
): Promise<string> {
  const salvo = await lerExplicacao(q, escolha);
  if (salvo) return salvo;
  const texto = await gerar();
  guardarExplicacao(q, escolha, texto);
  return texto;
}

export function guardarExplicacao(
  q: Questao,
  escolha: Letra | null | undefined,
  texto: string,
): void {
  if (!texto.trim()) return;
  const chave = chaveExplicacao(q, escolha);
  cache.set(chave, texto);
  void salvarExplicacaoIa({
    chave,
    questaoId: q.id,
    escolha: escolha ?? "nenhuma",
    versao: VERSAO_PROMPT,
    texto,
    criadaEm: Date.now(),
  }).catch(() => {
    /* sem IndexedDB: mantém só a memória */
  });
}
