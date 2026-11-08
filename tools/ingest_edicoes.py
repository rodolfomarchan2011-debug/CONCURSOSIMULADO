"""Ingestão de múltiplas edições da prova de Escrevente do TJSP (VUNESP).

Cada edição tem sua própria matriz (nº de questões e faixas por matéria).
O script parseia o caderno oficial, cruza com o gabarito e grava um banco
único usado pelo app (simulado sorteado + treino).

Uso:
  python tools/ingest_edicoes.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pymupdf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_tjsp2025 import (  # noqa: E402
    ALT_RE,
    Bloco,
    _cortar_residuo,
    _extrair_alternativas,
    _limpar,
    _reparar_quebras,
    _sem_acento,
)

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
OUT = RAIZ / "src" / "data" / "banco.json"

LP = "Língua Portuguesa"
DIR = "Conhecimentos em Direito"
GER = "Conhecimentos Gerais"

INSTRUCAO_RE = re.compile(
    r"responder .s quest[õo]es(?: de n[úu]meros)?\s+(\d{1,2})\s+a\s+(\d{1,2})",
    re.IGNORECASE,
)

# (primeira, última, bloco, assunto)
EDICOES = {
    "2025": {
        "prova": "vunesp-tjsp2503-prova.pdf",
        "gabarito": "vunesp-tjsp2503-gabarito.pdf",
        "n": 70,
        "aplicada": "2025-12-07",
        "faixas": [
            (1, 16, LP, "Interpretação de texto"),
            (17, 20, DIR, "Direito Penal"),
            (21, 25, DIR, "Direito Processual Penal"),
            (26, 30, DIR, "Direito Processual Civil"),
            (31, 35, DIR, "Direito Constitucional"),
            (36, 40, DIR, "Direito Administrativo"),
            (41, 46, DIR, "Legislação interna (TJSP)"),
            (47, 50, GER, "Atualidades"),
            (51, 54, GER, "Matemática"),
            (55, 63, GER, "Informática"),
            (64, 70, GER, "Raciocínio Lógico"),
        ],
    },
    "2018": {
        "prova": "2018-prova.pdf",
        "gabarito": "2018-gabarito.pdf",
        "n": 100,
        "aplicada": "2018-03-25",
        "faixas": [
            (1, 24, LP, "Interpretação de texto"),
            (25, 30, DIR, "Direito Penal"),
            (31, 37, DIR, "Direito Processual Penal"),
            (38, 44, DIR, "Direito Processual Civil"),
            (45, 51, DIR, "Direito Constitucional"),
            (52, 64, DIR, "Direito Administrativo"),
            (65, 76, GER, "Atualidades"),
            (77, 90, GER, "Informática"),
            (91, 100, GER, "Raciocínio Lógico"),
        ],
    },
    "2004": {
        "prova": "2004-prova-gabarito.pdf",
        "gabarito": "2004-prova-gabarito.pdf",
        "n": 70,
        "aplicada": "2004-01-01",
        "gabarito_pagina": 16,
        "faixas": [
            (1, 30, LP, "Interpretação de texto"),
            (31, 35, GER, "Atualidades"),
            (36, 40, GER, "Matemática"),
            (41, 45, DIR, "Direito Penal"),
            (46, 50, DIR, "Direito Processual Penal"),
            (51, 55, DIR, "Direito Processual Civil"),
            (56, 60, DIR, "Direito Constitucional"),
            (61, 65, DIR, "Direito Administrativo"),
            (66, 70, DIR, "Legislação interna (TJSP)"),
        ],
    },
}

LIXO = ("pcimarkpci", "pciconcursos", "confidencial", "tjsp2503", "tjsp1704")
HEADERS_EXTRA = {
    "PORTUGUÊS",
    "CONHECIMENTOS",
    "CONHECIMENTOS GERAIS",
    "CONHECIMENTOS EM DIREITO",
    "LÍNGUA PORTUGUESA",
    "DIREITO",
    "DIREITO PENAL",
    "DIREITO PROCESSUAL PENAL",
    "DIREITO PROCESSUAL CIVIL",
    "DIREITO CONSTITUCIONAL",
    "DIREITO ADMINISTRATIVO",
    "NORMAS DA CORREGEDORIA GERAL DA JUSTIÇA",
    "LEGISLAÇÃO INTERNA",
    "INFORMÁTICA",
    "MATEMÁTICA",
    "RACIOCÍNIO LÓGICO",
    "ATUALIDADES",
    "RASCUNHO",
}


def eh_lixo(texto: str, y0: float) -> bool:
    up = texto.upper()
    if y0 > 790:
        return True
    if len(texto) < 120 and any(p in up for p in LIXO):
        return True
    if any(p in texto for p in ("pcimarkpci", "pciconcursos")):
        return True
    return bool(re.fullmatch(r"\d{1,3}", texto.strip()))


def blocos_da_prova(pdf: Path) -> list[Bloco]:
    doc = pymupdf.open(pdf)
    out: list[Bloco] = []
    for i, pg in enumerate(doc):
        for x0, y0, x1, y1, texto, _b, tipo in pg.get_text("blocks"):
            if tipo != 0 or not texto.strip():
                continue
            if eh_lixo(texto.strip(), y0):
                continue
            out.append(
                Bloco(i + 1, x0, y0, x1, y1, texto.strip(), 0 if x0 < 290 else 1)
            )
    out.sort(key=lambda b: (b.pagina, b.coluna, b.y0, b.x0))
    return out


def texto_da_prova(pdf: Path) -> tuple[str, list[tuple[int, int]], list[Bloco]]:
    blocos = blocos_da_prova(pdf)
    partes: list[str] = []
    offsets: list[tuple[int, int]] = []
    pos = 0
    for idx, b in enumerate(blocos):
        t = _limpar(b.texto)
        if not t or _sem_acento(t).upper().strip() in HEADERS_EXTRA:
            continue
        offsets.append((pos, idx))
        partes.append(t)
        pos += len(t) + 1
    return " ".join(partes), offsets, blocos


def pagina_do_offset(offsets, blocos, off):
    pagina = 1
    for inicio, idx in offsets:
        if inicio > off:
            break
        pagina = blocos[idx].pagina
    return pagina


def gabarito_do_pdf(pdf: Path, pagina: int | None = None) -> dict[int, str]:
    doc = pymupdf.open(pdf)
    paginas = [doc[pagina - 1]] if pagina else list(doc)
    texto = "\n".join(p.get_text() for p in paginas)
    gab: dict[int, str] = {}
    for m in re.finditer(r"(\d{1,3})\s*[-–]\s*([A-E])\b", texto):
        numero, letra = int(m.group(1)), m.group(2)
        if numero <= 200:
            gab.setdefault(numero, letra)
    return gab


def classificar(numero: int, faixas) -> tuple[str, str]:
    for ini, fim, bloco, assunto in faixas:
        if ini <= numero <= fim:
            return bloco, assunto
    raise ValueError(f"fora da matriz: {numero}")


def ingerir(ano: str) -> dict:
    cfg = EDICOES[ano]
    prova = RAW / cfg["prova"]
    gabarito = RAW / cfg["gabarito"]
    n = cfg["n"]

    texto, offsets, blocos = texto_da_prova(prova)
    gab = gabarito_do_pdf(gabarito, cfg.get("gabarito_pagina"))

    marcas: list[re.Match[str]] = []
    inicio = texto.upper().find("LÍNGUA PORTUGUESA")
    if inicio < 0:
        inicio = texto.upper().find("PORTUGUÊS")
    cursor = max(0, inicio)
    for numero in range(1, n + 1):
        padrao = re.compile(rf"(?<!\d)0?{numero}\.\s")
        m = padrao.search(texto, cursor)
        # ignora ocorrências de capa/índice: o corpo precisa ter alternativas
        while m and not (
            "(A)" in texto[m.end(): m.end() + 6000]
            and "(E)" in texto[m.end(): m.end() + 6000]
        ):
            m = padrao.search(texto, m.end())
        if not m:
            raise SystemExit(f"{ano}: marcador {numero} não encontrado")
        marcas.append(m)
        cursor = m.end()

    # contextos de interpretação: qualquer instrução "responder às questões X a Y"
    contextos: dict[str, dict] = {}
    ctx_por_numero: dict[int, str] = {}
    for inst in INSTRUCAO_RE.finditer(texto):
        ini, fim = int(inst.group(1)), int(inst.group(2))
        if not (1 <= ini <= fim <= n):
            continue
        inicio_questao = marcas[ini - 1].start()
        fim_anterior = marcas[ini - 2].end() if ini > 1 else 0
        if not (fim_anterior <= inst.start() < inicio_questao):
            continue
        trecho = texto[inst.end(): inicio_questao].strip()
        if len(trecho) < 80:
            continue
        cid = f"{ano}-ctx-{ini:02d}-{fim:02d}"
        contextos[cid] = {
            "id": cid,
            "texto": _reparar_quebras(_limpar(trecho)),
            "fonte": f"VUNESP TJSP {ano}, p. {pagina_do_offset(offsets, blocos, inst.start())}",
        }
        for k in range(ini, fim + 1):
            ctx_por_numero[k] = cid

    questoes = []
    puladas: list[tuple[int, str]] = []
    for i, m in enumerate(marcas):
        numero = i + 1
        fim = marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)
        corpo = texto[m.end(): fim].strip()
        inst = INSTRUCAO_RE.search(corpo)
        if inst and "(A)" in corpo[: inst.start()]:
            corpo = corpo[: inst.start()].strip()
        corpo = _reparar_quebras(_cortar_residuo(corpo))
        corte = corpo.find("Gabarito de ")
        if corte > 500:
            corpo = corpo[:corte].strip()
        parsed = _extrair_alternativas(corpo)
        if not parsed:
            puladas.append((numero, "alternativas incompletas (provável questão com imagem)"))
            continue
        enunciado, alternativas = parsed
        bloco, assunto = classificar(numero, cfg["faixas"])
        if numero not in gab:
            puladas.append((numero, "sem gabarito"))
            continue
        questoes.append(
            {
                "id": f"tjsp-{ano}-{numero:03d}",
                "edicao": ano,
                "ano": int(ano),
                "numero": numero,
                "bloco": bloco,
                "materia": bloco,
                "assunto": assunto,
                "contexto_id": ctx_por_numero.get(numero),
                "enunciado": enunciado,
                "alternativas": alternativas,
                "correta": gab[numero],
                "anulada": False,
                "tem_imagem": False,
                "imagens": [],
                "fonte": f"VUNESP TJSP {ano}",
                "fonte_pagina": pagina_do_offset(offsets, blocos, m.start()),
                # Direito de 2004 é anterior ao CPC/2015 e a várias reformas:
                # entra no treino com aviso, mas fica fora do simulado oficial.
                "status_vigencia": (
                    "revisar" if ano == "2004" and bloco == DIR else "vigente"
                ),
                "lei_que_alterou": None,
                "revisado": False,
            }
        )
    return {
        "ano": ano,
        "questoes": questoes,
        "contextos": list(contextos.values()),
        "meta": cfg,
        "puladas": puladas,
    }


def main() -> None:
    todas: list[dict] = []
    contextos: list[dict] = []
    metas: dict[str, dict] = {}
    for ano in EDICOES:
        dados = ingerir(ano)
        todas.extend(dados["questoes"])
        contextos.extend(dados["contextos"])
        metas[ano] = {
            "questoes": len(dados["questoes"]),
            "aplicada": dados["meta"].get("aplicada"),
            "puladas": dados["puladas"],
            "matriz": {
                a: sum(1 for q in dados["questoes"] if q["assunto"] == a)
                for a in sorted({q["assunto"] for q in dados["questoes"]})
            },
        }
        if dados["puladas"]:
            print(f"  puladas em {ano}: {dados['puladas']}")
        print(f"{ano}: {len(dados['questoes'])} questões")

    banco = {
        "meta": {
            "concurso": "TJSP — Escrevente Técnico Judiciário",
            "banca": "VUNESP",
            "edicoes": metas,
            "total": len(todas),
            "gerado_por": "tools/ingest_edicoes.py",
        },
        "contextos": contextos,
        "questoes": todas,
    }
    OUT.write_text(json.dumps(banco, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"total: {len(todas)} questões -> {OUT}")


if __name__ == "__main__":
    main()
