import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClass, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-12">
      <Card className="space-y-4 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Compass className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold text-ink-900">Página não encontrada</h1>
        <p className="text-sm text-ink-600">
          O endereço não existe ou mudou. Volte ao início e escolha um modo de estudo.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonClass("primary")}>
            Início
          </Link>
          <Link href="/simulado" className={buttonClass("secondary")}>
            Fazer simulado
          </Link>
        </div>
      </Card>
    </div>
  );
}
