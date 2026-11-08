"""Ingestão da prova oficial VUNESP TJSP2503 (Escrevente Técnico Judiciário, 2025).

Fonte primária: caderno de prova e gabarito oficiais da Fundação VUNESP
(mirror público do PDF oficial). O script:
  1. reconstrói a ordem de leitura por coluna (PyMuPDF blocks);
  2. separa enunciado, alternativas A-E e contexto compartilhado;
  3. cruza com o gabarito oficial;
  4. valida a matriz 16/30/4/4/9/7 e grava JSON normalizado.

Uso:
  python tools/ingest_tjsp2025.py --prova prova.pdf --gabarito gabarito.pdf \
      --out data/questions-2025.json
"""

from __future__ import annotations

import argparse
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

import pymupdf
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Matriz oficial do edital 2027 (Anexo VIII), confirmada no caderno de 2025.
# ---------------------------------------------------------------------------
MATRIZ = {
    "Língua Portuguesa": 16,
    "Conhecimentos em Direito": 30,
    "Conhecimentos Gerais": 24,
}

# Faixas observadas no caderno de 2025 (mesma ordem do edital).
FAIXAS = [
    (1, 16, "Língua Portuguesa", "Interpretação de texto"),
    (17, 20, "Conhecimentos em Direito", "Direito Penal"),
    (21, 25, "Conhecimentos em Direito", "Direito Processual Penal"),
    (26, 30, "Conhecimentos em Direito", "Direito Processual Civil"),
    (31, 35, "Conhecimentos em Direito", "Direito Constitucional"),
    (36, 40, "Conhecimentos em Direito", "Direito Administrativo"),
    (41, 46, "Conhecimentos em Direito", "Legislação interna (TJSP)"),
    (47, 50, "Conhecimentos Gerais", "Atualidades"),
    (51, 54, "Conhecimentos Gerais", "Matemática"),
    (55, 63, "Conhecimentos Gerais", "Informática"),
    (64, 70, "Conhecimentos Gerais", "Raciocínio Lógico"),
]

HEADER_PATTERNS = (
    "TJSP2503",
    "CONFIDENCIAL",
    "PODER JUDICI",
    "TRIBUNAL DE JUSTI",
    "RASCUNHO",
)
SECTION_HEADERS = {
    "LÍNGUA PORTUGUESA",
    "CONHECIMENTOS EM DIREITO",
    "DIREITO PENAL",
    "DIREITO PROCESSUAL PENAL",
    "DIREITO PROCESSUAL CIVIL",
    "DIREITO CONSTITUCIONAL",
    "DIREITO ADMINISTRATIVO",
    "LEGISLAÇÃO INTERNA",
    "CONHECIMENTOS GERAIS",
    "ATUALIDADES",
    "MATEMÁTICA",
    "INFORMÁTICA",
    "RACIOCÍNIO LÓGICO",
    "REDAÇÃO",
}
INSTRUCAO_RE = re.compile(
    r"Leia o texto para responder .s quest[õo]es de\s+(\d{1,2})\s+a\s+(\d{1,2})",
    re.IGNORECASE,
)
ALT_RE = re.compile(r"\(([A-E])\)\s")


