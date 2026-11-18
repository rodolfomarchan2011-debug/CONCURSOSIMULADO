import Link from "next/link";
import { BookOpen, Clock3, FlaskConical } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { MATERIAS_ESTUDO, aulas } from "@/lib/aulas";

export const metadata = { title: "Estudar teoria · TJSP Escrevente" };

export default function EstudarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Estudar teoria</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-600">
          Aulas curtas por matéria, com exemplo resolvido de questão real, pegadinhas e flashcards.
          Conteúdo em rascunho é marcado como <strong>não revisado</strong> até aprovação humana.
        </p>
      </div>

      {MATERIAS_ESTUDO.map((materia) => {
        const lista = aulas.filter((a) => a.materia === materia);
        if (!lista.length) return null;
        return (
          <section key={materia} className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              <BookOpen className="h-5 w-5 text-brand-700" /> {materia}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {lista.map((aula) => (
                <Link key={aula.id} href={`/estudar/${aula.id}`} className="focus-ring">
                  <Card className="h-full space-y-2 transition hover:border-brand-300">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-ink-900">{aula.topico}</h3>
                      {aula.revisado ? (
                        <Badge tone="green">revisado</Badge>
                      ) : (
                        <Badge tone="amber">não revisado</Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-500">{aula.assunto}</p>
                    <p className="line-clamp-3 text-sm text-ink-600">{aula.resumo}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-ink-400">
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" /> {aula.secoes.length} seções
                      </span>
                      <span className="flex items-center gap-1">
                        <FlaskConical className="h-3 w-3" /> {aula.questoes_relacionadas.length}{" "}
                        questões
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
