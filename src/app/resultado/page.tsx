import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultadoClient } from "./ResultadoClient";

export const metadata: Metadata = { title: "Resultado" };

export default function ResultadoPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-ink-500">Carregando…</div>}>
      <ResultadoClient />
    </Suspense>
  );
}
