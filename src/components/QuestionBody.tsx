"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
import type { Contexto, Letra, Questao } from "@/lib/types";
import { cn } from "@/lib/cn";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

export function QuestionBody({
  questao,
  contexto,
  selecionada,
  revelado = false,
  onSelect,
  desabilitado = false,
  compacto = false,
}: {
  questao: Questao;
  contexto?: Contexto;
  selecionada?: Letra | null;
  revelado?: boolean;
  onSelect?: (letra: Letra) => void;
  desabilitado?: boolean;
  compacto?: boolean;
}) {
  const [contextoAberto, setContextoAberto] = useState(false);
  const alternativas = useMemo(
    () => LETRAS.map((l) => ({ letra: l, texto: questao.alternativas[l] })),
    [questao],
  );

  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-ink-900 px-2.5 py-1 font-semibold text-white">
          Questão {String(questao.numero).padStart(2, "0")}
        </span>
        <span className="rounded-full bg-ink-100 px-2.5 py-1 font-medium text-ink-700">
          {questao.assunto}
        </span>
        <span className="rounded-full bg-ink-100 px-2.5 py-1 font-medium text-ink-700">
          {questao.bloco}
        </span>
      </div>

      {contexto ? (
        <div className="rounded-xl border border-ink-100 bg-ink-50/60">
          <button
            type="button"
            onClick={() => setContextoAberto((v) => !v)}
            className="focus-ring flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-ink-700"
            aria-expanded={contextoAberto}
          >
            <span className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" /> Texto de apoio
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition", contextoAberto && "rotate-180")}
            />
          </button>
          {contextoAberto ? (
            <div className="border-t border-ink-100 px-4 py-3 text-sm leading-relaxed text-ink-700">
              {contexto.texto}
              <p className="mt-2 text-[11px] text-ink-400">{contexto.fonte}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("prose-enunciado whitespace-pre-line", compacto && "text-sm")}>
        {questao.enunciado}
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Alternativas">
        {alternativas.map(({ letra, texto }) => {
          const marcada = selecionada === letra;
          const certa = questao.correta === letra;
          const estado = revelado
            ? certa
              ? "certa"
              : marcada
                ? "errada"
                : "neutra"
            : marcada
              ? "marcada"
              : "neutra";

          return (
            <button
              key={letra}
              type="button"
              role="radio"
              aria-checked={marcada}
              disabled={desabilitado}
              onClick={() => onSelect?.(letra)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                "focus-ring disabled:cursor-default",
                estado === "neutra" &&
                  "border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/40",
                estado === "marcada" && "border-brand-500 bg-brand-50 ring-1 ring-brand-300",
                estado === "certa" && "border-emerald-500 bg-emerald-50",
                estado === "errada" && "border-rose-500 bg-rose-50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-bold",
                  estado === "neutra" && "border-ink-300 text-ink-600",
                  estado === "marcada" && "border-brand-600 bg-brand-600 text-white",
                  estado === "certa" && "border-emerald-600 bg-emerald-600 text-white",
                  estado === "errada" && "border-rose-600 bg-rose-600 text-white",
                )}
              >
                {letra}
              </span>
              <span className="text-sm leading-relaxed text-ink-800">{texto}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
