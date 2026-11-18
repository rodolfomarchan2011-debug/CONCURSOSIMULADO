"""Valida aulas: content/aulas/<id>.json (ou todos, se sem argumento).

Checa esquema mínimo, 600-900 palavras, questão real, citações existentes.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "content" / "aulas"
BANCO = RAIZ / "src" / "data" / "banco.json"
LEGAL = RAIZ / "data" / "legal" / "artigos.json"


def palavras(texto: str) -> int:
    return len(re.findall(r"\S+", texto))


def validar(caminho: Path, ids: set[str], artigos: set[tuple[str, str]]) -> list[str]:
    erros: list[str] = []
    aula = json.loads(caminho.read_text(encoding="utf-8"))
    obrigatorios = [
        "id",
        "materia",
        "assunto",
        "topico",
        "edital_ref",
        "objetivos",
        "secoes",
        "exemplo_resolvido",
        "erro_comum",
        "pegadinhas",
        "resumo",
        "flashcards",
        "questoes_relacionadas",
        "artigos_citados",
        "revisado",
        "versao",
    ]
    for campo in obrigatorios:
        if campo not in aula:
            erros.append(f"campo ausente: {campo}")

    total = sum(palavras(s.get("texto_md", "")) for s in aula.get("secoes", []))
    total += palavras(aula.get("resumo", ""))
    total += palavras(aula.get("erro_comum", ""))
    if not 600 <= total <= 900:
        erros.append(f"{total} palavras (fora de 600-900)")

    exemplo = aula.get("exemplo_resolvido", {}).get("questao_id")
    if exemplo not in ids:
        erros.append(f"exemplo {exemplo} não existe no banco")
    for qid in aula.get("questoes_relacionadas", []):
        if qid not in ids:
            erros.append(f"questão {qid} não existe")

    citacoes = list(aula.get("artigos_citados", []))
    for secao in aula.get("secoes", []):
        citacoes.extend(secao.get("artigos", []))
    for citacao in citacoes:
        m = re.match(r"([A-Z0-9]+)-(\d+)$", citacao)
        if not m:
            erros.append(f"citação mal formatada: {citacao} (use LEI-ARTIGO)")
        elif (m.group(1), m.group(2)) not in artigos:
            erros.append(f"citação inexistente: {citacao}")

    print(f"{caminho.name}: {total} palavras, {len(erros)} erro(s)")
    return erros


def main() -> int:
    banco = json.loads(BANCO.read_text(encoding="utf-8"))
    legal = json.loads(LEGAL.read_text(encoding="utf-8"))
    ids = {q["id"] for q in banco["questoes"]}
    artigos = {(a["lei"], str(a["artigo"])) for a in legal["artigos"]}

    if len(sys.argv) > 1:
        arquivos = [Path(arg) for arg in sys.argv[1:]]
    else:
        arquivos = sorted(ORIGEM.glob("*.json"))

    falhas = 0
    for arquivo in arquivos:
        erros = validar(arquivo, ids, artigos)
        if erros:
            falhas += 1
            for erro in erros:
                print("  -", erro)
    print(f"arquivos: {len(arquivos)} | com erro: {falhas}")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
