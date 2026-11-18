# ESTADO — TJSP Escrevente

Atualizado: 2026-11-18 · branch `melhoria-pedagogica` · `main` intocada em `57c054a`.

## Pronto

- **D0** (`7c8943b`): 8 fontes, 3.035 artigos; Lei 8.429/92 (22, lacunas 4–6), 9.099/95 (97), 13.146/15 (124), 10.261/68 (329). `meta.leis` com URL, sha256, lacunas, emenda.
- **C1** (`3b9057c`): `data/edital/tjsp2607.json` (58 itens, 11 assuntos), `QUOTAS` derivadas, `tools/edital_importar.py`.
- **C3** (`650b78d`, `4d5917b`): `/estudar`, `/estudar/[aulaId]`, `/curadoria`, overlay de tópicos, links, `/treino?ids=`, validador, montadores, CI.
- **C2 — 9 aulas** (16 previstas após dividir o art. 5º):
  - `dir-const-art5-direitos` (650)
  - `dir-const-art5-remedios` (650)
  - `dir-penal-adm` (680)
  - `dir-pp-inquerito` (711)
  - `dir-pc-atos` (704)
  - `dir-adm-principios` (668)
  - `dir-legis-tjsp` (686)
  - `lp-interpretacao` (651)
  - `lp-crase-regencia` (693)

## Falta

- **C2**: 7 aulas — LP 2 (`lp-concordancia`, `lp-pontuacao`), Informática 2, RL 2, Matemática 1.
- **D1**: 27 explicações (2025/018–043 e 046) em `content/explicacoes/<id>.json`, lotes de 5.
- **Gate parcial**: com as 16 aulas, `pnpm test && pnpm build`, `git switch main && git merge --ff-only`, parar e pedir OK para push.
- **Gate final**: D1 concluído e novo OK para deploy.

## Comandos

```powershell
python tools/validar_aulas.py content/aulas/<id>.json   # corpo >=650 (Direito/LP) ou >=550
python tools/montar_aulas.py
python tools/validar_aulas.py                            # todas
python tools/montar_explicacoes.py
python tools/checar_citacoes.py
pnpm test
pnpm build
```

## Regras invioláveis

1. Citação só existe se estiver em `data/legal/artigos.json`; formato `LEI-ARTIGO[-INCISO]`.
2. Conteúdo novo nasce `revisado: false`; nada vira oficial sem aprovação do dono.
3. Commit/push só na `melhoria-pedagogica`; `main` só no gate final.
4. Aula de Direito exige **corpo >=650 palavras** e **>=3 artigos/incisos**.
5. LP exige **>=2 regras gramaticais** e **>=1 pegadinha VUNESP**; não exige artigo de lei.
6. Informática/RL/Matemática exigem **>=2 exemplos concretos** (comando, número, conta).
7. Aula só passa com exemplo de questão real do banco e 3–5 questões relacionadas.
8. Não usar subagente para escrever conteúdo; um arquivo por aula/questão.
