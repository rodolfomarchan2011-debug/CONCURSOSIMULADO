import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  chaveExplicacao,
  limparCacheMemoria,
  obterExplicacao,
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

describe("cache de explicação", () => {
  it("a 2ª chamada com a mesma chave não bate no provedor", async () => {
    let chamadas = 0;
    const gerar = async () => {
      chamadas += 1;
      return "explicação persistida de teste";
    };

    const primeira = await obterExplicacao(q, "A", gerar);
    expect(primeira).toBe("explicação persistida de teste");
    expect(chamadas).toBe(1);

    limparCacheMemoria(); // força leitura do IndexedDB
    const segunda = await obterExplicacao(q, "A", gerar);
    expect(segunda).toBe("explicação persistida de teste");
    expect(chamadas).toBe(1);
  });

  it("chave inclui questão, escolha e versão do prompt", () => {
    expect(chaveExplicacao(q, "A")).toBe("tjsp-2018-030:A:v2");
    expect(chaveExplicacao(q, null)).toContain(":nenhuma:v2");
  });
});
