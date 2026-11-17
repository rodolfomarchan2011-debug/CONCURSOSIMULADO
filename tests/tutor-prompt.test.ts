import { describe, expect, it } from "vitest";
import {
  blocoCorrecao,
  contarPalavras,
  contrato,
  instrucao,
  similaridadeTokens,
  validarTexto,
} from "@/lib/tutorPrompt";
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
  enunciado: "A respeito da exploração de prestígio (art. 357 do CP), é correto afirmar:",
  alternativas: {
    A: "prevê causa de aumento se o agente alega que o dinheiro também é destinado a funcionário público estrangeiro",
    B: "exige a condição de funcionário público do agente",
    C: "é crime próprio praticado apenas por advogado",
    D: "é crime comum, podendo ser praticado por qualquer pessoa",
    E: "só se configura se houver prejuízo à administração",
  },
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

describe("prompt e validação da correção", () => {
  it("instrução proíbe repetir o gabarito e o contrato limita a 140 palavras", () => {
    const texto = instrucao("A");
    expect(texto).toContain("PROIBIDO");
    expect(texto).toContain("alternativa A");
    const c = contrato("A");
    expect(c).toContain("140 palavras");
    expect(c).toContain("Caminho:");
    expect(c).toContain("Sua resposta (A):");
    expect(c).toContain("sem artigo aplicável na base");
  });

  it("bloco envia a alternativa marcada e não manda o gabarito", () => {
    const bloco = blocoCorrecao({ q, escolha: "A", trechos: [], explicacao: null });
    expect(bloco).toContain("Alternativa marcada pelo aluno: (A)");
    expect(bloco).not.toContain("Gabarito oficial");
  });

  it("reprova texto que abre repetindo o gabarito", () => {
    const v = validarTexto("O gabarito é D. A letra A troca o sujeito.", q, "A");
    expect(v.ok).toBe(false);
    expect(v.motivo).toMatch(/gabarito/);
  });

  it("reprova 'alternativa correta é'", () => {
    const v = validarTexto("A alternativa correta é a letra D.", q, "A");
    expect(v.ok).toBe(false);
  });

  it("reprova transcrição da alternativa correta", () => {
    const v = validarTexto(
      "É crime comum, podendo ser praticado por qualquer pessoa. Isso resolve a questão.",
      q,
      "A",
    );
    expect(v.ok).toBe(false);
    expect(v.motivo).toMatch(/transcreveram/);
  });

  it("reprova Direito sem artigo", () => {
    const v = validarTexto(
      "1) Caminho: analisar o tipo.\n2) Sua resposta (A) falha.\n3) Pegadinha.\n4) Fixe.",
      q,
      "A",
    );
    expect(v.ok).toBe(false);
    expect(v.motivo).toMatch(/art\./);
  });

  it("reprova texto acima de 180 palavras", () => {
    const palavras = Array.from({ length: 200 }, (_, i) => `palavra${i}`);
    const v = validarTexto(`art. 357 do CP. ${palavras.join(" ")}`, q, "A");
    expect(v.ok).toBe(false);
    expect(v.motivo).toMatch(/180/);
  });

  it("aprova texto no contrato", () => {
    const texto = [
      "1) Caminho: o tipo não exige qualidade especial; o parágrafo único traz aumento; a alegação de funcionário estrangeiro não está no dispositivo.",
      "2) Sua resposta (A) falha porque inventa uma causa de aumento que não existe.",
      "3) Pegadinha VUNESP: trocar o parágrafo único por outra lei.",
      "4) Fundamento: art. 357 do CP — solicitar dinheiro a pretexto de influir em juiz.",
      "5) Fixe: exploração de prestígio é crime comum.",
    ].join("\n");
    expect(validarTexto(texto, q, "A").ok).toBe(true);
    expect(contarPalavras(texto)).toBeLessThanOrEqual(180);
  });

  it("similaridade detecta cópia da alternativa", () => {
    expect(similaridadeTokens(q.alternativas.D, q.alternativas.D)).toBe(1);
    expect(similaridadeTokens("texto completamente diferente", q.alternativas.D)).toBeLessThan(0.3);
  });
});
