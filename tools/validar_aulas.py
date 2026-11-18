"""Valida aulas: content/aulas/<id>.json (ou todos, se sem argumento).

Métrica: SOMENTE secoes[].texto_md (corpo didático).
Mínimos: 650 palavras (Direito/LP) e 550 (Informática/RL/Matemática).
Direito exige >= 3 artigos/incisos citados.
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

MINIMO = 650
MINIMO_OBJETIVO = 550


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

    corpo = sum(palavras(s.get("texto_md", "")) for s in aula.get("secoes", []))
    objetivo = aula.get("materia") == "Conhecimentos Gerais" and aula.get("assunto") in {
        "Informática",
        "Raciocínio Lógico",
        "Matemática",
    }
    minimo = MINIMO_OBJETIVO if objetivo else MINIMO
    if corpo < minimo:
        erros.append(f"corpo={corpo} palavras (mínimo {minimo})")

    exemplo = aula.get("exemplo_resolvido", {}).get("questao_id")
    if exemplo not in ids:
        erros.append(f"exemplo {exemplo} não existe no banco")
    for qid in aula.get("questoes_relacionadas", []):
        if qid not in ids:
            erros.append(f"questão {qid} não existe")

    citacoes = list(aula.get("artigos_citados", []))
    for secao in aula.get("secoes", []):
        citacoes.extend(secao.get("artigos", []))
    distintas: set[str] = set()
    for citacao in citacoes:
        m = re.match(r"([A-Z0-9]+)-(\d+)(?:-[A-Z0-9]+)?$", citacao)
        if not m:
            erros.append(f"citação mal formatada: {citacao} (use LEI-ARTIGO[-INCISO])")
            continue
        par = (m.group(1), m.group(2))
        if par not in artigos:
            erros.append(f"citação inexistente: {citacao}")
        distintas.add(citacao)

    direito = aula.get("materia") == "Conhecimentos em Direito"
    if direito and len(distintas) < 3:
        erros.append(f"Direito exige >= 3 artigos/incisos citados (tem {len(distintas)})")

    print(f"{caminho.name}: corpo={corpo} palavras, {len(distintas)} artigos, {len(erros)} erro(s)")
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
