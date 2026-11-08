import { Suspense } from "react";
import type { Metadata } from "next";
import { SimuladoClient } from "./SimuladoClient";

export const metadata: Metadata = { title: "Simulado completo" };

export default function SimuladoPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm text-ink-500">Carregando simulado…</div>
      }
    >
      <SimuladoClient />
    </Suspense>
  );
}
