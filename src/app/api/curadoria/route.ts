import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARQUIVOS = ["explicacoes-v2.json", "explicacoes-d1.json"];

export async function POST(req: Request) {
  const senha = process.env.CURADORIA_SENHA;
  let corpo: { id?: string; acao?: string; senha?: string };
  try {
    corpo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!senha || corpo.senha !== senha) {
    return new Response("Não autorizado", { status: 401 });
  }
  if (!corpo.id || !["aprovar", "devolver"].includes(corpo.acao ?? "")) {
    return new Response("Parâmetros inválidos", { status: 400 });
  }

  for (const arquivo of ARQUIVOS) {
    const caminho = path.join(process.cwd(), "src", "data", arquivo);
    if (!fs.existsSync(caminho)) continue;
    const dados = JSON.parse(fs.readFileSync(caminho, "utf8")) as Record<
      string,
      { revisado?: boolean }
    >;
    if (!dados[corpo.id]) continue;
    dados[corpo.id].revisado = corpo.acao === "aprovar";
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 1), "utf8");
    return Response.json({ ok: true, arquivo });
  }

  return new Response("Explicação não encontrada", { status: 404 });
}
