import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { filaDevidas, registrarResposta } from "@/lib/revisao";
import { listarRevisoes, salvarRevisao } from "@/lib/db";

describe("treino alimenta a revisão espaçada", () => {
  it("5 respostas no treino criam 5 registros em revisoes", async () => {
    const ids = ["srs-a", "srs-b", "srs-c", "srs-d", "srs-e"];
    const confiancas = [1, 2, 3, 2, 1] as const;
    const acertos = [false, true, false, false, true];

    for (let i = 0; i < ids.length; i += 1) {
      await registrarResposta(ids[i], acertos[i], confiancas[i]);
    }

    const todas = await listarRevisoes();
    const criadas = todas.filter((r) => ids.includes(r.id));
    expect(criadas).toHaveLength(5);
    expect(criadas.every((r) => typeof r.confianca === "number")).toBe(true);
  });

  it("erro confiante sobe para o topo da fila", async () => {
    const agora = Date.now();
    await salvarRevisao({
      id: "prioridade-normal",
      nivel: 0,
      proximaEm: agora - 2000,
      ultimaEm: agora - 3000,
      erros: 1,
      acertos: 0,
      erroConfiante: false,
    });
    await salvarRevisao({
      id: "prioridade-confia-te",
      nivel: 0,
      proximaEm: agora - 1000,
      ultimaEm: agora - 2000,
      erros: 1,
      acertos: 0,
      erroConfiante: true,
    });

    const fila = await filaDevidas(50);
    const primeiro = fila.find(
      (r) => r.id === "prioridade-normal" || r.id === "prioridade-confia-te",
    );
    expect(primeiro?.id).toBe("prioridade-confia-te");
  });
});
