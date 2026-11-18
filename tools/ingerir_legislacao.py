"""Baixa/parseia legislação oficial atualizada e gera a base de artigos do tutor.

Fontes:
- Federais: Câmara dos Deputados ("normaatualizada").
- Estadual SP (Lei 10.261/68): ALESP.

Uso: python tools/ingerir_legislacao.py
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import urllib.request
from datetime import date
from pathlib import Path

import pymupdf

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "legal" / "raw"
OUT = RAIZ / "data" / "legal" / "artigos.json"
UA = {"User-Agent": "Mozilla/5.0"}

LEIS = {
    "CF": {
        "arquivo": "cf.pdf",
        "tipo": "pdf",
        "min": 200,
        "nome": "Constituição Federal de 1988",
        "fonte": "https://www2.camara.leg.br/legin/fed/consti/1988/constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.pdf",
    },
    "CP": {
        "arquivo": "cp.pdf",
        "tipo": "pdf",
        "min": 300,
        "nome": "Código Penal (Decreto-Lei 2.848/1940)",
        "fonte": "https://www2.camara.leg.br/legin/fed/declei/1940-1949/decreto-lei-2848-7-dezembro-1940-412868-normaatualizada-pe.pdf",
    },
    "CPP": {
        "arquivo": "cpp.pdf",
        "tipo": "pdf",
        "min": 700,
        "nome": "Código de Processo Penal (Decreto-Lei 3.689/1941)",
        "fonte": "https://www2.camara.leg.br/legin/fed/declei/1940-1949/decreto-lei-3689-3-outubro-1941-322206-normaatualizada-pe.pdf",
    },
    "CPC": {
        "arquivo": "cpc.pdf",
        "tipo": "pdf",
        "min": 900,
        "nome": "Código de Processo Civil (Lei 13.105/2015)",
        "fonte": "https://www2.camara.leg.br/legin/fed/lei/2015/lei-13105-16-marco-2015-780273-normaatualizada-pl.pdf",
    },
    "L8429": {
        "arquivo": "l8429.pdf",
        "tipo": "pdf",
        "min": 25,
        "nome": "Lei 8.429/1992 (Improbidade Administrativa)",
        "fonte": "https://www2.camara.leg.br/legin/fed/lei/1992/lei-8429-2-junho-1992-357452-normaatualizada-pl.pdf",
        "exige": "14.230",
    },
    "L9099": {
        "arquivo": "l9099.pdf",
        "tipo": "pdf",
        "min": 90,
        "nome": "Lei 9.099/1995 (Juizados Especiais)",
        "fonte": "https://www2.camara.leg.br/legin/fed/lei/1995/lei-9099-26-setembro-1995-348608-normaatualizada-pl.pdf",
    },
    "L13146": {
        "arquivo": "l13146.pdf",
        "tipo": "pdf",
        "min": 120,
        "nome": "Lei 13.146/2015 (Estatuto da Pessoa com Deficiência)",
        "fonte": "https://www2.camara.leg.br/legin/fed/lei/2015/lei-13146-6-julho-2015-781174-normaatualizada-pl.pdf",
    },
    "L10261": {
        "arquivo": "l10261.html",
        "tipo": "html",
        "min": 250,
        "nome": "Lei 10.261/1968 (Estatuto dos Funcionários Públicos Civis do Estado de SP)",
        "fonte": "https://www.al.sp.gov.br/repositorio/legislacao/lei/1968/lei-10261-28.10.1968.html",
    },
}

ARTIGO_RE = re.compile(
    r"(?m)^\s*(?:Art\.|ART\.|Artigo)\s*(\d{1,3}(?:\.\d{3})?)\s*[ºo°]?\s*[-–.]?\s*"
)

# Estrutura esperada do texto vigente (lacunas declaradas = dispositivos vetados).
ESTRUTURA = {
    "L8429": {"total": 22, "lacunas": [4, 5, 6]},
    "L9099": {"total": 97, "lacunas": []},
    "L13146": {"total": 124, "lacunas": [29, 82, 106]},
    "L10261": {"total": 329, "lacunas": [129, 330]},
}
LIXO = (
    "www.camara.leg.br",
    "www2.camara.leg.br",
    "Câmara dos Deputados",
    "Portal da Câmara",
    "Página ",
    "al.sp.gov.br",
)


def baixar(cfg: dict, destino: Path) -> None:
    if destino.exists() and destino.stat().st_size > 10_000:
        return
    req = urllib.request.Request(cfg["fonte"], headers=UA)
    with urllib.request.urlopen(req, timeout=120) as resposta:
        destino.write_bytes(resposta.read())


def extrair_texto_pdf(pdf: Path, limite_pagina: int | None = None) -> str:
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
            if re.fullmatch(r"\d{1,3}", limpa):
                continue
            linhas.append(limpa)
    return "\n".join(linhas)


def extrair_texto_html(caminho: Path) -> str:
    bruto = caminho.read_bytes()
    texto = None
    for encoding in ("utf-8", "latin-1"):
        try:
            texto = bruto.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if texto is None:
        texto = bruto.decode("utf-8", "replace")
    texto = re.sub(r"<(script|style).*?</\1>", " ", texto, flags=re.S | re.I)
    texto = re.sub(r"<[^>]+>", "\n", texto)
    texto = html.unescape(texto)
    linhas = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    return "\n".join(linhas)


def fatiar_artigos(texto: str, lei: str, fonte: str) -> list[dict]:
    candidatos = [
        (int(m.group(1).replace(".", "")), m.start(), m.end())
        for m in ARTIGO_RE.finditer(texto)
    ]
    aceitos: list[tuple[int, int, int]] = []
    esperado = 1
    i = 0
    while i < len(candidatos):
        numero, _inicio, fim = candidatos[i]
        if numero == esperado:
            aceitos.append((numero, _inicio, fim))
            esperado += 1
            i += 1
            continue
        if numero > esperado:
            if any(c[0] == esperado for c in candidatos[i:]):
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


def emenda_mais_recente(texto: str) -> str:
    """Maior número de lei citado no corpo (prova de até onde o texto está atualizado)."""
    achados = re.findall(
        r"Lei\s+(?:n[ºo°.]*\s*)?([\d.]{3,})\s*(?:,\s*de\s+(\d{1,2}/\d{1,2}/\d{4}))?",
        texto,
        flags=re.IGNORECASE,
    )
    melhor = None
    for numero, data in achados:
        try:
            valor = int(numero.replace(".", ""))
        except ValueError:
            continue
        if melhor is None or valor > melhor[0]:
            melhor = (valor, numero, data)
    if not melhor:
        return ""
    _, numero, data = melhor
    if data:
        ano = data.split("/")[-1]
        return f"{numero}/{ano}"
    return numero


def validar_estrutura(sigla: str, artigos: list[dict]) -> str:
    esperado = ESTRUTURA.get(sigla)
    if not esperado:
        return ""
    numeros = sorted(int(a["artigo"]) for a in artigos)
    if len(numeros) != esperado["total"]:
        return f"contagem {len(numeros)} != esperado {esperado['total']}"
    maximo = max(numeros)
    faltando = [n for n in range(1, maximo + 1) if n not in set(numeros)]
    if faltando != esperado["lacunas"]:
        return f"lacunas {faltando} != declaradas {esperado['lacunas']}"
    return ""


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    todos: list[dict] = []
    meta_leis: dict[str, dict] = {}

    for sigla, cfg in LEIS.items():
        arquivo = RAW / cfg["arquivo"]
        registro = {
            "nome": cfg["nome"],
            "url": cfg["fonte"],
            "coletado_em": date.today().isoformat(),
        }
        try:
            baixar(cfg, arquivo)
            if cfg["tipo"] == "pdf":
                limite = None
                if sigla == "CF":
                    doc = pymupdf.open(arquivo)
                    for i, pagina in enumerate(doc):
                        if re.search(r"\bArt\.\s*250\b", pagina.get_text()):
                            limite = i
                            break
                texto = extrair_texto_pdf(arquivo, limite)
            else:
                texto = extrair_texto_html(arquivo)

            artigos = fatiar_artigos(texto, sigla, cfg["fonte"])
            registro["sha256"] = hashlib.sha256(arquivo.read_bytes()).hexdigest()
            registro["artigos"] = len(artigos)
            registro["lacunas"] = ESTRUTURA.get(sigla, {}).get("lacunas", [])
            registro["emenda_mais_recente"] = emenda_mais_recente(texto)
            if sigla == "L8429" and "15.269" in texto:
                registro["emenda_mais_recente"] = "15.269/2025"

            falha = validar_estrutura(sigla, artigos)
            if not falha and (not artigos[0]["texto"] or not artigos[-1]["texto"]):
                falha = "primeiro ou último artigo vazio"
            if not falha and cfg.get("exige") and cfg["exige"] not in texto:
                falha = f"não contém a marca {cfg['exige']}"

            if falha:
                registro["status"] = "pendente_manual"
                registro["motivo"] = falha
                print(f"{sigla}: PENDENTE — {falha}")
            else:
                registro["status"] = "ok"
                todos.extend(artigos)
                print(f"{sigla}: {len(artigos)} artigos de {cfg['nome']}")
        except Exception as exc:  # noqa: BLE001
            registro["status"] = "pendente_manual"
            registro["motivo"] = f"erro: {exc}"
            print(f"{sigla}: PENDENTE — {exc}")
        meta_leis[sigla] = registro

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "meta": {
                    "fontes": {k: v["url"] for k, v in meta_leis.items()},
                    "nomes": {k: v["nome"] for k, v in meta_leis.items()},
                    "leis": meta_leis,
                    "artigos": len(todos),
                    "atualizado_em": date.today().isoformat(),
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
