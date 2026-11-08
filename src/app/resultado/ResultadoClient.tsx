"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Flag,
  RefreshCw,
  Timer,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge, Card, buttonClass } from "@/components/ui";
import { TutorPanel } from "@/components/TutorPanel";
import { contextoDa, getQuestao, porId, questoes } from "@/lib/banco";
import { getExplicacao } from "@/lib/explicacoes";
import { corrigir, NOTA_MINIMA, NOTA_REDACAO_MINIMA } from "@/lib/scoring";
import { formatarDuracao } from "@/lib/timer";
import { exportarProgresso } from "@/lib/prefs";
import { carregarSessao, importarSessoes, listarSessoes, type SessaoRow } from "@/lib/db";
import type { Questao } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Questões efetivamente usadas na sessão (com fallback para sessões antigas). */
function selecaoDaSessao(s: SessaoRow): Questao[] {
  if (s.questaoIds?.length) {
    return s.questaoIds.map((id) => porId[id]).filter(Boolean) as Questao[];
  }
  return questoes.filter((q) => q.edicao === "2025").slice(0, 70);
}

export function ResultadoClient() {
  const params = useSearchParams();
  const id = params.get("id");

  const [sessao, setSessao] = useState<SessaoRow | null | undefined>(undefined);
  const [historico, setHistorico] = useState<SessaoRow[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [avisoImport, setAvisoImport] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (id) {
        const s = await carregarSessao(id);
        setSessao(s ?? null);
      } else {
        setSessao(null);
      }
      const todas = await listarSessoes();
      setHistorico(todas.filter((s) => s.finalizadaEm));
    })();
  }, [id]);

  const resultado = useMemo(() => {
    if (!sessao) return null;
    const tempoRestanteMs = Math.max(
      0,
      sessao.terminaEm - (sessao.finalizadaEm ?? sessao.terminaEm),
    );
    return corrigir(selecaoDaSessao(sessao), sessao.respostas, { tempoRestanteMs });
  }, [sessao]);

  if (sessao === undefined) {
    return <p className="py-16 text-center text-sm text-ink-500">Carregando resultado…</p>;
  }

  if (!sessao || !resultado) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Resultados</h1>
          <p className="mt-1 text-sm text-ink-600">
            Seus simulados ficam salvos neste navegador. Abra um resultado abaixo ou faça um novo
            simulado.
          </p>
        </div>

        {historico.length === 0 ? (
          <Card className="space-y-3 text-center">
            <p className="text-sm text-ink-600">Nenhum simulado finalizado ainda.</p>
            <Link href="/simulado" className={buttonClass("primary")}>
              Fazer o primeiro simulado
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {historico.map((s) => {
              const r = corrigir(selecaoDaSessao(s), s.respostas);
              return (
                <Link
                  key={s.id}
                  href={`/resultado?id=${s.id}`}
                  className="block rounded-xl border border-ink-100 bg-white p-4 shadow-soft transition hover:border-brand-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        Simulado de {new Date(s.criadaEm).toLocaleDateString("pt-BR")} ·{" "}
                        {new Date(s.criadaEm).toLocaleTimeString("pt-BR").slice(0, 5)}
                      </p>
                      <p className="text-xs text-ink-500">
                        {r.acertos} acertos de {r.total}
                      </p>
                    </div>
                    <Badge tone={r.aprovado ? "green" : "red"}>
                      nota {r.nota.toFixed(2)}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/" className={buttonClass("secondary")}>
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={() => exportarProgresso({ exportadoEm: new Date().toISOString(), sessoes: historico })}
          >
            <Download className="h-4 w-4" /> Exportar progresso
          </button>
          <label className={buttonClass("secondary", "cursor-pointer")}>
            <Upload className="h-4 w-4" /> Importar JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const dados = JSON.parse(await file.text());
                  const r = await importarSessoes(dados);
                  setAvisoImport(`${r.importadas} simulado(s) importado(s), ${r.ignoradas} ignorado(s).`);
                  const todas = await listarSessoes();
                  setHistorico(todas.filter((s) => s.finalizadaEm));
                } catch {
                  setAvisoImport("Não consegui ler esse arquivo JSON.");
                }
              }}
            />
          </label>
        </div>

        {avisoImport ? (
          <p className="rounded-xl border border-ink-100 bg-white p-3 text-xs text-ink-600">
            {avisoImport}
          </p>
        ) : null}
      </div>
    );
  }

  const lp = resultado.blocos[0];
  const direito = resultado.blocos[1];
  const gerais = resultado.blocos[2];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Resultado do simulado
          </p>
          <h1 className="text-2xl font-bold text-ink-900">
            {resultado.aprovado ? "Você passaria no corte do simulado" : "Ainda não passaria"}
          </h1>
          <p className="text-sm text-ink-600">
            {new Date(sessao.criadaEm).toLocaleString("pt-BR")} · {sessao.duracaoMin} minutos
            {sessao.terminaEm - sessao.criadaEm > sessao.duracaoMin * 60_000
              ? " + tempo adicional"
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/simulado?novo=1" className={buttonClass("secondary")}>
            <RefreshCw className="h-4 w-4" /> Refazer
          </Link>
          <Link href="/treino" className={buttonClass("primary")}>
            Treinar erros
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Nota final
              </p>
              <p className="text-4xl font-bold tabular-nums text-ink-900">
                {resultado.nota.toFixed(2)}
                <span className="text-lg font-medium text-ink-400"> / 10</span>
              </p>
            </div>
            <Badge tone={resultado.aprovado ? "green" : "red"}>
              {resultado.aprovado ? "aprovado" : "reprovado"}
            </Badge>
          </div>
          <p className="text-sm text-ink-600">
            {resultado.acertos} acertos de {resultado.total}. Nota mínima exigida:{" "}
            {NOTA_MINIMA.toFixed(1)}.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {resultado.blocos.map((b) => (
              <div
                key={b.bloco}
                className={cn(
                  "rounded-xl border p-3",
                  b.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  {b.bloco.replace("Conhecimentos em ", "").replace("Conhecimentos ", "")}
                </p>
                <p className="mt-1 text-lg font-bold">
                  {b.acertos}
                  <span className="text-xs font-medium text-ink-500">/{b.total}</span>
                </p>
                <p className="text-[11px] text-ink-500">
                  {b.minimo ? `mínimo ${b.minimo}` : "classificatório"}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold">Tempo e redação</h2>
          </div>
          <p className="text-sm text-ink-600">
            Você terminou com{" "}
            <strong className="text-ink-900">{formatarDuracao(resultado.tempoRestanteMs)}</strong>{" "}
            de prova restantes. Na prova real, esse é o tempo que sobraria para a redação — que
            vale até 40 pontos e exige {NOTA_REDACAO_MINIMA} para aprovação.
          </p>
          <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
            Regra do edital: a redação é eliminatória e não entra na nota da objetiva. Treine
            escrever em 60–70 minutos e revise.
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={lp.ok ? "green" : "red"}>Português {lp.ok ? "ok" : "abaixo"}</Badge>
            <Badge tone={direito.ok ? "green" : "red"}>
              Direito {direito.ok ? "ok" : "abaixo"}
            </Badge>
            <Badge tone="ink">Gerais {gerais.acertos}/{gerais.total}</Badge>
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Desempenho por matéria</h2>
        <div className="space-y-2">
          {resultado.porAssunto.map((a) => {
            const pct = Math.round((a.acertos / a.total) * 100);
            return (
              <div key={a.assunto} className="flex items-center gap-3">
                <span className="w-48 shrink-0 truncate text-xs text-ink-600">{a.assunto}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-ink-600">
                  {a.acertos}/{a.total}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Questões para revisar ({resultado.erros.length})</h2>
          <Link href="/treino" className="text-xs font-semibold text-brand-700 hover:underline">
            treinar por matéria
          </Link>
        </div>
        {resultado.erros.length === 0 ? (
          <p className="text-sm text-emerald-700">Gabaritou! Nada para revisar.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {resultado.erros.map((qid) => {
              const q = getQuestao(qid);
              if (!q) return null;
              const exp = getExplicacao(q);
              const abertoAgora = aberto === qid;
              return (
                <div key={qid} className="py-2">
                  <button
                    type="button"
                    onClick={() => setAberto(abertoAgora ? null : qid)}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left hover:bg-ink-50"
                    aria-expanded={abertoAgora}
                  >
                    <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span className="text-sm font-semibold">
                      Questão {q.numero} <span className="text-xs text-ink-400">({q.ano})</span>
                    </span>
                    <span className="truncate text-xs text-ink-500">{q.assunto}</span>
                    <span className="ml-auto text-xs text-ink-500">
                      gabarito {q.correta}
                    </span>
                  </button>
                  {abertoAgora ? (
                    <div className="space-y-3 px-1 pb-3">
                      <p className="text-[11px] text-ink-400">
                        {q.fonte}, p. {q.fonte_pagina} · {q.bloco}
                      </p>
                      <p className="text-sm leading-relaxed text-ink-700">{q.enunciado}</p>
                      {contextoDa(q) ? (
                        <details className="rounded-lg bg-ink-50 p-3 text-xs text-ink-600">
                          <summary className="cursor-pointer font-semibold">Texto de apoio</summary>
                          <p className="mt-2 leading-relaxed">{contextoDa(q)!.texto}</p>
                        </details>
                      ) : null}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-4 w-4" /> Gabarito: {q.correta}
                        </p>
                        <p className="mt-1">{q.alternativas[q.correta]}</p>
                      </div>
                      {exp ? (
                        <div className="rounded-xl border border-ink-100 bg-white p-3 text-sm text-ink-700">
                          <p className="font-semibold text-ink-900">Por quê</p>
                          <p className="mt-1 leading-relaxed">{exp.correta}</p>
                          {exp.base ? (
                            <p className="mt-2 text-xs text-ink-500">Fundamento: {exp.base}</p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                          Esta questão ainda não tem explicação revisada na base local. Peça ao
                          tutor abaixo (requer chave de IA configurada).
                        </p>
                      )}
                      <TutorPanel questao={q} escolha={sessao.respostas[qid] ?? null} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className={buttonClass("ghost")}>
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={() =>
            exportarProgresso({
              exportadoEm: new Date().toISOString(),
              simulado: { id: sessao.id, criadaEm: sessao.criadaEm, respostas: sessao.respostas },
              resultado,
            })
          }
        >
          <Download className="h-4 w-4" /> Exportar este resultado
        </button>
      </div>

      <p className="text-[11px] text-ink-400">
        <Flag className="mr-1 inline h-3 w-3" />
        Este resultado é uma estimativa de treino: as travas e a nota seguem o edital, mas o corte
        real de 2027 só existe depois da prova.
      </p>
    </div>
  );
}
