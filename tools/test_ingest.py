"""Valida o JSON gerado pela ingestão. Uso: python tools/test_ingest.py"""

from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ALVO = RAIZ / "src" / "data" / "questions-2025.json"

MATRIZ = {
    "Língua Portuguesa": 16,
    "Conhecimentos em Direito": 30,
    "Atualidades": 4,
    "Matemática": 4,
    "Informática": 9,
    "Raciocínio Lógico": 7,
}


def main() -> int:
    banco = json.loads(ALVO.read_text(encoding="utf-8"))
    questoes = banco["questoes"]
    erros: list[str] = []

    if len(questoes) != 70:
        erros.append(f"total {len(questoes)} != 70")
    if [q["numero"] for q in questoes] != list(range(1, 71)):
        erros.append("numeração fora de ordem")

    contagem: dict[str, int] = {}
    for q in questoes:
        contagem[q["assunto"]] = contagem.get(q["assunto"], 0) + 1
        if sorted(q["alternativas"]) != ["A", "B", "C", "D", "E"]:
            erros.append(f"questão {q['numero']}: alternativas inválidas")
        if q["correta"] not in "ABCDE":
            erros.append(f"questão {q['numero']}: gabarito inválido")
        if q["anulada"]:
            erros.append(f"questão {q['numero']}: anulada")
        if not q["enunciado"].strip() or any(
            not v.strip() for v in q["alternativas"].values()
        ):
            erros.append(f"questão {q['numero']}: texto vazio")

    for chave, esperado in {
        "Língua Portuguesa": MATRIZ["Língua Portuguesa"],
        "Conhecimentos em Direito": MATRIZ["Conhecimentos em Direito"],
    }.items():
        obtido = sum(1 for q in questoes if q["materia"] == chave)
        if obtido != esperado:
            erros.append(f"{chave}: {obtido} != {esperado}")

    for chave in ("Atualidades", "Matemática", "Informática", "Raciocínio Lógico"):
        if contagem.get(chave) != MATRIZ[chave]:
            erros.append(f"{chave}: {contagem.get(chave)} != {MATRIZ[chave]}")

    if len(banco.get("contextos", [])) < 3:
        erros.append("contextos insuficientes")

    if erros:
        print("FALHOU")
        for e in erros:
            print(" -", e)
        return 1

    print(
        f"OK: {len(questoes)} questões, matriz 16/30/4/4/9/7, "
        f"{len(banco['contextos'])} contextos"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
