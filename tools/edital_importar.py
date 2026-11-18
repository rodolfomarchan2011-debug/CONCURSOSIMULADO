"""Substitui a estrutura derivada pela transcrição do Anexo VIII.

Uso:
  python tools/edital_importar.py --pdf data/edital/anexo-viii.pdf
  python tools/edital_importar.py --mapa data/edital/mapa.json

--pdf  procura o tópico no texto do PDF e preenche edital_ref + estrutura_derivada=false.
--mapa JSON no formato {"tópico": "Anexo VIII, item 3.2"}.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
EDITAL = RAIZ / "data" / "edital" / "tjsp2607.json"


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", texto).strip().lower()


def texto_do_pdf(caminho: Path) -> str:
    import pymupdf

    return "\n".join(pagina.get_text() for pagina in pymupdf.open(caminho))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path)
    parser.add_argument("--mapa", type=Path)
    args = parser.parse_args()

    dados = json.loads(EDITAL.read_text(encoding="utf-8"))
    mapa: dict[str, str] = {}
    if args.mapa:
        mapa = json.loads(args.mapa.read_text(encoding="utf-8"))

    texto = normalizar(texto_do_pdf(args.pdf)) if args.pdf else ""

    atualizados = 0
    for item in dados["itens"]:
        topico = item["topico"]
        ref = mapa.get(topico)
        if not ref and texto and normalizar(topico) in texto:
            ref = f"Anexo VIII — {topico}"
        if ref:
            item["edital_ref"] = ref
            item["estrutura_derivada"] = False
            atualizados += 1

    if atualizados:
        dados["meta"]["estrutura_derivada"] = False
        dados["meta"]["fonte"] = "Anexo VIII transcrito"
        dados["meta"]["revisado"] = False
    EDITAL.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"tópicos com referência oficial: {atualizados}")
    print("revise o arquivo e marque revisado:true após conferência humana.")


if __name__ == "__main__":
    main()
