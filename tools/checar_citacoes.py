"""Valida cada fundamento_legal contra data/legal/artigos.json.

Uso: python tools/checar_citacoes.py
Sai com código 1 se houver citação inexistente.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = RAIZ / "data" / "legal" / "artigos.json"
FONTES = [
    RAIZ / "src" / "data" / "explicacoes-v2.json",
    RAIZ / "src" / "data" / "explicacoes-d1.json",
]


def main() -> int:
    base = json.loads(BASE.read_text(encoding="utf-8"))
    existentes = {(a["lei"], str(a["artigo"])) for a in base["artigos"]}

    total = 0
    falhas: list[str] = []
    for fonte in FONTES:
        if not fonte.exists():
            continue
        dados = json.loads(fonte.read_text(encoding="utf-8"))
        for chave, exp in dados.items():
            for fundamento in exp.get("fundamento_legal", []):
                total += 1
                par = (fundamento.get("lei", ""), str(fundamento.get("artigo", "")))
                if par not in existentes:
                    falhas.append(f"{fonte.name}:{chave} -> {par[0]} art. {par[1]}")

    print(f"citações verificadas: {total}")
    if falhas:
        print("FALHAS:")
        for falha in falhas:
            print(f" - {falha}")
        return 1
    print("todas as citações existem na base legal")
    return 0


if __name__ == "__main__":
    sys.exit(main())
