import { describe, expect, it } from "vitest";
import { banco, questoes } from "@/lib/banco";
import { sortearSimulado } from "@/lib/selecao";
import { validarMatriz } from "@/lib/scoring";

/** RNG determinístico para testes (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("banco de questões oficiais", () => {
  it("tem as seis edições e pelo menos 500 questões", () => {
    expect(questoes.length).toBeGreaterThanOrEqual(500);
    expect(banco.meta.total).toBe(questoes.length);
    const edicoes = new Set(questoes.map((q) => q.edicao));
    expect(edicoes).toEqual(
      new Set(["2025", "2024", "2018", "2017", "2015", "2004"]),
    );
  });

  it("não tem id repetido e cada questão tem 5 alternativas", () => {
    expect(new Set(questoes.map((q) => q.id)).size).toBe(questoes.length);
    for (const q of questoes) {
      expect(Object.keys(q.alternativas).sort()).toEqual(["A", "B", "C", "D", "E"]);
      expect(q.alternativas[q.correta].length).toBeGreaterThan(0);
      expect(q.anulada).toBe(false);
    }
  });

  it("não tem pergunta idêntica repetida", () => {
    const vistos = new Set<string>();
    for (const q of questoes) {
      const chave = q.enunciado.trim().toLowerCase();
      expect(vistos.has(chave)).toBe(false);
      vistos.add(chave);
    }
  });
});

describe("sorteio do simulado", () => {
  it("sempre monta 70 questões na matriz 16/30/4/4/9/7", () => {
    for (let i = 0; i < 30; i += 1) {
      const selecionadas = sortearSimulado(questoes, rng(i + 1));
      const v = validarMatriz(selecionadas);
      expect(v.problemas).toEqual([]);
      expect(selecionadas).toHaveLength(70);
      expect(new Set(selecionadas.map((q) => q.id)).size).toBe(70);
    }
  });

  it("sorteios diferentes trazem conjuntos diferentes", () => {
    const a = sortearSimulado(questoes, rng(7)).map((q) => q.id).join(",");
    const b = sortearSimulado(questoes, rng(99)).map((q) => q.id).join(",");
    expect(a).not.toBe(b);
  });

  it("mantém os blocos na ordem da prova", () => {
    const s = sortearSimulado(questoes, rng(3));
    expect(s.slice(0, 16).every((q) => q.materia === "Língua Portuguesa")).toBe(true);
    expect(s.slice(16, 46).every((q) => q.materia === "Conhecimentos em Direito")).toBe(true);
    expect(s.slice(46).every((q) => q.materia === "Conhecimentos Gerais")).toBe(true);
  });
});
