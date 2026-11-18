import fs from "node:fs";
import path from "node:path";
import { Card } from "@/components/ui";
import { CuradoriaAcoes } from "./CuradoriaAcoes";

export const dynamic = "force-dynamic";

interface Exp {
  questao_id: string;
  porque_correta: string;
  fundamento_legal: { lei: string; artigo: string; trecho: string }[];
  revisado: boolean;
  verificar?: boolean;
}

function ler(arquivo: string): Record<string, Exp> {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "src", "data", arquivo), "utf8"),
    ) as Record<string, Exp>;
  } catch {
    return {};
  }
}

function textoLegal(lei: string, artigo: string): string {
  try {
    const base = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "legal", "artigos.json"), "utf8"),
    ) as { artigos: { lei: string; artigo: string; texto: string }[] };
    return base.artigos.find((a) => a.lei === lei && a.artigo === artigo)?.texto ?? "";
  } catch {
    return "";
  }
}

export default async function CuradoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ senha?: string }>;
}) {
  const { senha } = await searchParams;
  const esperada = process.env.CURADORIA_SENHA;
  if (!esperada || senha !== esperada) {
    return (
      <Card className="mx-auto max-w-lg space-y-2">
        <h1 className="text-lg font-semibold">Curadoria</h1>
        <p className="text-sm text-ink-600">
          Acesso restrito. Defina <code>CURADORIA_SENHA</code> no ambiente e abra
          <code> /curadoria?senha=...</code>.
        </p>
      </Card>
    );
  }

  const v2 = ler("explicacoes-v2.json");
  const d1 = ler("explicacoes-d1.json");
  const pendentes = [...Object.entries(v2), ...Object.entries(d1)]
    .filter(([, e]) => !e.revisado)
    .slice(0, 50);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Curadoria de explicações</h1>
        <p className="text-sm text-ink-600">
          {pendentes.length} rascunhos pendentes. Aprovar grava <code>revisado: true</code> no JSON
          local; em produção, o arquivo é efêmero — commite o resultado.
        </p>
      </div>

      {pendentes.length === 0 ? <Card>Nenhum rascunho pendente.</Card> : null}

      {pendentes.map(([id, exp]) => (
        <Card key={id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{id}</h2>
            <CuradoriaAcoes id={id} senha={senha} />
          </div>
          <p className="text-sm text-ink-700">{exp.porque_correta}</p>
          {exp.verificar ? (
            <p className="text-xs text-amber-700">verificar: true — sem artigo na base</p>
          ) : null}
          {exp.fundamento_legal?.map((f, i) => {
            const literal = textoLegal(f.lei, f.artigo);
            return (
              <div key={i} className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-xs">
                <p className="font-semibold">
                  {f.lei} art. {f.artigo}
                </p>
                <p className="mt-1 text-ink-600">{literal.slice(0, 600)}</p>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}
