import Dexie, { type Table } from "dexie";
import type { Sessao } from "./types";

export interface SessaoRow extends Sessao {
  id: string;
}

class AppDb extends Dexie {
  sessoes!: Table<SessaoRow, string>;

  constructor() {
    super("tjsp-escrevente-simulador");
    this.version(1).stores({
      sessoes: "id, criadaEm, finalizadaEm, modo",
    });
  }
}

let instancia: AppDb | null = null;

export function getDb(): AppDb {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB só existe no navegador");
  }
  if (!instancia) instancia = new AppDb();
  return instancia;
}

export function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function salvarSessao(sessao: SessaoRow): Promise<void> {
  await getDb().sessoes.put(sessao);
}

export async function carregarSessao(id: string): Promise<SessaoRow | undefined> {
  return getDb().sessoes.get(id);
}

export async function sessaoAberta(): Promise<SessaoRow | undefined> {
  const abertas = await getDb()
    .sessoes.filter((s) => !s.finalizadaEm && s.modo === "simulado")
    .toArray();
  return abertas.sort((a, b) => b.criadaEm - a.criadaEm)[0];
}

export async function listarSessoes(): Promise<SessaoRow[]> {
  const todas = await getDb().sessoes.toArray();
  return todas.sort((a, b) => b.criadaEm - a.criadaEm);
}

export async function excluirSessao(id: string): Promise<void> {
  await getDb().sessoes.delete(id);
}

export interface ResultadoImportacao {
  importadas: number;
  ignoradas: number;
}

/** Importa sessões exportadas; ignora registros sem os campos mínimos. */
export async function importarSessoes(dados: unknown): Promise<ResultadoImportacao> {
  const lista = Array.isArray(dados)
    ? dados
    : Array.isArray((dados as { sessoes?: unknown })?.sessoes)
      ? ((dados as { sessoes: unknown[] }).sessoes as unknown[])
      : [];

  let importadas = 0;
  let ignoradas = 0;
  for (const item of lista) {
    const s = item as Partial<SessaoRow>;
    if (
      !s ||
      typeof s.id !== "string" ||
      typeof s.criadaEm !== "number" ||
      typeof s.terminaEm !== "number" ||
      typeof s.respostas !== "object" ||
      s.respostas === null
    ) {
      ignoradas += 1;
      continue;
    }
    await getDb().sessoes.put({
      id: s.id,
      modo: s.modo === "treino" ? "treino" : "simulado",
      criadaEm: s.criadaEm,
      terminaEm: s.terminaEm,
      duracaoMin: s.duracaoMin ?? 300,
      respostas: s.respostas as SessaoRow["respostas"],
      marcadas: Array.isArray(s.marcadas) ? s.marcadas : [],
      atual: s.atual ?? 1,
      finalizadaEm: s.finalizadaEm,
    });
    importadas += 1;
  }
  return { importadas, ignoradas };
}

