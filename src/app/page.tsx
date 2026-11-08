import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge, Card, buttonClass, Progress, Stat } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { META, questoes } from "@/lib/banco";
import { validarMatriz } from "@/lib/scoring";

export default function Home() {
  const validacao = validarMatriz(questoes);
  const lp = questoes.filter((q) => q.materia === "Língua Portuguesa").length;
  const direito = questoes.filter((q) => q.materia === "Conhecimentos em Direito").length;
  const gerais = questoes.length - lp - direito;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl bg-ink-900 text-white">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand" className="bg-white/10 text-white">
                VUNESP · edital TJSP2607
              </Badge>
              <Badge tone="brand" className="bg-white/10 text-white">
                nível médio
              </Badge>
            </div>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
              Simulado do concurso de Escrevente do TJSP, com a cara da prova real.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-200 sm:text-base">
              70 questões na matriz oficial, cronômetro de 5 horas, correção com as travas
              do edital e explicação imediata de cada questão. Base: prova oficial de
              07/12/2025, aplicada pela VUNESP.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/simulado" className={buttonClass("primary", "bg-white text-ink-900 hover:bg-ink-100")}>
                Começar simulado <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/treino"
                className={buttonClass("secondary", "border-white/30 bg-white/10 text-white hover:bg-white/20")}
              >
                Treinar por matéria
              </Link>
            </div>
            <div className="pt-2">
              <p className="mb-2 text-xs uppercase tracking-wide text-white/60">
                Prova em 14 de março de 2027
              </p>
              <Countdown />
            </div>
          </div>

          <Card className="bg-white/5 text-white shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/90">A prova em números</h2>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Questões", value: "70" },
                { label: "Duração", value: "5h" },
                { label: "Alternativas", value: "5" },
                { label: "Redação", value: "40 pts" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wide text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-xs text-white/70">
              <p>Bloco I · Português: 16 questões (mínimo 8)</p>
              <p>Bloco II · Direito: 30 questões (mínimo 15)</p>
              <p>Bloco III · Gerais: 24 questões (classificatório)</p>
              <p className="text-white/50">Nota final mínima: 5,0 de 10,0</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: ListChecks,
            titulo: "Matriz fiel ao edital",
            texto:
              "16 de Português, 30 de Direito e 24 de Conhecimentos Gerais, na ordem e no peso oficiais.",
          },
          {
            icon: Clock3,
            titulo: "Tempo real de prova",
            texto:
              "Cronômetro ancorado em horário de término: sobrevive a recarregar a página e a trocar de aba.",
          },
          {
            icon: Sparkles,
            titulo: "Explicação na hora",
            texto:
              "Acertou ou errou, você vê o gabarito, o fundamento e pode pedir aprofundamento ao tutor.",
          },
        ].map((f) => (
          <Card key={f.titulo} className="space-y-2">
            <f.icon className="h-6 w-6 text-brand-600" />
            <h3 className="font-semibold text-ink-900">{f.titulo}</h3>
            <p className="text-sm leading-relaxed text-ink-600">{f.texto}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Matriz do simulado</h2>
              <p className="text-sm text-ink-500">
                Anexo VIII do edital de 2027, conferido no caderno de 2025.
              </p>
            </div>
            <Badge tone={validacao.ok ? "green" : "red"}>
              {validacao.ok ? "matriz validada" : "revisar"}
            </Badge>
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-100">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Bloco / matéria</th>
                  <th className="px-3 py-2 text-right font-semibold">Questões</th>
                  <th className="px-3 py-2 text-right font-semibold">Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <tr>
                  <td className="px-3 py-2">Língua Portuguesa</td>
                  <td className="px-3 py-2 text-right tabular-nums">{lp}</td>
                  <td className="px-3 py-2 text-right tabular-nums">8</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Conhecimentos em Direito</td>
                  <td className="px-3 py-2 text-right tabular-nums">{direito}</td>
                  <td className="px-3 py-2 text-right tabular-nums">15</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Conhecimentos Gerais</td>
                  <td className="px-3 py-2 text-right tabular-nums">{gerais}</td>
                  <td className="px-3 py-2 text-right tabular-nums">—</td>
                </tr>
                <tr className="bg-ink-50/60 font-semibold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums">{questoes.length}</td>
                  <td className="px-3 py-2 text-right">5,0/10</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Português" value={`${lp} questões`} hint="eliminatório: 8 acertos" />
            <Stat label="Direito" value={`${direito} questões`} hint="eliminatório: 15 acertos" />
            <Stat label="Gerais" value={`${gerais} questões`} hint="só classifica" />
            <Stat label="Banco" value={`${questoes.length} questões`} hint="prova oficial de 2025" />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold">De onde vêm as questões</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink-600">
              Todas as 70 questões vêm do caderno oficial <strong>{META.edital}</strong>, com
              gabarito oficial da VUNESP. A prova foi aplicada em{" "}
              {new Date(META.prova_aplicada_em + "T12:00:00").toLocaleDateString("pt-BR")}.
            </p>
            <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
              <p>
                <strong>Fonte:</strong> {META.gabarito_fonte} — VERSÃO 1.
              </p>
              <p className="mt-1">
                O concurso de 2027 tem a mesma estrutura (70 questões + redação, 5 horas), mas
                a prova de 2025 foi aplicada para a Capital e 1ª RAJ. Use como treino de banca.
              </p>
            </div>
            <Link href="/treino" className={buttonClass("secondary", "w-full")}>
              <BookOpenCheck className="h-4 w-4" /> Explorar questões por matéria
            </Link>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Como o resultado é calculado</h2>
            <ul className="space-y-2 text-sm text-ink-600">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                Nota de 0 a 10: acertos ÷ 70 × 10.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                Reprova se acertar menos de 8 em Português ou menos de 15 em Direito.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                Reprova se a nota final ficar abaixo de 5,0.
              </li>
            </ul>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              A redação (0–40, mínimo 24) é corrigida à parte e não entra na nota da objetiva.
              O simulado mostra quanto tempo sobrou para você treinar a redação.
            </div>
          </Card>
        </div>
      </section>

      <section>
        <Progress valor={questoes.length} max={70} />
      </section>
    </div>
  );
}
