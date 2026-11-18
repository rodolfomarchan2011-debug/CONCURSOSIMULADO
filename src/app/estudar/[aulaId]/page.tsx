import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb, ListChecks } from "lucide-react";
import { Badge, Card, buttonClass } from "@/components/ui";
import { aulaPorId } from "@/lib/aulas";
import { porId } from "@/lib/banco";

export default async function AulaPage({
  params,
}: {
  params: Promise<{ aulaId: string }>;
}) {
  const { aulaId } = await params;
  const aula = aulaPorId(aulaId);
  if (!aula) notFound();

  const exemplo = porId[aula.exemplo_resolvido.questao_id];
  const relacionadas = aula.questoes_relacionadas
    .map((id) => porId[id])
    .filter(Boolean)
    .slice(0, 5);
  const ids = relacionadas.map((q) => q.id).join(",");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/estudar" className={buttonClass("ghost")}>
          <ArrowLeft className="h-4 w-4" /> Estudar
        </Link>
        {aula.revisado ? (
          <Badge tone="green">revisado</Badge>
        ) : (
          <Badge tone="amber">rascunho — não revisado</Badge>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {aula.materia} · {aula.assunto}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">{aula.topico}</h1>
        <p className="mt-1 text-xs text-ink-400">{aula.edital_ref}</p>
      </div>

      {aula.objetivos.length ? (
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold">Objetivos</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
            {aula.objetivos.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {aula.secoes.map((secao, i) => (
        <Card key={i} className="space-y-2">
          <h2 className="text-lg font-semibold text-ink-900">{secao.titulo}</h2>
          {secao.texto_md.split(/\n\n+/).map((par, j) => (
            <p key={j} className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {par}
            </p>
          ))}
          {secao.artigos.length ? (
            <p className="text-[11px] text-ink-400">Base: {secao.artigos.join(" · ")}</p>
          ) : null}
        </Card>
      ))}

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ListChecks className="h-5 w-5 text-brand-700" /> Exemplo resolvido
        </h2>
        <p className="text-sm text-ink-700">{aula.exemplo_resolvido.enunciado}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-700">
          {aula.exemplo_resolvido.passo_a_passo.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
        {exemplo ? (
          <Link
            href={`/treino?ids=${exemplo.id}`}
            className="focus-ring inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
          >
            Abrir questão {exemplo.numero} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </Card>

      {aula.pegadinhas.length ? (
        <Card className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="h-5 w-5 text-amber-600" /> Pegadinhas e erro comum
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
            {aula.pegadinhas.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <p className="text-sm leading-relaxed text-ink-700">{aula.resumo}</p>
        {aula.flashcards.length ? (
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            {aula.flashcards.map((f, i) => (
              <details key={i} className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink-800">
                  {f.frente}
                </summary>
                <p className="mt-2 text-sm text-ink-700">{f.verso}</p>
              </details>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Teste agora</h2>
          <p className="text-sm text-ink-600">
            {relacionadas.length} questões reais deste tópico.
          </p>
        </div>
        <Link
          href={ids ? `/treino?ids=${ids}` : `/treino?assunto=${encodeURIComponent(aula.assunto)}`}
          className={buttonClass("primary")}
        >
          Treinar este tópico <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      <p className="text-[11px] text-ink-400">
        {aula.fonte} · versão {aula.versao} · conteúdo gerado e não revisado.
      </p>
    </div>
  );
}
