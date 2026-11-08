import { describe, expect, it } from "vitest";
import { buscarBaseLegal, infoBaseLegal } from "@/lib/legal";

describe("base legal oficial", () => {
  it("indexa os quatro códigos", () => {
    const info = infoBaseLegal();
    expect(info.artigos).toBeGreaterThan(2000);
    expect(Object.keys(info.fontes).sort()).toEqual(["CF", "CP", "CPC", "CPP"]);
  });

  it("acha o artigo citado na consulta", () => {
    const arts = buscarBaseLegal("art. 316 do Código Penal — concussão, exigir vantagem indevida");
    expect(arts[0]?.lei).toBe("CP");
    expect(arts[0]?.artigo).toBe("316");
    expect(arts[0]?.texto).toContain("Exigir");
  });

  it("respeita o código indicado pelo assunto", () => {
    const arts = buscarBaseLegal("prisão em flagrante e audiência de custódia", 6);
    expect(arts.some((a) => a.lei === "CPP")).toBe(true);
  });

  it("traz a Constituição para tema constitucional", () => {
    const arts = buscarBaseLegal("direito à igualdade e inviolabilidade da vida", 6);
    expect(arts.some((a) => a.lei === "CF")).toBe(true);
  });
});
