"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Loader2,
  PartyPopper,
  XCircle,
} from "lucide-react";
import { Badge, Card, Progress, Stat, buttonClass } from "@/components/ui";
import { QuestionBody } from "@/components/QuestionBody";
import { ExplicacaoBox } from "@/components/ExplicacaoBox";
import { contextoDa, porId } from "@/lib/banco";
import { filaDevidas, registrarResposta } from "@/lib/revisao";
import type { RevisaoRow } from "@/lib/db";
import type { Letra, Questao } from "@/lib/types";

interface Item {
  rev: RevisaoRow;
  q: Questao;
}

export function RevisaoClient() {
  const [itens, setItens] = useState<Item[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<Letra | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const fila = await filaDevidas(25);
      const validos = fila
        .map((rev) => ({ rev, q: porId[rev.id] }))
        .filter((x): x is Item => Boolean(x.q));
      setItens(validos);
    })();
  }, []);

  if (!itens) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Montando sua fila…
      </p>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card className="space-y-3 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CalendarCheck2 className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-xl font-bold">Nada para revisar agora</h1>
          <p className="text-sm text-ink-600">
            Sua fila está em dia ou ainda não há erros registrados. Faça um simulado para alimentar
            o caderno de erros.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/simulado" className={buttonClass("primary")}>
              Fazer simulado
            </Link>
            <Link href="/desempenho" className={buttonClass("secondary")}>
              Ver desempenho
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (indice >= itens.length) {
    const total = acertos + erros;
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card className="space-y-4 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <PartyPopper className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-xl font-bold">Revisão concluída</h1>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Revisadas" value={total} />
            <Stat label="Acertos" value={acertos} />
            <Stat label="Erros" value={erros} />
          </div>
          <p className="text-xs text-ink-500">
            Acertos voltam em 3, 7, 15 ou 30 dias; erros voltam amanhã.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/desempenho" className={buttonClass("primary")}>
              Ver desempenho
            </Link>
            <Link href="/revisao" className={buttonClass("secondary")}>
              Recomeçar
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { rev, q } = itens[indice];

  async function proxima() {
    if (!escolha || salvando) return;
    setSalvando(true);
    await registrarResposta(q.id, escolha === q.correta);
    if (escolha === q.correta) setAcertos((n) => n + 1);
    else setErros((n) => n + 1);
    setSalvando(false);
    setEscolha(null);
    setRevelado(false);
    setIndice((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/desempenho" className={buttonClass("ghost")}>
          <ArrowLeft className="h-4 w-4" /> Desempenho
        </Link>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <Badge tone="brand">revisão espaçada</Badge>
          <span>
            {indice + 1} de {itens.length}
          </span>
        </div>
      </div>

      <Progress valor={indice} max={itens.length} />

      <Card className="space-y-4">
        <QuestionBody
          questao={q}
          contexto={contextoDa(q)}
          selecionada={escolha}
          revelado={revelado}
          onSelect={setEscolha}
          desabilitado={revelado}
        />

        {!revelado ? (
          <button
            type="button"
            onClick={() => setRevelado(true)}
            disabled={!escolha}
            className={buttonClass("primary", "w-full")}
          >
            Conferir resposta
          </button>
        ) : (
          <div className="space-y-3">
            <ExplicacaoBox questao={q} escolha={escolha} compacto />
            <button
              type="button"
              onClick={proxima}
              disabled={salvando}
              className={buttonClass("primary", "w-full")}
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : escolha === q.correta ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {escolha === q.correta ? "Acertei — próxima" : "Errei — próxima"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>

      <p className="text-center text-[11px] text-ink-400">
        Nível atual desta questão: {rev.nivel} · erros: {rev.erros} · acertos: {rev.acertos}
      </p>
    </div>
  );
}
