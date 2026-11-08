"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import type { Letra, Questao } from "@/lib/types";
import { getExplicacao } from "@/lib/explicacoes";
import { TutorPanel } from "@/components/TutorPanel";
import { cn } from "@/lib/cn";

/**
 * Feedback imediato padrão: gabarito, explicação curada quando existe e
 * um resumo honesto quando ainda não existe (sem inventar fundamento).
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
  const exp = getExplicacao(questao);
  const acertou = escolha === questao.correta;

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

      {exp ? (
        <div className="rounded-xl border border-ink-100 bg-white p-3">
          <p className="text-sm font-semibold text-ink-900">Por quê</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{exp.correta}</p>
          {exp.base ? (
            <p className="mt-2 text-xs text-ink-500">Fundamento: {exp.base}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Explicação detalhada ainda não revisada.</p>
            <p>
              Fundamento provável: {questao.assunto}. Use o tutor abaixo para pedir a análise
              da questão (com chave de IA configurada) ou confira a fonte oficial.
            </p>
            <p className="text-amber-800/80">
              {questao.fonte}, p. {questao.fonte_pagina}.
            </p>
          </div>
        </div>
      )}

      {!compacto ? <TutorPanel questao={questao} escolha={escolha} /> : null}
    </div>
  );
}
