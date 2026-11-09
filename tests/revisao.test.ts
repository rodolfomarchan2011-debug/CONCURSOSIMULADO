import { describe, expect, it } from "vitest";
import { agendar, DIA, INTERVALOS_DIAS } from "@/lib/revisao";

const AGORA = 1_700_000_000_000;

describe("agenda de revisão espaçada", () => {
  it("erro volta ao nível 0 e agenda para amanhã", () => {
    expect(agendar(4, false, AGORA)).toEqual({
      nivel: 0,
      proximaEm: AGORA + DIA,
    });
  });

  it("acerto sobe um nível e usa o intervalo correspondente", () => {
    const r = agendar(0, true, AGORA);
    expect(r.nivel).toBe(1);
    expect(r.proximaEm).toBe(AGORA + INTERVALOS_DIAS[1] * DIA);

    const r2 = agendar(1, true, AGORA);
    expect(r2.nivel).toBe(2);
    expect(r2.proximaEm).toBe(AGORA + INTERVALOS_DIAS[2] * DIA);
  });

  it("não passa do nível máximo", () => {
    const r = agendar(5, true, AGORA);
    expect(r.nivel).toBe(INTERVALOS_DIAS.length - 1);
    expect(r.proximaEm).toBe(AGORA + INTERVALOS_DIAS[5] * DIA);
  });
});
