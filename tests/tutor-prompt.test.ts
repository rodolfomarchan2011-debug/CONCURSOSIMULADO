import { describe, expect, it } from "vitest";
import {
  blocoCorrecao,
  instrucao,
  limparRepeticao,
  limitarPalavras,
  montarTextoLinhas,
  parseLinhas,
  precisaAvisoArtigo,
  violaGabarito,
} from "@/lib/tutorPrompt";
import type { Questao } from "@/lib/types";

const q: Questao = {
  id: "tjsp-2025-001",
  edicao: "2025",
  ano: 2025,
  numero: 1,
  bloco: "Língua Portuguesa",
  materia: "Língua Portuguesa",
  assunto: "Interpretação de texto",
  contexto_id: null,
  enunciado: "Segundo o texto, a contribuição de Hawking foi:",
  alternativas: {
    A: "reconhecida pela universidade e pela popularização da ciência",
    B: "restrita ao círculo de amigos",
    C: "irrelevante para a física",
    D: "apenas institucional",
    E: "contestada pelos alunos",
  },
  correta: "A",
  anulada: false,
  tem_imagem: false,
  imagens: [],
  fonte: "VUNESP TJSP2503",
  fonte_pagina: 1,
  status_vigencia: "vigente",
  lei_que_alterou: null,
  revisado: false,
};

describe("prompt do tutor", () => {
  it("proíbe repetir o gabarito e limita a 180 palavras", () => {
    const texto = instrucao("B");
    expect(texto).toContain("PROIBIDO");
    expect(texto).toContain("180 palavras");
    expect(texto).toContain("alternativa B");
  });

  it("envia a alternativa marcada e não manda o gabarito", () => {
    const bloco = blocoCorrecao({ q, escolha: "B", trechos: [], explicacao: null });
    expect(bloco).toContain("Alternativa marcada pelo aluno: (B)");
    expect(bloco).not.toContain("Gabarito oficial");
    expect(bloco).not.toContain("(C)");
    expect(bloco).not.toContain("(D)");
  });

  it("detecta repetição do gabarito e transcrição da correta", () => {
    expect(violaGabarito("O gabarito é C.")).toBe(true);
    expect(violaGabarito("A alternativa correta é a letra A.")).toBe(true);
    expect(violaGabarito("A resposta é B.")).toBe(true);
    expect(
      violaGabarito("A letra B falha porque confunde popularidade com carisma."),
    ).toBe(false);
    expect(
      violaGabarito(
        "A banca considerou reconhecida pela universidade e pela popularização da ciência.",
        q.alternativas.A,
      ),
    ).toBe(true);
  });

  it("exige artigo em Direito, salvo declaração de ausência", () => {
    expect(precisaAvisoArtigo("Conhecimentos em Direito", "O crime é de concussão.")).toBe(true);
    expect(precisaAvisoArtigo("Conhecimentos em Direito", "Conforme art. 316 do CP.")).toBe(false);
    expect(
      precisaAvisoArtigo("Conhecimentos em Direito", "sem artigo aplicável na base"),
    ).toBe(false);
    expect(precisaAvisoArtigo("Língua Portuguesa", "Sem artigo, é interpretação.")).toBe(false);
  });

  it("remove linha que repete o gabarito", () => {
    const limpo = limparRepeticao(
      "O gabarito é C.\nA letra B erra ao trocar o sujeito.",
    );
    expect(limpo).not.toMatch(/gabarito é/i);
    expect(limpo).toContain("A letra B erra");
  });

  it("corta a resposta no limite de palavras", () => {
    const longo = Array.from({ length: 300 }, (_, i) => `palavra${i}.`).join(" ");
    const curto = limitarPalavras(longo, 160);
    expect(curto.split(/\s+/).length).toBeLessThanOrEqual(160);
  });

  it("lê o formato de 5 linhas e respeita os limites por item", () => {
    const bruto = [
      "### 1) Caminho: primeiro passo; segundo passo; terceiro passo.",
      "2) Por que a alternativa B falha: porque troca o sujeito.",
      "3) Pegadinha VUNESP: confundir popularidade com carisma.",
      "4) Fundamento: art. 357 do CP.",
      "5) Fixe: comum não exige qualidade especial.",
    ].join("\n");
    const itens = parseLinhas(bruto);
    expect(itens).not.toBeNull();
    expect(itens?.[0]).toContain("primeiro passo");
    const texto = montarTextoLinhas(itens!);
    expect(texto.split("\n")).toHaveLength(5);
    expect(texto).not.toContain("###");
  });

  it("rejeita resposta fora do formato", () => {
    expect(parseLinhas("texto solto sem numeração")).toBeNull();
  });
});
