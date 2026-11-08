export type Letra = "A" | "B" | "C" | "D" | "E";

export interface Questao {
  id: string;
  numero: number;
  bloco: string;
  materia: string;
  assunto: string;
  contexto_id: string | null;
  enunciado: string;
  alternativas: Record<Letra, string>;
  correta: Letra;
  anulada: boolean;
  tem_imagem: boolean;
  imagens: string[];
  fonte: string;
  fonte_pagina: number;
  status_vigencia: "vigente" | "desatualizada_por_lei" | "revisar";
  lei_que_alterou: string | null;
  revisado: boolean;
}

export interface Contexto {
  id: string;
  texto: string;
  fonte: string;
}

export interface Banco {
  meta: {
    concurso: string;
    banca: string;
    edital: string;
    prova_aplicada_em: string;
    questoes: number;
    matriz: Record<string, number>;
    gabarito_fonte: string;
    gerado_por: string;
  };
  contextos: Contexto[];
  questoes: Questao[];
}

export interface Resposta {
  numero: number;
  letra: Letra;
  tempoMs?: number;
}

export type Modo = "simulado" | "treino";

export interface Sessao {
  id: string;
  modo: Modo;
  criadaEm: number;
  terminaEm: number;
  duracaoMin: number;
  respostas: Record<string, Letra>;
  marcadas: number[];
  atual: number;
  finalizadaEm?: number;
  /** Modo estudo: revela gabarito e explicação logo após responder. */
  modoEstudo?: boolean;
}

export interface BlocoResumo {
  bloco: string;
  acertos: number;
  total: number;
  minimo: number | null;
  ok: boolean;
}

export interface Resultado {
  total: number;
  acertos: number;
  nota: number;
  blocos: BlocoResumo[];
  porAssunto: { assunto: string; acertos: number; total: number }[];
  aprovado: boolean;
  erros: number[];
  tempoRestanteMs: number;
}
