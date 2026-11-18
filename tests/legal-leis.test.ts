import { describe, expect, it } from "vitest";
import { buscarBaseLegal, infoBaseLegal } from "@/lib/legal";

describe("leis ingeridas em D0", () => {
  it("recupera o art. 1º da Lei 8.429/92", () => {
    const arts = buscarBaseLegal("art. 1º da Lei 8.429 — improbidade administrativa", 6);
    expect(arts.some((a) => a.lei === "L8429" && a.artigo === "1")).toBe(true);
  });

  it("recupera o art. 5º da Lei 9.099/95", () => {
    const arts = buscarBaseLegal("art. 5º da Lei 9.099 — juizado especial", 6);
    expect(arts.some((a) => a.lei === "L9099" && a.artigo === "5")).toBe(true);
  });

  it("não tem artigo vazio nas leis novas", () => {
    const arts = buscarBaseLegal("pessoa com deficiência acessibilidade", 8);
    for (const a of arts) expect(a.texto.trim().length).toBeGreaterThan(20);
  });

  it("status reporta as 8 fontes", () => {
    const info = infoBaseLegal();
    expect(Object.keys(info.fontes)).toHaveLength(8);
    expect(info.artigos).toBeGreaterThan(3000);
  });
});
