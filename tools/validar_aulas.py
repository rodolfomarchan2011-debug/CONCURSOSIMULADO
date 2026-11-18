"""Valida src/data/aulas.json: 15 aulas, 600-900 palavras, ids reais e citações existentes."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
AULAS = RAIZ / "src" / "data" / "aulas.json"
BANCO = RAIZ / "src" / "data" / "banco.json"
LEGAL = RAIZ / "data" / "legal" / "artigos.json"


def palavras(texto: str) -> int:
    return len(re.findall(r"\S+", texto))


def main() -> int:
    aulas = json.loads(AULAS.read_text(encoding="utf-8"))
    banco = json.loads(BANCO.read_text(encoding="utf-8"))
    legal = json.loads(LEGAL.read_text(encoding="utf-8"))
    ids = {q["id"] for q in banco["questoes"]}
    artigos = {(a["lei"], str(a["artigo"])) for a in legal["artigos"]}

    erros: list[str] = []
    if len(aulas) != 15:
        erros.append(f"esperadas 15 aulas, encontradas {len(aulas)}")

    for aula in aulas:
        total = sum(palavras(s.get("texto_md", "")) for s in aula.get("secoes", []))
        total += palavras(aula.get("resumo", ""))
        if not 600 <= total <= 900:
            erros.append(f"{aula.get('id')}: {total} palavras (fora de 600-900)")
        exemplo = aula.get("exemplo_resolvido", {}).get("questao_id")
        if exemplo not in ids:
            erros.append(f"{aula.get('id')}: exemplo {exemplo} não existe")
        for qid in aula.get("questoes_relacionadas", []):
            if qid not in ids:
                erros.append(f"{aula.get('id')}: questão {qid} não existe")
        for secao in aula.get("secoes", []):
            for citacao in secao.get("artigos", []):
                m = re.match(r"([A-Z0-9]+)\s+art\.?\s*(\d+)", citacao)
                if not m:
                    erros.append(f"{aula.get('id')}: citação mal formatada {citacao}")
                elif (m.group(1), m.group(2)) not in artigos:
                    erros.append(f"{aula.get('id')}: citação inexistente {citacao}")

    print(f"aulas: {len(aulas)}")
    if erros:
        print("ERROS:")
        for erro in erros:
            print(" -", erro)
        return 1
    print("estrutura, tamanho e citações OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
