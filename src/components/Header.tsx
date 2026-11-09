"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Início" },
  { href: "/simulado", label: "Simulado" },
  { href: "/treino", label: "Treino" },
  { href: "/desempenho", label: "Desempenho" },
  { href: "/resultado", label: "Resultados" },
  { href: "/revisao", label: "Revisão" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 focus-ring">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink-900">TJSP Escrevente</span>
            <span className="block text-[11px] text-ink-500">simulador · prova 14/03/2027</span>
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const ativo = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                  ativo
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
