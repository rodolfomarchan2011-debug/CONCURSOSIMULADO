import { describe, expect, it } from "vitest";
import { questoes, banco } from "@/lib/banco";
import { validarMatriz } from "@/lib/scoring";

describe("banco de questões oficiais", () => {
  it("tem exatamente 70 questões numeradas de 1 a 70", () => {
    expect(questoes).toHaveLength(70);
    expect(questoes.map((q) => q.numero)).toEqual(
      Array.from({ length: 70 }, (_, i) => i + 1),
    );
  });

  it("respeita a matriz do edital (16/30/4/4/9/7)", () => {
    const v = validarMatriz(questoes);
    expect(v.problemas).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it("cada questão tem 5 alternativas A-E e gabarito válido", () => {
    for (const q of questoes) {
      expect(Object.keys(q.alternativas).sort()).toEqual(["A", "B", "C", "D", "E"]);
      for (const letra of ["A", "B", "C", "D", "E"] as const) {
        expect(q.alternativas[letra].length).toBeGreaterThan(0);
      }
      expect(["A", "B", "C", "D", "E"]).toContain(q.correta);
    }
  });

  it("não inclui questão anulada", () => {
    expect(questoes.filter((q) => q.anulada)).toEqual([]);
  });

  it("mantém proveniência e contexto das questões de interpretação", () => {
    expect(banco.meta.edital).toBe("TJSP2503 (ciclo 2025)");
    expect(banco.contextos.length).toBeGreaterThanOrEqual(3);
    for (const n of [1, 6, 11]) {
      const q = questoes.find((x) => x.numero === n)!;
      expect(q.contexto_id).toBeTruthy();
    }
  });

  it("não tem enunciado duplicado", () => {
    const hashes = new Set(questoes.map((q) => q.enunciado.slice(0, 120)));
    expect(hashes.size).toBe(70);
  });
});
