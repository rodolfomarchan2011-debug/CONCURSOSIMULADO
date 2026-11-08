"""Valida o banco multi-edição gerado por tools/ingest_edicoes.py.

Uso: python tools/test_ingest.py
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ALVO = RAIZ / "src" / "data" / "banco.json"


def main() -> int:
    banco = json.loads(ALVO.read_text(encoding="utf-8"))
    questoes = banco["questoes"]
    erros: list[str] = []

    if len(questoes) < 230:
        erros.append(f"total {len(questoes)} < 230")

    ids = [q["id"] for q in questoes]
    if len(set(ids)) != len(ids):
        erros.append("ids repetidos")

    for q in questoes:
        if sorted(q["alternativas"]) != ["A", "B", "C", "D", "E"]:
            erros.append(f"{q['id']}: alternativas inválidas")
        if q["correta"] not in "ABCDE":
            erros.append(f"{q['id']}: gabarito inválido")
        if q["anulada"]:
            erros.append(f"{q['id']}: anulada")
        if not q["enunciado"].strip() or any(
            not v.strip() for v in q["alternativas"].values()
        ):
            erros.append(f"{q['id']}: texto vazio")

    por_edicao = Counter(q["edicao"] for q in questoes)
    if set(por_edicao) != {"2025", "2024", "2018", "2015", "2004"}:
        erros.append(f"edições inesperadas: {dict(por_edicao)}")

    vigentes = [q for q in questoes if q["status_vigencia"] == "vigente"]
    lp = sum(1 for q in vigentes if q["materia"] == "Língua Portuguesa")
    direito = sum(1 for q in vigentes if q["materia"] == "Conhecimentos em Direito")
    gerais = sum(1 for q in vigentes if q["materia"] == "Conhecimentos Gerais")
    if lp < 16:
        erros.append(f"Português vigente insuficiente: {lp}")
    if direito < 30:
        erros.append(f"Direito vigente insuficiente: {direito}")
    if gerais < 24:
        erros.append(f"Gerais vigente insuficiente: {gerais}")

    minimo = min(min(len(v) for v in q["alternativas"].values()) for q in questoes)
    if minimo < 1:
        erros.append("alternativa vazia")

    if erros:
        print("FALHOU")
        for e in erros:
            print(" -", e)
        return 1

    print(
        f"OK: {len(questoes)} questões | {dict(por_edicao)} | "
        f"vigentes LP {lp}, Direito {direito}, Gerais {gerais} | "
        f"contextos {len(banco.get('contextos', []))}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
