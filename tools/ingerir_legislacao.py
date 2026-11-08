"""Baixa/parseia os códigos oficiais atualizados (Câmara dos Deputados) e
gera uma base de artigos para o tutor citar.

Fonte: www2.camara.leg.br (textos consolidados "normaatualizada").
Uso: python tools/ingerir_legislacao.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "legal" / "raw"
OUT = RAIZ / "data" / "legal" / "artigos.json"

LEIS = {
    "CF": {
        "arquivo": "cf.pdf",
        "nome": "Constituição Federal de 1988",
        "fonte": "https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.pdf",
    },
    "CP": {
        "arquivo": "cp.pdf",
        "nome": "Código Penal (Decreto-Lei 2.848/1940)",
        "fonte": "https://www2.camara.leg.br/legin/fed/declei/1940-1949/decreto-lei-2848-7-dezembro-1940-412868-normaatualizada-pe.pdf",
    },
    "CPP": {
        "arquivo": "cpp.pdf",
        "nome": "Código de Processo Penal (Decreto-Lei 3.689/1941)",
        "fonte": "https://www2.camara.leg.br/legin/fed/declei/1940-1949/decreto-lei-3689-3-outubro-1941-322206-normaatualizada-pe.pdf",
    },
    "CPC": {
        "arquivo": "cpc.pdf",
        "nome": "Código de Processo Civil (Lei 13.105/2015)",
        "fonte": "https://www2.camara.leg.br/legin/fed/lei/2015/lei-13105-16-marco-2015-780273-normaatualizada-pl.pdf",
    },
}

ARTIGO_RE = re.compile(r"(?m)^\s*(?:Art\.|ART\.)\s*(\d{1,3}(?:\.\d{3})?)\s*[ºo°]?\s*[-–.]?\s*")
LIXO = (
    "www.camara.leg.br",
    "www2.camara.leg.br",
    "Câmara dos Deputados",
    "Portal da Câmara",
    "Página ",
)


def extrair_texto(pdf: Path, limite_pagina: int | None = None) -> str:
    doc = pymupdf.open(pdf)
    paginas = doc if limite_pagina is None else doc[: limite_pagina + 1]
    linhas: list[str] = []
    for pagina in paginas:
        for linha in pagina.get_text().splitlines():
            limpa = linha.strip()
            if not limpa:
                continue
            if any(marca in limpa for marca in LIXO):
                continue
            if re.fullmatch(r"\d{1,3}", limpa):  # número de página
                continue
            linhas.append(limpa)
    return "\n".join(linhas)


def fatiar_artigos(texto: str, lei: str, fonte: str) -> list[dict]:
    """Fatiar por artigos em ordem crescente.

    Referências do tipo "art. 310 deste Código" no meio de um artigo geram
    falsos marcadores; por isso só aceitamos o próximo número esperado.
    """
    candidatos = [
        (int(m.group(1).replace(".", "")), m.start(), m.end())
        for m in ARTIGO_RE.finditer(texto)
    ]
    aceitos: list[tuple[int, int, int]] = []
    esperado = 1
    i = 0
    while i < len(candidatos):
        numero, inicio, fim = candidatos[i]
        if numero == esperado:
            aceitos.append((numero, inicio, fim))
            esperado += 1
            i += 1
            continue
        # ressincroniza quando o artigo esperado não existe (revogado/omitido)
        if numero > esperado:
            futuros = [c for c in candidatos[i:] if c[0] == esperado]
            if futuros:
                i += 1
                continue
            esperado = numero
            continue
        i += 1

    chunks: list[dict] = []
    for pos, (numero, _inicio, fim) in enumerate(aceitos):
        limite = aceitos[pos + 1][1] if pos + 1 < len(aceitos) else len(texto)
        corpo = re.sub(r"\s+", " ", texto[fim:limite]).strip()
        if len(corpo) < 25:
            continue
        chunks.append(
            {
                "lei": lei,
                "artigo": str(numero),
                "texto": corpo[:4000],
                "fonte": fonte,
            }
        )
    return chunks


def main() -> None:
    todos: list[dict] = []
    for sigla, cfg in LEIS.items():
        pdf = RAW / cfg["arquivo"]
        limite = None
        if sigla == "CF":
            # a CF termina no art. 250; o ADCT (numeração própria) vem depois
            doc = pymupdf.open(pdf)
            for i, pagina in enumerate(doc):
                if re.search(r"\bArt\.\s*250\b", pagina.get_text()):
                    limite = i
                    break
        texto = extrair_texto(pdf, limite)
        artigos = fatiar_artigos(texto, sigla, cfg["fonte"])
        todos.extend(artigos)
        print(f"{sigla}: {len(artigos)} artigos de {cfg['nome']}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "meta": {
                    "fontes": {k: v["fonte"] for k, v in LEIS.items()},
                    "nomes": {k: v["nome"] for k, v in LEIS.items()},
                    "artigos": len(todos),
                    "atualizado_em": "2026-11",
                },
                "artigos": todos,
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"total: {len(todos)} artigos -> {OUT}")


if __name__ == "__main__":
    main()
