import { describe, expect, it } from "vitest";
import { sortearSimulado, sortearTreino, vigentePorAssunto } from "@/lib/selecao";
import { QUOTAS, questoes } from "@/lib/banco";

describe("validade editorial no simulado", () => {
  it("Atualidades antigas e Informática antiga não são elegíveis", () => {
    const velhas = questoes.filter(
      (q) =>
        (q.assunto === "Atualidades" && q.ano < 2024) ||
        (q.assunto === "Informática" && q.ano < 2023),
    );
    expect(velhas.length).toBeGreaterThan(0);
    for (const q of velhas) expect(vigentePorAssunto(q)).toBe(false);
  });

  it("200 sorteios não trazem Atualidades < 2024 nem Informática < 2023", () => {
    for (let i = 0; i < 200; i += 1) {
      const s = sortearSimulado();
      expect(s).toHaveLength(70);
      for (const q of s) {
        if (q.assunto === "Atualidades") expect(q.ano).toBeGreaterThanOrEqual(2024);
        if (q.assunto === "Informática") expect(q.ano).toBeGreaterThanOrEqual(2023);
        expect(q.status_vigencia).not.toBe("desatualizada_por_lei");
      }
      expect(s.filter((q) => q.materia === "Língua Portuguesa")).toHaveLength(QUOTAS.lp);
      expect(s.filter((q) => q.materia === "Conhecimentos em Direito")).toHaveLength(
        QUOTAS.direito,
      );
    }
  });

  it("treino continua permitindo questões antigas para prática", () => {
    const antigas = sortearTreino(questoes, "Atualidades").filter((q) => q.ano < 2024);
    expect(antigas.length).toBeGreaterThan(0);
  });
});
