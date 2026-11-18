"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Sparkles, XCircle } from "lucide-react";
import type { Letra, Questao } from "@/lib/types";
import { getExplicacaoV2 } from "@/lib/explicacaoV2";
import { aulasDaQuestao } from "@/lib/aulas";
import { obterExplicacao, streamTutor } from "@/lib/tutorStream";
import { Badge } from "@/components/ui";
import { TutorPanel } from "@/components/TutorPanel";
import { cn } from "@/lib/cn";
import Link from "next/link";

/**
 * Feedback imediato. A tela já revela o gabarito nas alternativas; aqui fica
 * só uma linha de status e o raciocínio. Quando não há explicação revisada,
 * a IA é chamada automaticamente (com cache persistente) e o texto aparece
 * sem repetir a letra do gabarito.
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
  const exp = getExplicacaoV2(questao);
  const aula = aulasDaQuestao(questao)[0];
  const acertou = escolha === questao.correta;

  const [texto, setTexto] = useState("");
  const [gerando, setGerando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (exp) return;
    let ativo = true;
    const controller = new AbortController();
    setFalhou(false);

    (async () => {
      setFalhou(false);
      setGerando(true);
      try {
        const salvo = await obterExplicacao(questao, escolha, async () => {
          let acumulado = "";
          await streamTutor({
            questao,
            escolha,
            onDelta: (delta) => {
              acumulado += delta;
              if (ativo) setTexto(acumulado);
            },
            signal: controller.signal,
          });
          return acumulado;
        });
        if (ativo) setTexto(salvo);
      } catch {
        if (ativo && !controller.signal.aborted) setFalhou(true);
      } finally {
        if (ativo) setGerando(false);
      }
    })();

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [questao, escolha, exp]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm font-semibold",
          acertou ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
        )}
      >
        {acertou ? (
          <>
            <CheckCircle2 className="h-5 w-5" /> Você acertou
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" />
            Você marcou {escolha ?? "—"} · a correta é {questao.correta}
          </>
        )}
      </div>

      <details className="rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2">
        <summary className="focus-ring flex cursor-pointer items-center gap-1 text-xs font-semibold text-ink-600">
          Ver alternativa que a banca marcou <ChevronDown className="h-3.5 w-3.5" />
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">
          {questao.alternativas[questao.correta]}
        </p>
      </details>

      {exp ? (
        <div className="rounded-xl border border-ink-100 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-900">Como se resolve</p>
            {exp.revisado ? (
              <Badge tone="green">Revisado</Badge>
            ) : (
              <Badge tone="amber">Base curada — não revisada</Badge>
            )}
          </div>
          {exp.raciocinio.length ? (
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-ink-700">
              {exp.raciocinio.map((passo, i) => (
                <li key={i}>{passo}</li>
              ))}
            </ol>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-ink-700">{exp.porque_correta}</p>
          {exp.fundamento_legal[0] ? (
            <p className="mt-2 text-xs text-ink-500">
              Fundamento: {exp.fundamento_legal[0].lei} art.{" "}
              {exp.fundamento_legal[0].artigo} — {exp.fundamento_legal[0].trecho}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-800">
              <Sparkles className="h-3.5 w-3.5" /> Explicação da IA
            </p>
            <Badge tone="amber">não revisado</Badge>
          </div>

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

      {aula ? (
        <Link
          href={`/estudar/${aula.id}`}
          className="focus-ring inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
        >
          📖 Estudar: {aula.topico}
        </Link>
      ) : null}

      {!compacto ? <TutorPanel questao={questao} escolha={escolha} /> : null}
    </div>
  );
}
