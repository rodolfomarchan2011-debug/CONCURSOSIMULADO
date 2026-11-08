import { describe, expect, it } from "vitest";
import { questoes } from "@/lib/banco";
import { sortearSimulado } from "@/lib/selecao";
import { calcularNota, corrigir, MINIMO_DIREITO, MINIMO_LP } from "@/lib/scoring";
import type { Letra, Questao } from "@/lib/types";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

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

const prova: Questao[] = sortearSimulado(questoes, rng(42));

function certas(): Record<string, Letra> {
  return Object.fromEntries(prova.map((q) => [q.id, q.correta]));
}

function erradas(): Record<string, Letra> {
  return Object.fromEntries(
    prova.map((q) => [q.id, LETRAS.find((l) => l !== q.correta)!]),
  );
}

describe("correção e travas do edital", () => {
  it("a seleção de teste tem 70 questões", () => {
    expect(prova).toHaveLength(70);
  });

  it("gabaritando tudo, nota 10 e aprovado", () => {
    const r = corrigir(prova, certas());
    expect(r.acertos).toBe(70);
    expect(r.nota).toBe(10);
    expect(r.aprovado).toBe(true);
    expect(r.erros).toEqual([]);
  });

  it("zerando tudo, nota 0 e reprovado", () => {
    const r = corrigir(prova, erradas());
    expect(r.acertos).toBe(0);
    expect(r.nota).toBe(0);
    expect(r.aprovado).toBe(false);
    expect(r.erros).toHaveLength(70);
  });

  it("reprova com menos de 8 acertos em Português, mesmo com o resto perfeito", () => {
    const respostas = certas();
    for (const q of prova.filter((x) => x.materia === "Língua Portuguesa").slice(0, 9)) {
      respostas[q.id] = LETRAS.find((l) => l !== q.correta)!;
    }
    const r = corrigir(prova, respostas);
    const lp = r.blocos.find((b) => b.bloco === "Língua Portuguesa")!;
    expect(lp.acertos).toBe(7);
    expect(lp.ok).toBe(false);
    expect(r.nota).toBeGreaterThanOrEqual(5);
    expect(r.aprovado).toBe(false);
  });

  it("reprova com menos de 15 acertos em Direito, mesmo com nota acima de 5", () => {
    const respostas = certas();
    for (const q of prova.filter((x) => x.materia === "Conhecimentos em Direito").slice(0, 16)) {
      respostas[q.id] = LETRAS.find((l) => l !== q.correta)!;
    }
    const r = corrigir(prova, respostas);
    const direito = r.blocos.find((b) => b.bloco === "Conhecimentos em Direito")!;
    expect(direito.acertos).toBe(14);
    expect(direito.ok).toBe(false);
    expect(r.aprovado).toBe(false);
  });

  it("reprova por nota final abaixo de 5,0 mesmo passando nas duas travas", () => {
    const respostas = certas();
    const manter = new Set([
      ...prova.filter((q) => q.materia === "Língua Portuguesa").slice(0, 8).map((q) => q.id),
      ...prova
        .filter((q) => q.materia === "Conhecimentos em Direito")
        .slice(0, 15)
        .map((q) => q.id),
    ]);
    for (const q of prova) {
      if (!manter.has(q.id)) respostas[q.id] = LETRAS.find((l) => l !== q.correta)!;
    }
    const r = corrigir(prova, respostas);
    expect(r.blocos[0].ok).toBe(true);
    expect(r.blocos[1].ok).toBe(true);
    expect(r.nota).toBeLessThan(5);
    expect(r.aprovado).toBe(false);
  });

  it("conta em branco como erro", () => {
    const r = corrigir(prova, {});
    expect(r.acertos).toBe(0);
    expect(r.erros).toHaveLength(70);
  });

  it("calcula nota proporcional", () => {
    expect(calcularNota(35, 70)).toBe(5);
    expect(calcularNota(56, 70)).toBe(8);
    expect(calcularNota(0, 70)).toBe(0);
  });

  it("mantém os mínimos oficiais", () => {
    expect(MINIMO_LP).toBe(8);
    expect(MINIMO_DIREITO).toBe(15);
  });
});
