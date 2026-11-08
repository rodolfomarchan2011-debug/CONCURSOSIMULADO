import { describe, expect, it } from "vitest";
import {
  criarTerminaEm,
  expirou,
  formatarDuracao,
  restanteMs,
  DURACAO_PROVA_MIN,
} from "@/lib/timer";

describe("cronômetro por timestamp", () => {
  it("cria término com duração de 5 horas", () => {
    const inicio = 1_000_000;
    expect(criarTerminaEm(inicio, DURACAO_PROVA_MIN)).toBe(inicio + 300 * 60_000);
  });

  it("soma tempo adicional", () => {
    const inicio = 0;
    expect(criarTerminaEm(inicio, 300, 30)).toBe(330 * 60_000);
  });

  it("restante nunca fica negativo", () => {
    expect(restanteMs(1000, 5000)).toBe(0);
    expect(restanteMs(5000, 1000)).toBe(4000);
  });

  it("detecta expiração", () => {
    expect(expirou(1000, 1000)).toBe(true);
    expect(expirou(1001, 1000)).toBe(false);
  });

  it("formata horas, minutos e segundos", () => {
    expect(formatarDuracao(300 * 60_000)).toBe("5:00:00");
    expect(formatarDuracao(65_000)).toBe("01:05");
    expect(formatarDuracao(0)).toBe("00:00");
  });

  it("sobrevive a recarga: o cálculo depende só do timestamp gravado", () => {
    const inicio = 10_000;
    const termina = criarTerminaEm(inicio, 300);
    // simula 1h de prova e uma recarga: o valor é recalculado do zero
    expect(restanteMs(termina, inicio + 60 * 60_000)).toBe(240 * 60_000);
    expect(restanteMs(termina, inicio + 60 * 60_000)).toBe(restanteMs(termina, inicio + 60 * 60_000));
  });
});
