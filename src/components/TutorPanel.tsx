"use client";

import { useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import type { Letra, Questao } from "@/lib/types";
import { deviceId } from "@/lib/prefs";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/cn";

interface Mensagem {
  papel: "user" | "assistant";
  texto: string;
}

export function TutorPanel({
  questao,
  escolha,
  rotulo = "Explicar com o tutor",
}: {
  questao: Questao;
  escolha?: Letra | null;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement | null>(null);

  async function enviar(texto: string) {
    const limpo = texto.trim();
    if (carregando) return;
    setErro(null);
    setAberto(true);

    const historico = [
      ...mensagens,
      ...(limpo ? [{ papel: "user" as const, texto: limpo }] : []),
    ];
    setMensagens(historico);
    setPergunta("");
    setCarregando(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: questao.numero,
          escolha: escolha ?? null,
          pergunta: limpo,
          deviceId: deviceId(),
          historico: mensagens.slice(-4),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`falha ${res.status}`);
      }

      setMensagens((atual) => [...atual, { papel: "assistant", texto: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acumulado = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const partes = buffer.split("\n\n");
        buffer = partes.pop() ?? "";
        for (const parte of partes) {
          const linha = parte.trim();
          if (!linha.startsWith("data:")) continue;
          const dados = linha.slice(5).trim();
          if (dados === "[DONE]") continue;
          try {
            const json = JSON.parse(dados) as { delta?: string; erro?: string };
            if (json.erro) throw new Error(json.erro);
            if (json.delta) {
              acumulado += json.delta;
              setMensagens((atual) => {
                const copia = [...atual];
                copia[copia.length - 1] = { papel: "assistant", texto: acumulado };
                return copia;
              });
            }
          } catch {
            /* chunk parcial */
          }
        }
        fim.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? `Não foi possível falar com o tutor agora (${e.message}).`
          : "Não foi possível falar com o tutor agora.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50/40">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={() => enviar("")} className={buttonClass("primary", "px-3 py-2 text-xs")}>
          <Sparkles className="h-4 w-4" /> {rotulo}
        </button>
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className={buttonClass("ghost", "px-3 py-2 text-xs")}
          aria-expanded={aberto}
        >
          <Bot className="h-4 w-4" /> {aberto ? "Fechar chat" : "Tirar dúvida"}
        </button>
        {aberto ? (
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              setMensagens([]);
              setErro(null);
            }}
            className="focus-ring ml-auto rounded-lg p-1 text-ink-500 hover:bg-white"
            aria-label="Limpar conversa"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {aberto ? (
        <div className="space-y-3 border-t border-brand-200 p-3">
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {mensagens.length === 0 && !carregando ? (
              <p className="text-xs text-ink-500">
                Pergunte qualquer coisa sobre esta questão: o fundamento, a pegadinha, o artigo
                de lei, ou peça um exemplo.
              </p>
            ) : null}
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-line rounded-lg p-2.5 text-sm leading-relaxed",
                  m.papel === "user"
                    ? "ml-6 bg-white text-ink-800"
                    : "mr-2 bg-ink-900 text-ink-50",
                )}
              >
                {m.texto || (carregando && i === mensagens.length - 1 ? "…" : "")}
              </div>
            ))}
            {carregando ? (
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> consultando a base…
              </div>
            ) : null}
            <div ref={fim} />
          </div>

          {erro ? <p className="text-xs text-rose-700">{erro}</p> : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar(pergunta);
            }}
            className="flex gap-2"
          >
            <input
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder="Ex.: por que a letra B está errada?"
              className="focus-ring min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
              maxLength={600}
            />
            <button
              type="submit"
              disabled={carregando || pergunta.trim().length < 3}
              className={buttonClass("primary", "px-3 py-2")}
              aria-label="Enviar pergunta"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-ink-400">
            Respostas geradas por IA podem conter erros. Confira sempre a fonte citada. Sem chave
            de IA configurada, o tutor usa apenas a base local.
          </p>
        </div>
      ) : null}
    </div>
  );
}
