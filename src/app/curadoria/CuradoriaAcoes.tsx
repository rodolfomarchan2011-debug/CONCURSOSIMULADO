"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { buttonClass } from "@/components/ui";

export function CuradoriaAcoes({ id, senha }: { id: string; senha?: string }) {
  const [estado, setEstado] = useState<"idle" | "ok" | "erro">("idle");

  async function enviar(acao: "aprovar" | "devolver") {
    setEstado("idle");
    try {
      const res = await fetch("/api/curadoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, acao, senha }),
      });
      setEstado(res.ok ? "ok" : "erro");
    } catch {
      setEstado("erro");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => enviar("aprovar")}
        className={buttonClass("primary", "px-3 py-1.5 text-xs")}
      >
        <Check className="h-3.5 w-3.5" /> Aprovar
      </button>
      <button
        type="button"
        onClick={() => enviar("devolver")}
        className={buttonClass("secondary", "px-3 py-1.5 text-xs")}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Devolver
      </button>
      {estado === "ok" ? <span className="text-xs text-emerald-700">registrado</span> : null}
      {estado === "erro" ? <span className="text-xs text-rose-700">falhou</span> : null}
    </div>
  );
}
