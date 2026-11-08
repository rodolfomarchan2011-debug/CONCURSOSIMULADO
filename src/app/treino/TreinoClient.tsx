"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw, Shuffle, Target } from "lucide-react";
import { Badge, Card, buttonClass } from "@/components/ui";
import { QuestionBody } from "@/components/QuestionBody";
import { ExplicacaoBox } from "@/components/ExplicacaoBox";
import { ASSUNTOS, contextoDa, questoes } from "@/lib/banco";
import { sortearTreino } from "@/lib/selecao";
import type { Letra, Questao } from "@/lib/types";
import { cn } from "@/lib/cn";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

export function TreinoClient() {
  const [assunto, setAssunto] = useState<string>("todas");
  const [lista, setLista] = useState<Questao[]>([]);
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState<Letra | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [respondidas, setRespondidas] = useState(0);

  useEffect(() => {
    setLista(sortearTreino(questoes, assunto === "todas" ? undefined : assunto));
    setIndice(0);
    setSelecionada(null);
    setRevelado(false);
    setAcertos(0);
    setRespondidas(0);
  }, [assunto]);

  const questao = lista[Math.min(indice, Math.max(0, lista.length - 1))];

  function responder(letra: Letra) {
    if (revelado || !questao) return;
    setSelecionada(letra);
    setRevelado(true);
    setRespondidas((n) => n + 1);
    if (letra === questao.correta) setAcertos((n) => n + 1);
  }

  function proxima() {
    if (indice + 1 >= lista.length) return;
    setIndice((i) => i + 1);
    setSelecionada(null);
    setRevelado(false);
  }

  function reiniciar() {
    setLista(sortearTreino(questoes, assunto === "todas" ? undefined : assunto));
    setIndice(0);
    setSelecionada(null);
    setRevelado(false);
    setAcertos(0);
    setRespondidas(0);
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
            Treino aleatório com feedback imediato
          </p>
          <h1 className="text-2xl font-bold text-ink-900">Treine por matéria</h1>
          <p className="text-sm text-ink-600">
            As questões são sorteadas do banco de {questoes.length} — cada sessão vem em ordem
            diferente.
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

            {questao.status_vigencia !== "vigente" ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                Questão da edição {questao.edicao}. Legislação pode ter mudado — confira o texto
                atual antes de memorizar. Por isso ela não entra no simulado oficial.
              </p>
            ) : null}

            {revelado ? (
              <div className="space-y-3 border-t border-ink-100 pt-4">
                <ExplicacaoBox questao={questao} escolha={selecionada} />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-ink-400">
                    {questao.fonte}, p. {questao.fonte_pagina} · edição {questao.edicao}
                  </p>
                  {fim ? (
                    <button type="button" onClick={reiniciar} className={buttonClass("primary")}>
                      Nova rodada <Shuffle className="h-4 w-4" />
                    </button>
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
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Shuffle className="h-4 w-4" /> Sessão de treino
              </h2>
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
                onClick={reiniciar}
                className={buttonClass("secondary", "w-full px-3 py-2 text-xs")}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Embaralhar de novo
              </button>
            </Card>

            <Card className="space-y-2 p-4 text-xs text-ink-600">
              <Badge tone="brand">dica</Badge>
              <p>
                Errou? Antes de pedir a explicação, escreva em uma frase o motivo do erro. Isso
                fixa mais do que reler o gabarito.
              </p>
              <p className="text-ink-400">
                Banco com questões de {[...new Set(questoes.map((q) => q.edicao))].join(", ")}.
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