def _sem_acento(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


HEADERS_NORM = {_sem_acento(h).upper().strip() for h in SECTION_HEADERS}


# ---------------------------------------------------------------------------
# Schema de saída
# ---------------------------------------------------------------------------
class Questao(BaseModel):
    id: str
    numero: int
    bloco: str
    materia: str
    assunto: str
    contexto_id: str | None = None
    enunciado: str
    alternativas: dict[str, str]
    correta: str
    anulada: bool = False
    tem_imagem: bool = False
    imagens: list[str] = Field(default_factory=list)
    fonte: str
    fonte_pagina: int
    status_vigencia: str = "vigente"
    lei_que_alterou: str | None = None
    revisado: bool = False

    @field_validator("alternativas")
    @classmethod
    def cinco_alternativas(cls, v: dict[str, str]) -> dict[str, str]:
        if sorted(v) != ["A", "B", "C", "D", "E"]:
            raise ValueError(f"alternativas inválidas: {sorted(v)}")
        return v

    @field_validator("correta")
    @classmethod
    def correta_valida(cls, v: str) -> str:
        if v not in "ABCDE" or len(v) != 1:
            raise ValueError(f"gabarito inválido: {v}")
        return v


class Contexto(BaseModel):
    id: str
    texto: str
    fonte: str


class Banco(BaseModel):
    meta: dict
    contextos: list[Contexto]
    questoes: list[Questao]


# ---------------------------------------------------------------------------
# Extração
# ---------------------------------------------------------------------------
@dataclass
class Bloco:
    pagina: int
    x0: float
    y0: float
    x1: float
    y1: float
    texto: str
    coluna: int


def _limpar(texto: str) -> str:
    """Normaliza espaços, hífens de quebra de linha e caracteres invisíveis."""
    texto = texto.replace("\u00ad", "")  # soft hyphen
    for h in ("\u2010", "\u2011", "\u2012", "\u2013", "\u2212"):
        texto = texto.replace(h, "-")
    texto = texto.replace("\ufb01", "fi").replace("\ufb02", "fl")
    texto = re.sub(r"-\s*\n\s*", "", texto)  # hífen de fim de linha
    texto = re.sub(r"[ \t]+", " ", texto)
    texto = re.sub(r"\s*\n\s*", " ", texto)
    texto = re.sub(r"\s{2,}", " ", texto)
    return texto.strip()


RESIDUO_RE = re.compile(
    r"(R\s*A\s*S\s*C\s*U\s*N\s*H\s*O|REDA[ÇC][ÃA]O\s+EM\s+L[ÍI]NGUA\s+PORTUGUESA|Texto\s+1\s+Os\s+brasileiros)",
    re.IGNORECASE,
)


def _cortar_residuo(texto: str) -> str:
    m = RESIDUO_RE.search(texto)
    return texto[: m.start()].rstrip(" .;:-") if m else texto


COMPOSTOS = {
    "auxiliotransporte": "auxílio-transporte",
    "auxilioalimentacao": "auxílio-alimentação",
    "auxiliosaude": "auxílio-saúde",
    "auxiliotecnologico": "auxílio-tecnológico",
    "superricos": "super-ricos",
    "superrico": "super-rico",
    "recenseguranca": "recém-segurança",
}


def _reparar_quebras(texto: str) -> str:
    """Junta palavras partidas entre blocos/colunas ('Univer- sidade')."""
    texto = re.sub(r"([A-Za-zÀ-ÿ])-\s+([a-zà-ÿ])", r"\1\2", texto)
    for errado, certo in COMPOSTOS.items():
        texto = re.sub(errado, certo, texto, flags=re.IGNORECASE)
    return texto


def _eh_lixo(texto: str, y0: float) -> bool:
    up = texto.upper()
    if y0 > 790:  # rodapé
        return True
    # cabeçalhos são curtos; questões podem citar "Tribunal de Justiça" no corpo
    if len(texto) < 120 and any(p in up for p in HEADER_PATTERNS):
        return True
    if re.fullmatch(r"\d{1,3}", texto.strip()):
        return True
    return False


def extrair_blocos(pdf: Path) -> list[Bloco]:
    doc = pymupdf.open(pdf)
    blocos: list[Bloco] = []
    for indice, pagina in enumerate(doc):
        meio = pagina.rect.width / 2
        for x0, y0, x1, y1, texto, _bno, tipo in pagina.get_text("blocks"):
            if tipo != 0:
                continue
            texto = texto.strip()
            if not texto or _eh_lixo(texto, y0):
                continue
            # coluna pela borda esquerda: blocos de largura total contam como
            # coluna esquerda e são ordenados pelo topo (evita inverter 58/59).
            coluna = 0 if x0 < 290 else 1
            blocos.append(Bloco(indice + 1, x0, y0, x1, y1, texto, coluna))
    # ordem de leitura: página -> coluna -> topo
    blocos.sort(key=lambda b: (b.pagina, b.coluna, b.y0, b.x0))
    return blocos


def montar_texto(blocos: list[Bloco]) -> tuple[str, list[tuple[int, int]]]:
    """Concatena blocos e devolve os offsets de início de cada bloco."""
    partes: list[str] = []
    offsets: list[tuple[int, int]] = []  # (offset_inicial, indice_bloco)
    pos = 0
    for i, b in enumerate(blocos):
        if b.pagina <= 2:  # capa e instruções gerais
            continue
        t = _limpar(b.texto)
        if not t:
            continue
        if _sem_acento(t).upper().strip() in HEADERS_NORM:
            continue
        offsets.append((pos, i))
        partes.append(t)
        pos += len(t) + 1
    return " ".join(partes), offsets


def pagina_do_offset(offsets: list[tuple[int, int]], blocos: list[Bloco], offset: int) -> int:
    pagina = 3
    for inicio, idx in offsets:
        if inicio > offset:
            break
        pagina = blocos[idx].pagina
    return pagina


def parse_gabarito(pdf: Path) -> dict[int, str]:
    doc = pymupdf.open(pdf)
    texto = "\n".join(p.get_text() for p in doc)
    gab: dict[int, str] = {}
    for m in re.finditer(r"(\d{1,2})\s*[-–]\s*([A-E])\b", texto):
        gab.setdefault(int(m.group(1)), m.group(2))
    return gab


def classificar(numero: int) -> tuple[str, str, str]:
    """Retorna (bloco, matéria, assunto). Matéria = bloco avaliativo."""
    for inicio, fim, bloco, assunto in FAIXAS:
        if inicio <= numero <= fim:
            return bloco, bloco, assunto
    raise ValueError(f"questão fora da matriz: {numero}")


def _extrair_alternativas(corpo: str) -> tuple[str, dict[str, str]] | None:
    marcas = list(ALT_RE.finditer(corpo))
    letras = [m.group(1) for m in marcas]
    if letras != ["A", "B", "C", "D", "E"]:
        return None
    enunciado = corpo[: marcas[0].start()].strip()
    alternativas: dict[str, str] = {}
    for i, m in enumerate(marcas):
        fim = marcas[i + 1].start() if i + 1 < len(marcas) else len(corpo)
        alternativas[m.group(1)] = corpo[m.end():fim].strip(" ;")
    if any(not v for v in alternativas.values()):
        return None
    return enunciado, alternativas


def _marcador(numero: int) -> re.Pattern[str]:
    # aceita "07." e "7."; evita casar com datas/decimais ("01.09.2025", "50.000")
    return re.compile(rf"(?<!\d){numero:02d}\.\s")


def ingerir(prova: Path, gabarito: Path, out: Path) -> Banco:
    blocos = extrair_blocos(prova)
    texto, offsets = montar_texto(blocos)
    gab = parse_gabarito(gabarito)

    # marcadores sequenciais (1..70)
    marcas: list[re.Match[str]] = []
    cursor = 0
    for numero in range(1, 71):
        m = _marcador(numero).search(texto, cursor)
        if not m:
            raise SystemExit(f"não encontrei o marcador da questão {numero:02d}")
        marcas.append(m)
        cursor = m.end()

    # contextos: da instrução até o marcador da primeira questão do grupo
    contextos: list[Contexto] = []
    contexto_por_numero: dict[int, str] = {}
    for inicio_q, fim_q in [(1, 5), (6, 10), (11, 16)]:
        janela = texto[: marcas[inicio_q - 1].start()]
        instrucoes = list(INSTRUCAO_RE.finditer(janela))
        if not instrucoes:
            continue
        inst = instrucoes[-1]
        if int(inst.group(1)) != inicio_q:
            continue
        trecho = texto[inst.end(): marcas[inicio_q - 1].start()].strip()
        if not trecho:
            continue
        cid = f"ctx-{inicio_q:02d}-{fim_q:02d}"
        contextos.append(
            Contexto(
                id=cid,
                texto=_reparar_quebras(_limpar(trecho)),
                fonte=f"VUNESP TJSP2503, p. {pagina_do_offset(offsets, blocos, inst.start())}",
            )
        )
        for n in range(inicio_q, fim_q + 1):
            if n <= len(marcas):
                contexto_por_numero[n] = cid

    questoes: list[Questao] = []
    for i, m in enumerate(marcas):
        numero = i + 1
        fim = marcas[i + 1].start() if i + 1 < len(marcas) else len(texto)
        corpo = texto[m.end(): fim].strip()
        # remove instrução de contexto que tenha vazado para o fim do trecho
        inst = INSTRUCAO_RE.search(corpo)
        if inst and "(A)" in corpo[: inst.start()]:
            corpo = corpo[: inst.start()].strip()
        corpo = _cortar_residuo(corpo)
        corpo = _reparar_quebras(corpo)
        parsed = _extrair_alternativas(corpo)
        if not parsed:
            raise SystemExit(
                f"falha ao separar alternativas da questão {numero}: "
                f"{[x.group(1) for x in ALT_RE.finditer(corpo)]} :: {corpo[:400]!r}"
            )
        enunciado, alternativas = parsed
        bloco, materia, assunto = classificar(numero)
        if numero not in gab:
            raise SystemExit(f"gabarito ausente para a questão {numero}")
        questoes.append(
            Questao(
                id=f"tjsp2503-{numero:02d}",
                numero=numero,
                bloco=bloco,
                materia=materia,
                assunto=assunto,
                contexto_id=contexto_por_numero.get(numero),
                enunciado=enunciado,
                alternativas=alternativas,
                correta=gab[numero],
                fonte="VUNESP TJSP2503/001-EscreventeTécnicoJudiciário",
                fonte_pagina=pagina_do_offset(offsets, blocos, m.start()),
            )
        )

    questoes.sort(key=lambda q: q.numero)
    if [q.numero for q in questoes] != list(range(1, 71)):
        raise SystemExit("numeração incompleta")

    contagem = {materia: sum(1 for q in questoes if q.materia == materia) for materia in MATRIZ}
    for materia, esperado in MATRIZ.items():
        if contagem[materia] != esperado:
            raise SystemExit(f"matriz divergente em {materia}: {contagem[materia]} != {esperado}")

    banco = Banco(
        meta={
            "concurso": "TJSP — Escrevente Técnico Judiciário",
            "banca": "VUNESP",
            "edital": "TJSP2503 (ciclo 2025)",
            "prova_aplicada_em": "2025-12-07",
            "questoes": len(questoes),
            "matriz": contagem,
            "gabarito_fonte": "VUNESP TJSP2503 — gabarito oficial (versão 1)",
            "gerado_por": "tools/ingest_tjsp2025.py",
        },
        contextos=contextos,
        questoes=questoes,
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(banco.model_dump_json(indent=2, ensure_ascii=False), encoding="utf-8")
    return banco


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prova", required=True, type=Path)
    ap.add_argument("--gabarito", required=True, type=Path)
    ap.add_argument("--out", default=Path("data/questions-2025.json"), type=Path)
    args = ap.parse_args()
    banco = ingerir(args.prova, args.gabarito, args.out)
    print(f"ok: {len(banco.questoes)} questões, {len(banco.contextos)} contextos -> {args.out}")


if __name__ == "__main__":
    main()
