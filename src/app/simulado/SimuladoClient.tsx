"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Grid3X3,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { Badge, Card, buttonClass } from "@/components/ui";
import { QuestionBody } from "@/components/QuestionBody";
import { ExplicacaoBox } from "@/components/ExplicacaoBox";
import { porId, questoes, contextoDa } from "@/lib/banco";
import { corrigir, validarMatriz } from "@/lib/scoring";
import { sortearSimulado } from "@/lib/selecao";
import { DURACAO_PROVA_MIN, formatarDuracao, restanteMs } from "@/lib/timer";
import { lerTempoAdicional, salvarTempoAdicional } from "@/lib/prefs";
import {
  carregarSessao,
  novoId,
  salvarSessao,
  sessaoAberta,
  type SessaoRow,
} from "@/lib/db";
import type { Letra, Questao } from "@/lib/types";
import { cn } from "@/lib/cn";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];
const TOTAL = 70;

export function SimuladoClient() {
  const router = useRouter();
  const params = useSearchParams();
  const forcarNovo = params.get("novo") === "1";

  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<SessaoRow | null>(null);
  const [restante, setRestante] = useState(DURACAO_PROVA_MIN * 60_000);
  const [salvoEm, setSalvoEm] = useState<number | null>(null);
  const [grade, setGrade] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [extraMin, setExtraMin] = useState(0);
  const [modoEstudo, setModoEstudo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const finalizando = useRef(false);

  const selecionadas: Questao[] = useMemo(() => {
    if (!sessao?.questaoIds) return [];
    return sessao.questaoIds.map((id) => porId[id]).filter(Boolean) as Questao[];
  }, [sessao]);

  const indice = Math.min(
    Math.max(0, sessao?.atual ?? 0),
    Math.max(0, selecionadas.length - 1),
  );
  const questao = selecionadas[indice];
  const respondidas = sessao ? Object.keys(sessao.respostas).length : 0;

  const parcial = useMemo(() => {
    if (!sessao || selecionadas.length === 0) return null;
    return corrigir(selecionadas, sessao.respostas);
  }, [sessao, selecionadas]);

  const validacao = useMemo(() => validarMatriz(selecionadas), [selecionadas]);

  const finalizar = useCallback(
    async (alvo?: SessaoRow) => {
      const base = alvo ?? sessao;
      if (!base || base.finalizadaEm || finalizando.current) return;
      finalizando.current = true;
      const final: SessaoRow = { ...base, finalizadaEm: Date.now() };
      await salvarSessao(final);
      router.push(`/resultado?id=${final.id}`);
    },
    [router, sessao],
  );

  useEffect(() => {
    setExtraMin(lerTempoAdicional());
    (async () => {
      if (!forcarNovo) {
        const aberta = await sessaoAberta();
        if (aberta?.questaoIds?.length) {
          if (aberta.terminaEm <= Date.now()) {
            setCarregando(false);
            await finalizar(aberta);
            return;
          }
          setSessao(aberta);
          setModoEstudo(aberta.modoEstudo ?? true);
          setRestante(restanteMs(aberta.terminaEm));
          setCarregando(false);
          return;
        }
      }
      setCarregando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcarNovo]);

  useEffect(() => {
    if (!sessao) return;
    const tick = () => {
      const r = restanteMs(sessao.terminaEm);
      setRestante(r);
      if (r <= 0) void finalizar(sessao);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [sessao, finalizar]);

  async function iniciar() {
    const extra = Math.min(120, Math.max(0, Math.floor(extraMin)));
    salvarTempoAdicional(extra);
    try {
      const sorteadas = sortearSimulado(questoes);
      const agora = Date.now();
      const nova: SessaoRow = {
        id: novoId(),
        modo: "simulado",
        criadaEm: agora,
        terminaEm: agora + (DURACAO_PROVA_MIN + extra) * 60_000,
        duracaoMin: DURACAO_PROVA_MIN,
        respostas: {},
        marcadas: [],
        atual: 0,
        modoEstudo,
        questaoIds: sorteadas.map((q) => q.id),
      };
      await salvarSessao(nova);
      finalizando.current = false;
      setErro(null);
      setSessao(nova);
      setRestante(restanteMs(nova.terminaEm));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível montar o simulado.");
    }
  }

  async function atualizar(mudanca: Partial<SessaoRow>) {
    if (!sessao) return;
    const nova = { ...sessao, ...mudanca };
    setSessao(nova);
    await salvarSessao(nova);
    setSalvoEm(Date.now());
  }

  const responder = useCallback(
    (letra: Letra) => {
      if (!sessao || !questao) return;
      void atualizar({
        respostas: { ...sessao.respostas, [questao.id]: letra },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessao, questao],
  );

  const irPara = useCallback(
    (novoIndice: number) => {
      const alvo = Math.min(TOTAL - 1, Math.max(0, novoIndice));
      if (!sessao) return;
      void atualizar({ atual: alvo });
      setGrade(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessao],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!sessao || confirmar || grade) return;
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA") return;
      const letra = e.key.toUpperCase() as Letra;
      if (LETRAS.includes(letra)) {
        e.preventDefault();
        responder(letra);
      }
      if (e.key === "ArrowRight") irPara(indice + 1);
      if (e.key === "ArrowLeft") irPara(indice - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessao, responder, irPara, confirmar, grade, indice]);

  if (carregando) {
    return <p className="py-16 text-center text-sm text-ink-500">Carregando simulado…</p>;
  }

  if (!sessao || !questao) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">simulado completo</Badge>
            <Badge>70 questões sorteadas</Badge>
            <Badge>5 horas</Badge>
            <Badge>banco {questoes.length} questões</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Pronto para a prova?</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Cada simulado sorteia 70 questões do banco (16 de Português, 30 de Direito e 24
              de Conhecimentos Gerais), na matriz do edital de 2027. O progresso é salvo neste
              navegador a cada resposta — se recarregar, continua de onde parou.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Português", valor: "16 questões", detalhe: "mínimo 8 acertos" },
              { label: "Direito", valor: "30 questões", detalhe: "mínimo 15 acertos" },
              { label: "Gerais", valor: "24 questões", detalhe: "4/4/9/7" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {b.label}
                </div>
                <div className="mt-1 font-semibold text-ink-900">{b.valor}</div>
                <div className="text-xs text-ink-500">{b.detalhe}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-ink-100 p-4">
            <label htmlFor="extra" className="text-sm font-semibold text-ink-800">
              Tempo adicional (acessibilidade/PCD)
            </label>
            <p className="mt-1 text-xs text-ink-500">
              O edital prevê atendimento especializado. Aqui você pode simular minutos extras.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="extra"
                type="number"
                min={0}
                max={120}
                step={10}
                value={extraMin}
                onChange={(e) => setExtraMin(Number(e.target.value))}
                className="focus-ring w-24 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              />
              <span className="text-sm text-ink-500">minutos</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-100 p-4">
            <input
              type="checkbox"
              checked={modoEstudo}
              onChange={(e) => setModoEstudo(e.target.checked)}
              className="focus-ring mt-1 h-4 w-4 rounded border-ink-300"
            />
            <span>
              <span className="block text-sm font-semibold text-ink-800">Modo estudo</span>
              <span className="block text-xs leading-relaxed text-ink-500">
                Mostra o gabarito e a explicação logo depois de cada resposta. Desligado, o
                gabarito só aparece no resultado — como na prova real.
              </span>
            </span>
          </label>

          {erro ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {erro}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => void iniciar()} className={buttonClass("primary")}>
              Iniciar simulado <ChevronRight className="h-4 w-4" />
            </button>
            <Link href="/treino" className={buttonClass("secondary")}>
              Prefiro treinar por matéria
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const marcada = sessao.respostas[questao.id];
  const marcadaRevisao = sessao.marcadas.includes(indice);
  const minutosRestantes = restante / 60_000;
  const revelar = Boolean(sessao.modoEstudo && marcada);

  return (
    <div className="space-y-4">
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-ink-100 bg-ink-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-ink-500" />
            <span
              className={cn(
                "font-mono text-lg font-bold tabular-nums",
                minutosRestantes <= 10 ? "text-rose-600" : "text-ink-900",
              )}
              aria-live="polite"
            >
              {formatarDuracao(restante)}
            </span>
          </div>
          <div className="hidden items-center gap-2 text-xs text-ink-500 sm:flex">
            <span>{respondidas} de 70 respondidas</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>
              parcial: {parcial?.acertos ?? 0} acertos ({parcial?.nota.toFixed(2)})
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1 text-[11px] text-ink-400 sm:flex">
              <Save className="h-3.5 w-3.5" /> salvo localmente
              {salvoEm ? ` às ${new Date(salvoEm).toLocaleTimeString("pt-BR").slice(0, 5)}` : ""}
            </span>
            <button
              type="button"
              onClick={() => setGrade(true)}
              className={buttonClass("secondary", "px-3 py-2 text-xs")}
            >
              <Grid3X3 className="h-4 w-4" /> Grade
            </button>
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className={buttonClass("danger", "px-3 py-2 text-xs")}
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Questão {indice + 1} de 70 · prova {questao.ano}
            </div>
            <button
              type="button"
              onClick={() =>
                void atualizar({
                  marcadas: marcadaRevisao
                    ? sessao.marcadas.filter((n) => n !== indice)
                    : [...sessao.marcadas, indice],
                })
              }
              className={cn(
                "focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold",
                marcadaRevisao ? "bg-amber-100 text-amber-800" : "text-ink-500 hover:bg-ink-100",
              )}
            >
              <Flag className="h-3.5 w-3.5" /> {marcadaRevisao ? "marcada" : "marcar"}
            </button>
          </div>

          <QuestionBody
            questao={questao}
            contexto={contextoDa(questao)}
            selecionada={marcada ?? null}
            revelado={revelar}
            onSelect={responder}
          />

          {revelar ? <ExplicacaoBox questao={questao} escolha={marcada} /> : null}

          <div className="flex items-center justify-between gap-2 border-t border-ink-100 pt-4">
            <button
              type="button"
              onClick={() => irPara(indice - 1)}
              disabled={indice === 0}
              className={buttonClass("secondary", "px-3 py-2 text-xs")}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>

            <div className="flex items-center gap-2">
              {marcada ? (
                <button
                  type="button"
                  onClick={() => {
                    const respostas = { ...sessao.respostas };
                    delete respostas[questao.id];
                    void atualizar({ respostas });
                  }}
                  className={buttonClass("ghost", "px-2 py-2 text-xs")}
                >
                  <X className="h-3.5 w-3.5" /> limpar
                </button>
              ) : null}
              {indice < selecionadas.length - 1 ? (
                <button
                  type="button"
                  onClick={() => irPara(indice + 1)}
                  className={buttonClass("primary", "px-3 py-2 text-xs")}
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmar(true)}
                  className={buttonClass("primary", "px-3 py-2 text-xs")}
                >
                  Revisar e finalizar
                </button>
              )}
            </div>
          </div>
        </Card>

        <aside className="hidden space-y-3 lg:block">
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-ink-900">Progresso</h2>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${(respondidas / TOTAL) * 100}%` }}
              />
            </div>
            <p className="text-xs text-ink-500">
              {respondidas}/70 respondidas · {sessao.marcadas.length} marcadas
            </p>
            <div className="grid grid-cols-10 gap-1">
              {selecionadas.map((q, i) => {
                const respondida = Boolean(sessao.respostas[q.id]);
                const marcadaGrade = sessao.marcadas.includes(i);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => irPara(i)}
                    className={cn(
                      "focus-ring grid h-6 w-6 place-items-center rounded text-[10px] font-semibold",
                      i === indice && "ring-2 ring-brand-500",
                      respondida ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200",
                      marcadaGrade && "ring-2 ring-amber-400",
                    )}
                    aria-label={`Ir para a questão ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-4 text-xs text-ink-500">
            <p className="font-semibold text-ink-700">Atalhos</p>
            <p className="mt-1">A–E respondem</p>
            <p>← → navegam</p>
          </Card>
        </aside>
      </div>

      {grade ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-900/50 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Grade de questões</h2>
              <button
                type="button"
                onClick={() => setGrade(false)}
                className="focus-ring rounded-lg p-1 hover:bg-ink-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-500">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-brand-600" /> respondida
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-ink-100" /> em branco
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded ring-2 ring-amber-400" /> marcada
              </span>
            </div>
            <div className="mt-4 grid grid-cols-8 gap-2 sm:grid-cols-10">
              {selecionadas.map((q, i) => {
                const respondida = Boolean(sessao.respostas[q.id]);
                const marcadaGrade = sessao.marcadas.includes(i);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => irPara(i)}
                    className={cn(
                      "focus-ring grid h-9 place-items-center rounded-lg text-xs font-semibold",
                      respondida ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700",
                      marcadaGrade && "ring-2 ring-amber-400",
                      i === indice && "outline outline-2 outline-ink-900",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {confirmar ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/60 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h2 className="text-lg font-semibold">Finalizar simulado?</h2>
            <p className="mt-2 text-sm text-ink-600">
              Você respondeu {respondidas} de 70 questões. As {70 - respondidas} em branco contam
              como erro. O tempo restante ({formatarDuracao(restante)}) seria o disponível para a
              redação.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmar(false)} className={buttonClass("secondary")}>
                Continuar prova
              </button>
              <button type="button" onClick={() => void finalizar()} className={buttonClass("danger")}>
                <Check className="h-4 w-4" /> Finalizar agora
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!validacao.ok ? (
        <p className="flex items-center gap-1 text-[11px] text-rose-600">
          <AlertTriangle className="h-3 w-3" /> matriz fora do padrão: {validacao.problemas.join("; ")}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-xs text-ink-400">
        <button
          type="button"
          onClick={() => {
            if (confirm("Descartar este simulado e começar outro? O progresso atual será perdido.")) {
              void (async () => {
                const atual = await carregarSessao(sessao.id);
                if (atual) await salvarSessao({ ...atual, finalizadaEm: Date.now() });
                window.location.assign("/simulado");
              })();
            }
          }}
          className="focus-ring inline-flex items-center gap-1 hover:text-ink-700"
        >
          <RotateCcw className="h-3.5 w-3.5" /> recomeçar
        </button>
        <span>salvamento automático ativo</span>
      </div>
    </div>
  );
}
