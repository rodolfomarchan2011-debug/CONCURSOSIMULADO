import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  chaveExplicacao,
  guardarExplicacao,
  lerExplicacao,
  limparCacheMemoria,
} from "@/lib/tutorStream";
import type { Questao } from "@/lib/types";

const q: Questao = {
  id: "tjsp-2018-030",
  edicao: "2018",
  ano: 2018,
  numero: 30,
  bloco: "Conhecimentos em Direito",
  materia: "Conhecimentos em Direito",
  assunto: "Direito Penal",
  contexto_id: null,
  enunciado: "Exploração de prestígio",
  alternativas: { A: "a", B: "b", C: "c", D: "d", E: "e" },
  correta: "D",
  anulada: false,
  tem_imagem: false,
  imagens: [],
  fonte: "VUNESP",
  fonte_pagina: 1,
  status_vigencia: "vigente",
  lei_que_alterou: null,
  revisado: false,
};

describe("cache persistente de explicação", () => {
  it("sobrevive à limpeza da memória (IndexedDB)", async () => {
    guardarExplicacao(q, "A", "explicação persistida de teste");
    limparCacheMemoria();

    let lido: string | undefined;
    for (let i = 0; i < 20 && !lido; i += 1) {
      lido = await lerExplicacao(q, "A");
      if (!lido) await new Promise((r) => setTimeout(r, 50));
    }
    expect(lido).toBe("explicação persistida de teste");
  });

  it("chave inclui questão, escolha e versão do prompt", () => {
    expect(chaveExplicacao(q, "A")).toBe("tjsp-2018-030:A:v2");
    expect(chaveExplicacao(q, null)).toContain(":nenhuma:v2");
  });
});
