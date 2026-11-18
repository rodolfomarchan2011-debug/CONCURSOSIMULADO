"""Junta content/aulas/*.json em src/data/aulas.json (ordenado por id)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "content" / "aulas"
DESTINO = RAIZ / "src" / "data" / "aulas.json"


def main() -> int:
    aulas = []
    ids = set()
    for arquivo in sorted(ORIGEM.glob("*.json")):
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
        if dados["id"] in ids:
            print(f"id duplicado: {dados['id']} ({arquivo.name})")
            return 1
        ids.add(dados["id"])
        aulas.append(dados)

    aulas.sort(key=lambda a: a["id"])
    DESTINO.write_text(json.dumps(aulas, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"aulas montadas: {len(aulas)} -> {DESTINO}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
