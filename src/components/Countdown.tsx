"use client";

import { useEffect, useState } from "react";
import { EXAME_ISO } from "@/lib/timer";

function partes(alvo: number, agora: number) {
  const diff = Math.max(0, alvo - agora);
  const dias = Math.floor(diff / 86_400_000);
  const horas = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutos = Math.floor((diff % 3_600_000) / 60_000);
  return { dias, horas, minutos };
}

export function Countdown() {
  const alvo = new Date(EXAME_ISO).getTime();
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (agora === null) {
    return (
      <div className="flex gap-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 w-20 animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
    );
  }

  const { dias, horas, minutos } = partes(alvo, agora);
  return (
    <div className="flex gap-3" role="timer" aria-label="Contagem regressiva para a prova">
      {[
        { valor: dias, rotulo: "dias" },
        { valor: horas, rotulo: "horas" },
        { valor: minutos, rotulo: "min" },
      ].map((p) => (
        <div
          key={p.rotulo}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center"
        >
          <div className="text-xl font-bold tabular-nums text-white">{p.valor}</div>
          <div className="text-[10px] uppercase tracking-wide text-white/70">{p.rotulo}</div>
        </div>
      ))}
    </div>
  );
}
