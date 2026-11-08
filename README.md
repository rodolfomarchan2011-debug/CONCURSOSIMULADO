# Simulador TJSP Escrevente 2027

Aplicação web de estudo para o concurso de **Escrevente Técnico Judiciário do TJSP** (banca VUNESP, prova em **14/03/2027**). O MVP já funciona: simulado de 70 questões na matriz oficial, cronômetro de 5 horas ancorado em timestamp, correção com as travas do edital, feedback imediato, tutor de IA opcional e PWA básico.

## Status

| Item | Situação |
| --- | --- |
| Banco com a prova oficial de 2025 (70 questões) | ✅ |
| Simulado completo 16/30/4/4/9/7 + travas (8 LP, 15 Direito, nota 5,0) | ✅ |
| Cronômetro por timestamp + autosave em IndexedDB | ✅ |
| Resultado por bloco/matéria + tempo restante para a redação | ✅ |
| Treino por matéria com feedback imediato | ✅ |
| Tutor de IA com streaming, citação e fallback offline | ✅ |
| Exportar/importar progresso | ✅ (exportar) |
| PWA básico (manifest + service worker) | ✅ |
| Redação corrigida por IA, probabilidade de aprovação, login, backoffice | ⏳ roadmap |

## Como rodar

Requisitos: Node 20+ e pnpm.

```bash
pnpm install
pnpm dev
# http://127.0.0.1:3210
```

Produção:

```bash
pnpm build
pnpm start
```

Testes:

```bash
pnpm test          # 20 testes (matriz, correção/travas, cronômetro)
```

## Dados (fonte primária)

- **Prova**: VUNESP TJSP2503/001 — Escrevente Técnico Judiciário, aplicada em **07/12/2025** (Capital e 1ª RAJ), 70 questões + redação, 5 horas, 5 alternativas.
- **Gabarito**: edital oficial do TJSP de 09/12/2025, **VERSÃO 1** (o caderno importado é a versão 1).
- **Estrutura de 2027**: edital TJSP2607, Anexo VIII — 16 Língua Portuguesa, 30 Conhecimentos em Direito (Penal 4, Processual Penal 5, Processual Civil 5, Constitucional 5, Administrativo 5, Legislação interna 6), 4 Atualidades, 4 Matemática, 9 Informática, 7 Raciocínio Lógico. Redação 0–40, mínimo 24 (19,2 para cotas).

Os PDFs oficiais ficam em `data/raw/` e o JSON gerado em `src/data/questions-2025.json`.

### Reingestão

```bash
python -m pip install -r tools/requirements.txt
python tools/ingest_tjsp2025.py \
  --prova data/raw/vunesp-tjsp2503-prova.pdf \
  --gabarito data/raw/vunesp-tjsp2503-gabarito.pdf \
  --out src/data/questions-2025.json
python tools/test_ingest.py
```

O parser reconstrói a ordem de leitura por coluna (PyMuPDF), separa enunciado/alternativas, trata texto de apoio compartilhado, corrige palavras quebradas entre blocos e valida a matriz 16/30/4/4/9/7 antes de gravar.

## Tutor de IA

Copie `.env.example` para `.env.local` e configure **uma** chave:

```env
OPENAI_API_KEY=...        # ou DEEPSEEK_API_KEY / OPENROUTER_API_KEY
TAVILY_API_KEY=...        # opcional: busca web para dúvidas
```

Comportamento:
- **Sem chave**: o tutor responde em modo offline com gabarito, explicação da base e fonte (não inventa).
- **Com chave**: resposta em streaming, com prompt de professor VUNESP, citação de artigo e, se `TAVILY_API_KEY` existir, busca web com as fontes injetadas no contexto.
- **Limite**: 80 perguntas/dia por dispositivo+IP (memória do processo — em serverless, troque por tabela/Redis).
- **Segurança**: texto da web entra como dado, nunca como instrução; a chave fica só no servidor.

## Explicações

`src/data/explanations.json` guarda as explicações revisadas. Cobertura atual: **11/70** (Português 1–5, 17, 44, 45, 50, 51, 64, 70). Questões sem explicação mostram o gabarito e o botão do tutor — o pipeline foi desenhado para gerar sob demanda e enfileirar revisão humana (campo `revisado`).

## Arquitetura

```
src/
  app/
    page.tsx              # landing com countdown e matriz
    simulado/             # simulado completo (client + Dexie)
    treino/               # treino por matéria com feedback
    resultado/            # correção, travas, erros, tutor
    api/tutor/route.ts    # SSE + RAG local + web search opcional
  components/             # UI, questão, cronômetro, tutor
  lib/                    # banco, scoring, timer, db (Dexie), prefs
  data/                   # questions-2025.json, explanations.json
tools/                    # ingestão Python + teste
tests/                    # Vitest
```

Decisões e desvios do briefing original:
- **Sem Postgres/pgvector no MVP**: os dados de questões são estáticos e o progresso é local (IndexedDB). Isso elimina infra e mantém o app 100% funcional offline. O tutor usa a base local + web; quando houver curadoria legal indexada, entra pgvector.
- **Sem shadcn/ui**: componentes próprios em Tailwind, com a mesma linguagem visual, para reduzir dependências e tempo de build.
- **Cronômetro**: sempre `terminaEm` (timestamp) persistido; `setInterval` só atualiza a tela. Recarregar a página, trocar de aba ou perder conexão não altera o tempo.

## Limitações conhecidas

1. Banco apenas com a prova de 2025 (Capital/1ª RAJ). As provas de 2018 e anteriores têm matriz própria (100 questões) e entram na Fase 2.
2. Gabarito é o oficial preliminar de 09/12/2025; não foi localizada publicação de anulação. Confira antes de uso comercial.
3. Explicações cobrem 11 questões; o restante depende do tutor com chave.
4. Sem login: progresso é local ao navegador (exportável em JSON). Importação ainda não implementada.
5. Probabilidade de aprovação e módulo de redação estão fora do MVP (roadmap).
6. Direitos autorais: enunciados pertencem à VUNESP/TJSP; uso educacional com atribuição. Para produto comercial, avalie licenciamento.

## Roadmap

- Fase 2: provas 2006–2021 como acervo histórico (matriz própria), explicações revisadas, caderno de erros + SRS, Raio-X da banca, importação de progresso, redação com rubrica oficial.
- Fase 3: probabilidade com backtest, login/sync, backoffice de curadoria, atualidades mensais, relatório PDF.
