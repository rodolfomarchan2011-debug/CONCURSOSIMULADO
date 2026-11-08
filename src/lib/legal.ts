import fs from "node:fs";
import path from "node:path";

export interface ArtigoLegal {
  lei: string;
  artigo: string;
  texto: string;
  fonte: string;
}

interface Base {
  meta: { artigos: number; fontes: Record<string, string>; nomes: Record<string, string> };
  artigos: ArtigoLegal[];
}

const STOP = new Set(
  ("a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre " +
    "que qual quais quem quando como onde porque pois se entao assim mais menos muito pouco " +
    "ao aos à às é são foi ser sendo ter tem tinha havia ha ainda ja nao sim tambem so " +
    "art artigo inciso paragrafo alinea item lei codigo caso casos forma modo acordo " +
    "questao alternativa correta incorreta assinale seguinte acordo texto apoio enunciado")
    .split(/\s+/)
    .filter(Boolean),
);

let base: Base | null = null;
let idf: Map<string, number> | null = null;
let norm: string[] | null = null;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function carregar(): Base {
  if (base) return base;
  try {
    const arquivo = path.join(process.cwd(), "data", "legal", "artigos.json");
    base = JSON.parse(fs.readFileSync(arquivo, "utf8")) as Base;
  } catch {
    base = { meta: { artigos: 0, fontes: {}, nomes: {} }, artigos: [] };
  }
  return base;
}

function prepararIndices(): void {
  if (idf) return;
  const b = carregar();
  norm = b.artigos.map((a) => normalizar(`${a.lei} ${a.artigo} ${a.texto}`));
  const df = new Map<string, number>();
  for (const texto of norm) {
    const vistos = new Set(tokens(texto));
    for (const t of vistos) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const total = Math.max(1, b.artigos.length);
  idf = new Map();
  for (const [t, n] of df) idf.set(t, Math.log(1 + total / (1 + n)));
}

function contar(texto: string, termo: string): number {
  let total = 0;
  let pos = texto.indexOf(termo);
  while (pos !== -1) {
    total += 1;
    pos = texto.indexOf(termo, pos + termo.length);
  }
  return total;
}

function detectarLeis(consulta: string): Set<string> {
  const leis = new Set<string>();
  const t = normalizar(consulta);
  if (/\bcp\b|codigo penal|penal\b/.test(t) && !/processual/.test(t)) leis.add("CP");
  if (/\bcpp\b|processo penal|processual penal/.test(t)) leis.add("CPP");
  if (/\bcpc\b|processo civil|processual civil/.test(t)) leis.add("CPC");
  if (/\bcf\b|constituicao|constitucional/.test(t)) leis.add("CF");
  return leis;
}

export function buscarBaseLegal(
  consulta: string,
  limite = 6,
): ArtigoLegal[] {
  const b = carregar();
  if (!b.artigos.length) return [];
  prepararIndices();
  const idx = idf!;
  const textos = norm!;
  const alvo = tokens(consulta);
  if (!alvo.length) return [];

  const leis = detectarLeis(consulta);
  const citados = new Set(
    [...normalizar(consulta).matchAll(/\bart\s*(\d{1,4})\b/g)].map((m) => m[1]),
  );

  const pontuados = b.artigos.map((artigo, i) => {
    const texto = textos[i];
    let score = 0;
    for (const termo of alvo) {
      const n = contar(texto, termo);
      if (n) score += (idx.get(termo) ?? 0.5) * (1 + Math.log(n));
    }
    if (leis.size && leis.has(artigo.lei)) score *= 1.7;
    if (citados.size && citados.has(artigo.artigo)) score += 9;
    if (artigo.texto.length < 80) score *= 0.4;
    return { artigo, score };
  });

  pontuados.sort((a, b2) => b2.score - a.score);
  return pontuados
    .filter((p) => p.score > 0.8)
    .slice(0, limite)
    .map((p) => p.artigo);
}

export function infoBaseLegal(): { artigos: number; fontes: Record<string, string>; nomes: Record<string, string> } {
  const b = carregar();
  return { artigos: b.meta.artigos, fontes: b.meta.fontes, nomes: b.meta.nomes };
}
