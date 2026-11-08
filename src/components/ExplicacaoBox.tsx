"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, Loader2, Sparkles, XCircle } from "lucide-react";
import type { Letra, Questao } from "@/lib/types";
import { getExplicacao } from "@/lib/explicacoes";
import {
  cacheExplicacao,
  guardarExplicacao,
  streamTutor,
} from "@/lib/tutorStream";
import { TutorPanel } from "@/components/TutorPanel";
import { cn } from "@/lib/cn";

/**
 * Feedback imediato: gabarito + explicação curada. Quando a questão ainda não
 * tem explicação revisada, a IA é chamada automaticamente e o texto aparece
 * em streaming, sem precisar clicar em nada.
 */
export function ExplicacaoBox({
  questao,
  escolha,
  compacto = false,
}: {
  questao: Questao;
  escolha: Letra | null;
  compacto?: boolean;
}) {
  const curada = getExplicacao(questao);
  const acertou = escolha === questao.correta;

  const [texto, setTexto] = useState<string>(() => cacheExplicacao(questao, escolha) ?? "");
  const [gerando, setGerando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    setFalhou(false);
    if (curada) return;

    const emCache = cacheExplicacao(questao, escolha);
    if (emCache) {
      setTexto(emCache);
      return;
    }

    setTexto("");
    setGerando(true);
    const controller = new AbortController();

    (async () => {
      try {
        let acumulado = "";
        await streamTutor({
          questao,
          escolha,
          onDelta: (delta) => {
            acumulado += delta;
            if (vivo.current) setTexto(acumulado);
          },
          signal: controller.signal,
        });
        guardarExplicacao(questao, escolha, acumulado);
      } catch (e) {
        if (!controller.signal.aborted && vivo.current) setFalhou(true);
      } finally {
        if (vivo.current) setGerando(false);
      }
    })();

    return () => {
      vivo.current = false;
      controller.abort();
    };
  }, [questao, escolha, curada]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl p-3 text-sm font-semibold",
          acertou ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
        )}
      >
        {acertou ? (
          <>
            <CheckCircle2 className="h-5 w-5" /> Você acertou — gabarito {questao.correta}
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" /> Você marcou {escolha ?? "—"}; o gabarito é{" "}
            {questao.correta}
          </>
        )}
      </div>

      <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Alternativa correta ({questao.correta})
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-800">
          {questao.alternativas[questao.correta]}
        </p>
      </div>

      {curada ? (
        <div className="rounded-xl border border-ink-100 bg-white p-3">
          <p className="text-sm font-semibold text-ink-900">Por quê</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{curada.correta}</p>
          {curada.base ? (
            <p className="mt-2 text-xs text-ink-500">Fundamento: {curada.base}</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-800">
            <Sparkles className="h-3.5 w-3.5" /> Explicação da IA
          </p>

          {texto ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-800">
              {texto}
            </p>
          ) : gerando ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-ink-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> analisando a questão…
            </p>
          ) : null}

          {falhou && !texto ? (
            <p className="mt-2 text-xs text-amber-800">
              A IA não respondeu agora. Confira a fonte oficial ou tente de novo pelo chat abaixo.
            </p>
          ) : null}

          {texto ? (
            <p className="mt-2 text-[10px] text-ink-400">
              Explicação gerada por IA — confira sempre a fonte citada.
            </p>
          ) : null}
        </div>
      )}

      {!compacto ? <TutorPanel questao={questao} escolha={escolha} /> : null}
    </div>
  );
}
