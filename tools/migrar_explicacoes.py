"""Migra as explicações curadas (formato antigo) para ExplicacaoV2.

Lê src/data/explanations.json + src/data/banco.json e grava
src/data/explicacoes-v2.json com chave = id da questão.

Uso: python tools/migrar_explicacoes.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
EXPLICACOES = RAIZ / "src" / "data" / "explanations.json"
BANCO = RAIZ / "src" / "data" / "banco.json"
SAIDA = RAIZ / "src" / "data" / "explicacoes-v2.json"


def detectar_lei(texto: str) -> str:
    t = texto.lower()
    if "processual penal" in t or "cpp" in t:
        return "CPP"
    if "processual civil" in t or "cpc" in t:
        return "CPC"
    if "constitui" in t or re.search(r"\bcf\b", t):
        return "CF"
    if "penal" in t or re.search(r"\bcp\b", t):
        return "CP"
    return ""


def migrar(antiga: dict, questao: dict) -> dict:
    base = (antiga.get("base") or "").strip()
    correta = (antiga.get("correta") or "").strip()
    fundamento = []
    m = re.search(r"art\.?\s*(\d{1,4})", base, re.IGNORECASE)
    if m:
        fundamento.append(
            {
                "lei": detectar_lei(base) or detectar_lei(questao.get("assunto", "")),
                "artigo": m.group(1),
                "trecho": base,
                "fonte": questao.get("fonte", ""),
            }
        )
    return {
        "questao_id": questao["id"],
        "raciocinio": [base] if base else [],
        "porque_correta": correta,
        "porque_erradas": [],
        "pegadinha": "",
        "fundamento_legal": fundamento,
        "como_lembrar": "",
        "fonte": antiga.get("fonte") or questao.get("fonte", ""),
        "confianca": 0.8,
        "revisado": bool(antiga.get("revisado")),
        "versao": 1,
    }


def main() -> None:
    antigas = json.loads(EXPLICACOES.read_text(encoding="utf-8"))
    banco = json.loads(BANCO.read_text(encoding="utf-8"))
    por_numero = {
        q["numero"]: q for q in banco["questoes"] if q["edicao"] == "2025"
    }

    saida: dict[str, dict] = {}
    ignoradas: list[str] = []
    for chave, antiga in antigas.items():
        numero = int(re.sub(r"\D", "", chave))
        questao = por_numero.get(numero)
        if not questao:
            ignoradas.append(chave)
            continue
        saida[questao["id"]] = migrar(antiga, questao)

    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"migradas: {len(saida)} | ignoradas: {ignoradas}")
    print(f"-> {SAIDA}")

    sem_fundamento = sum(1 for v in saida.values() if not v["fundamento_legal"])
    print(f"sem fundamento legal (ok para LP): {sem_fundamento}")


if __name__ == "__main__":
    main()
