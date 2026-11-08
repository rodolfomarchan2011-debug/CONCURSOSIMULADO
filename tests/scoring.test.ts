import { describe, expect, it } from "vitest";
import { questoes } from "@/lib/banco";
import { corrigir, calcularNota, MINIMO_DIREITO, MINIMO_LP } from "@/lib/scoring";
import type { Letra } from "@/lib/types";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

function respostasCorretas(): Record<string, Letra> {
  return Object.fromEntries(questoes.map((q) => [String(q.numero), q.correta]));
}

function respostasErradas(): Record<string, Letra> {
  return Object.fromEntries(
    questoes.map((q) => [String(q.numero), LETRAS.find((l) => l !== q.correta)!]),
  );
}

describe("correção e travas do edital", () => {
  it("gabaritando tudo, nota 10 e aprovado", () => {
    const r = corrigir(questoes, respostasCorretas());
    expect(r.acertos).toBe(70);
    expect(r.nota).toBe(10);
    expect(r.aprovado).toBe(true);
    expect(r.erros).toEqual([]);
  });

  it("zerando tudo, nota 0 e reprovado", () => {
    const r = corrigir(questoes, respostasErradas());
    expect(r.acertos).toBe(0);
    expect(r.nota).toBe(0);
    expect(r.aprovado).toBe(false);
    expect(r.erros).toHaveLength(70);
  });

  it("reprova com menos de 8 acertos em Português, mesmo com o resto perfeito", () => {
    const respostas = respostasCorretas();
    for (const q of questoes.filter((x) => x.materia === "Língua Portuguesa").slice(0, 9)) {
      respostas[String(q.numero)] = LETRAS.find((l) => l !== q.correta)!;
    }
    const r = corrigir(questoes, respostas);
    const lp = r.blocos.find((b) => b.bloco === "Língua Portuguesa")!;
    expect(lp.acertos).toBe(7);
    expect(lp.ok).toBe(false);
    expect(r.nota).toBeGreaterThanOrEqual(5);
    expect(r.aprovado).toBe(false);
  });

  it("reprova com menos de 15 acertos em Direito, mesmo com nota acima de 5", () => {
    const respostas = respostasCorretas();
    for (const q of questoes.filter((x) => x.materia === "Conhecimentos em Direito").slice(0, 16)) {
      respostas[String(q.numero)] = LETRAS.find((l) => l !== q.correta)!;
    }
    const r = corrigir(questoes, respostas);
    const direito = r.blocos.find((b) => b.bloco === "Conhecimentos em Direito")!;
    expect(direito.acertos).toBe(14);
    expect(direito.ok).toBe(false);
    expect(r.aprovado).toBe(false);
  });

  it("reprova por nota final abaixo de 5,0 mesmo passando nas duas travas", () => {
    // mantém exatamente 8 em LP e 15 em Direito (travas ok) e erra todas as demais:
    // 23 acertos em 70 = 3,29 — abaixo de 5,0.
    const respostas = respostasCorretas();
    const manter = new Set([
      ...questoes.filter((q) => q.materia === "Língua Portuguesa").slice(0, 8).map((q) => q.numero),
      ...questoes
        .filter((q) => q.materia === "Conhecimentos em Direito")
        .slice(0, 15)
        .map((q) => q.numero),
    ]);
    for (const q of questoes) {
      if (!manter.has(q.numero)) {
        respostas[String(q.numero)] = LETRAS.find((l) => l !== q.correta)!;
      }
    }
    const r = corrigir(questoes, respostas);
    expect(r.blocos[0].ok).toBe(true);
    expect(r.blocos[1].ok).toBe(true);
    expect(r.nota).toBeLessThan(5);
    expect(r.aprovado).toBe(false);
  });

  it("conta em branco como erro", () => {
    const r = corrigir(questoes, {});
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
