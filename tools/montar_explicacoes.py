"""Junta content/explicacoes/*.json em src/data/explicacoes-d1.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "content" / "explicacoes"
DESTINO = RAIZ / "src" / "data" / "explicacoes-d1.json"


def main() -> int:
    mapa = {}
    for arquivo in sorted(ORIGEM.glob("*.json")):
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
        chave = dados.get("questao_id")
        if not chave:
            print(f"sem questao_id: {arquivo.name}")
            return 1
        if chave in mapa:
            print(f"questao duplicada: {chave}")
            return 1
        mapa[chave] = dados

    DESTINO.write_text(json.dumps(mapa, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"explicações montadas: {len(mapa)} -> {DESTINO}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
