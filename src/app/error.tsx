"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { buttonClass, Card } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-12">
      <Card className="space-y-4 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-ink-900">Algo quebrou nesta tela</h1>
        <p className="text-sm text-ink-600">
          Seu progresso está salvo no navegador. Tente recarregar; se persistir, volte ao início.
        </p>
        <p className="rounded-lg bg-ink-50 px-3 py-2 text-left text-xs text-ink-500">
          {error.message || "Erro inesperado"}
          {error.digest ? ` · código ${error.digest}` : ""}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className={buttonClass("primary")}>
            <RotateCcw className="h-4 w-4" /> Tentar de novo
          </button>
          <Link href="/" className={buttonClass("secondary")}>
            Início
          </Link>
        </div>
      </Card>
    </div>
  );
}
