"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { Badge, Card, buttonClass } from "@/components/ui";
import { QuestionBody } from "@/components/QuestionBody";
import { TutorPanel } from "@/components/TutorPanel";
import { ASSUNTOS, contextoDa, questoes } from "@/lib/banco";
import { getExplicacao } from "@/lib/explicacoes";
import type { Letra } from "@/lib/types";
import { cn } from "@/lib/cn";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

export function TreinoClient() {
  const [assunto, setAssunto] = useState<string>("todas");
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState<Letra | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [respondidas, setRespondidas] = useState(0);

  const lista = useMemo(
    () => (assunto === "todas" ? questoes : questoes.filter((q) => q.assunto === assunto)),
    [assunto],
  );

  const questao = lista[Math.min(indice, Math.max(0, lista.length - 1))];
  const exp = questao ? getExplicacao(questao) : null;

  useEffect(() => {
    setIndice(0);
    setSelecionada(null);
    setRevelado(false);
    setAcertos(0);
    setRespondidas(0);
  }, [assunto]);

  function responder(letra: Letra) {
    if (revelado || !questao) return;
    setSelecionada(letra);
    setRevelado(true);
    setRespondidas((n) => n + 1);
    if (letra === questao.correta) setAcertos((n) => n + 1);
  }

  function proxima() {
    if (!questao) return;
    if (indice + 1 >= lista.length) return;
    setIndice((i) => i + 1);
    setSelecionada(null);
    setRevelado(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA") return;
      const letra = e.key.toUpperCase() as Letra;
      if (LETRAS.includes(letra)) {
        e.preventDefault();
        responder(letra);
      }
      if (e.key === "ArrowRight" && revelado) proxima();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revelado, indice, lista.length, questao]);

  const fim = revelado && indice + 1 >= lista.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Treino com feedback imediato
          </p>
          <h1 className="text-2xl font-bold text-ink-900">Treine por matéria</h1>
          <p className="text-sm text-ink-600">
            Responda e veja na hora o gabarito oficial, a explicação e o tutor.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <Target className="h-4 w-4" />
          {respondidas > 0 ? `${acertos}/${respondidas} acertos` : "comece por qualquer matéria"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAssunto("todas")}
          className={cn(
            "focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            assunto === "todas"
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
          )}
        >
          Todas ({questoes.length})
        </button>
        {ASSUNTOS.map((a) => {
          const total = questoes.filter((q) => q.assunto === a).length;
          if (!total) return null;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAssunto(a)}
              className={cn(
                "focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                assunto === a
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
              )}
            >
              {a} ({total})
            </button>
          );
        })}
      </div>

      {!questao ? (
        <Card>Sem questões para esta matéria.</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-500">
              <span>
                {indice + 1} de {lista.length} · {assunto === "todas" ? "todas as matérias" : assunto}
              </span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" /> responda e veja o porquê
              </span>
            </div>

            <QuestionBody
              questao={questao}
              contexto={contextoDa(questao)}
              selecionada={selecionada}
              revelado={revelado}
              onSelect={responder}
              desabilitado={revelado}
            />

            {revelado ? (
              <div className="space-y-3 border-t border-ink-100 pt-4">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-3 text-sm font-semibold",
                    selecionada === questao.correta
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800",
                  )}
                >
                  {selecionada === questao.correta ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Você acertou — gabarito {questao.correta}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" /> Você marcou {selecionada}; o gabarito é{" "}
                      {questao.correta}
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Alternativa correta ({questao.correta})
                  </p>
                  <p className="mt-1 text-sm text-ink-800">
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
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Ainda não há explicação revisada para esta questão. Use o tutor abaixo para
                    pedir a explicação (requer chave de IA configurada no servidor).
                  </p>
                )}

                <TutorPanel questao={questao} escolha={selecionada} />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-ink-400">
                    {questao.fonte}, p. {questao.fonte_pagina}
                  </p>
                  {fim ? (
                    <Link href="/resultado" className={buttonClass("primary")}>
                      Ver resultados <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button type="button" onClick={proxima} className={buttonClass("primary")}>
                      Próxima questão <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="border-t border-ink-100 pt-3 text-xs text-ink-400">
                Selecione uma alternativa (ou tecle A–E). O gabarito aparece na hora.
              </p>
            )}
          </Card>

          <aside className="space-y-3">
            <Card className="space-y-3 p-4">
              <h2 className="text-sm font-semibold">Sessão de treino</h2>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${((indice + (revelado ? 1 : 0)) / lista.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-ink-50 p-2">
                  <p className="text-ink-500">Respondidas</p>
                  <p className="text-base font-semibold">{respondidas}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-2">
                  <p className="text-ink-500">Acertos</p>
                  <p className="text-base font-semibold">
                    {respondidas ? Math.round((acertos / respondidas) * 100) : 0}%
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIndice(0);
                  setSelecionada(null);
                  setRevelado(false);
                  setAcertos(0);
                  setRespondidas(0);
                }}
                className={buttonClass("secondary", "w-full px-3 py-2 text-xs")}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reiniciar sessão
              </button>
            </Card>

            <Card className="space-y-2 p-4 text-xs text-ink-600">
              <Badge tone="brand">dica</Badge>
              <p>
                Errou? Antes de pedir a explicação, escreva em uma frase o motivo do erro. Isso
                fixa mais do que reler o gabarito.
              </p>
              <p className="text-ink-400">
                A prova real tem 70 questões em 5 horas — média de 4min17s por questão.
              </p>
            </Card>

            <Link href="/simulado" className={buttonClass("ghost", "w-full")}>
              <ArrowLeft className="h-4 w-4" /> Ir para o simulado completo
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
