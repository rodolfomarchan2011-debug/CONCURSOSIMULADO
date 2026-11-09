"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  Target,
  Trophy,
} from "lucide-react";
import { Badge, Card, Progress, Stat, buttonClass } from "@/components/ui";
import { calcularDesempenho, type Desempenho } from "@/lib/desempenho";
import { resumoRevisao, type ResumoRevisao } from "@/lib/revisao";

function data(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function DesempenhoClient() {
  const [dados, setDados] = useState<Desempenho | null>(null);
  const [revisao, setRevisao] = useState<ResumoRevisao | null>(null);

  useEffect(() => {
    (async () => {
      setDados(await calcularDesempenho());
      setRevisao(await resumoRevisao());
    })();
  }, []);

  if (!dados) {
    return <p className="py-16 text-center text-sm text-ink-500">Calculando seu desempenho…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Meu desempenho</h1>
          <p className="mt-1 text-sm text-ink-600">
            Histórico dos simulados salvos neste navegador e fila de revisão espaçada.
          </p>
        </div>
        <Link href="/simulado" className={buttonClass("primary")}>
          Novo simulado <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {dados.simulados === 0 ? (
        <Card className="space-y-3 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <BarChart3 className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold">Ainda não há simulado finalizado</h2>
          <p className="mx-auto max-w-md text-sm text-ink-600">
            Faça o primeiro simulado para o app calcular média, evolução por matéria e montar seu
            caderno de erros.
          </p>
          <Link href="/simulado" className={buttonClass("primary")}>
            Fazer simulado
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Simulados" value={dados.simulados} />
            <Stat label="Média" value={dados.media.toFixed(2)} hint="0 a 10" />
            <Stat label="Melhor nota" value={dados.melhor.toFixed(2)} />
            <Stat
              label="Aprovações"
              value={`${dados.aprovacoes}/${dados.simulados}`}
              hint="critérios do edital"
            />
          </div>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock className="h-5 w-5 text-brand-700" /> Revisão espaçada
              </h2>
              <Link href="/revisao" className={buttonClass(revisao?.devidas ? "primary" : "secondary")}>
                Revisar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Na fila" value={revisao?.total ?? 0} hint="questões erradas" />
              <Stat label="Devidas hoje" value={revisao?.devidas ?? 0} />
              <Stat label="Dominadas" value={revisao?.dominadas ?? 0} hint="nível 4 ou 5" />
            </div>
            <p className="text-xs text-ink-500">
              Errou de novo? volta para o nível 0. Acertou? o intervalo dobra: 1, 3, 7, 15 e 30
              dias.
            </p>
          </Card>

          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-brand-700" /> Acerto por matéria
            </h2>
            <div className="space-y-3">
              {dados.porAssunto.map((a) => (
                <div key={a.assunto}>
                  <div className="flex items-center justify-between text-xs text-ink-600">
                    <span className="font-medium text-ink-800">{a.assunto}</span>
                    <span>
                      {a.acertos}/{a.total} · {a.pct}%
                    </span>
                  </div>
                  <div className="mt-1">
                    <Progress valor={a.acertos} max={a.total} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Trophy className="h-5 w-5 text-brand-700" /> Últimos simulados
            </h2>
            <div className="divide-y divide-ink-100">
              {dados.historico.map((h) => (
                <Link
                  key={h.id}
                  href={`/resultado?id=${h.id}`}
                  className="focus-ring flex flex-wrap items-center gap-3 py-3 text-sm hover:bg-ink-50"
                >
                  <span className="w-16 text-xs text-ink-500">{data(h.quando)}</span>
                  <span className="font-semibold text-ink-900">{h.nota.toFixed(2)}</span>
                  <span className="text-xs text-ink-500">
                    {h.acertos}/{h.total} acertos
                    {h.tempoMin ? ` · ${h.tempoMin} min` : ""}
                  </span>
                  <span className="ml-auto">
                    {h.aprovado ? (
                      <Badge tone="green">Aprovado</Badge>
                    ) : (
                      <Badge tone="amber">Não passou</Badge>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-400" />
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-white">
            <BookOpenCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Caderno de erros</p>
            <p className="text-xs text-ink-500">
              Toda questão errada no simulado entra na fila automaticamente.
            </p>
          </div>
        </div>
        <Link href="/revisao" className={buttonClass("secondary")}>
          Abrir revisão
        </Link>
      </Card>
    </div>
  );
}
