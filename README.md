# Simulador TJSP Escrevente 2027

Aplicação web de estudo para o concurso de **Escrevente Técnico Judiciário do TJSP** (banca VUNESP, prova em **14/03/2027**). O MVP já funciona: simulado de 70 questões na matriz oficial, cronômetro de 5 horas ancorado em timestamp, correção com as travas do edital, feedback imediato, tutor de IA opcional e PWA básico.

## Status

| Item | Situação |
| --- | --- |
| Banco com **239 questões** oficiais (2025, 2018, 2004) | ✅ |
| Simulado sorteado 16/30/4/4/9/7 + travas (8 LP, 15 Direito, nota 5,0) | ✅ |
| Treino aleatório por matéria, sempre em ordem diferente | ✅ |
| Modo estudo (gabarito e explicação logo após responder) | ✅ |
| Cronômetro por timestamp + autosave em IndexedDB | ✅ |
| Resultado por bloco/matéria + tempo restante para a redação | ✅ |
| Treino por matéria com feedback imediato | ✅ |
| Tutor de IA com streaming, citação e fallback offline | ✅ |
| Exportar/importar progresso | ✅ |
| PWA básico (manifest + service worker) | ✅ |
| Redação corrigida por IA, probabilidade de aprovação, login, backoffice | ⏳ roadmap |

## Como rodar

Requisitos: Node 20+ e pnpm.

Para usar no celular (iPhone/Android) sem APK, veja [DEPLOY.md](DEPLOY.md): publica na Vercel e instala como PWA.

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
pnpm test          # 21 testes (banco, sorteio/matriz, correção/travas, cronômetro)
```

## Dados (fonte primária)

- **Prova 2025**: VUNESP TJSP2503/001, aplicada em **07/12/2025**, 70 questões + redação. Gabarito oficial VERSÃO 1 (70/70 conferido).
- **Prova 2018**: TJSP1704 (Interior), 100 questões — 99 importadas (a 91 usa figuras). Gabarito oficial versão 2.
- **Prova 2004**: caderno único com gabarito ao final, 70 questões. As 30 de Direito ficam marcadas como `revisar` (legislação anterior ao CPC/2015 e a reformas) e **não entram no simulado**, só no treino com aviso.
- **Estrutura de 2027**: edital TJSP2607, Anexo VIII — 16 Língua Portuguesa, 30 Direito, 4 Atualidades, 4 Matemática, 9 Informática, 7 Raciocínio Lógico. Redação 0–40, mínimo 24.

O simulado **sorteia** 70 questões do banco a cada início, respeitando as cotas por bloco e matéria; o treino embaralha a matéria escolhida. Assim não dá para decorar a ordem.

Os PDFs oficiais ficam em `data/raw/` e o JSON gerado em `src/data/banco.json`.

### Reingestão

```bash
python -m pip install -r tools/requirements.txt
python tools/ingest_edicoes.py        # gera src/data/banco.json (3 edições)
python tools/test_ingest.py
```

O parser reconstrói a ordem de leitura por coluna (PyMuPDF), descarta marcas d'água do PCI, separa enunciado/alternativas, trata texto de apoio compartilhado, corrige palavras quebradas entre blocos e valida número de questões, alternativas e gabarito.

## Tutor de IA

Copie `.env.example` para `.env.local` e escolha **uma** opção. O app fala o protocolo OpenAI, então qualquer endpoint compatível serve:

| Opção | Custo | Como configurar | Observação |
| --- | --- | --- | --- |
| Ollama local | grátis | `AI_BASE_URL=http://127.0.0.1:11434/v1`, `AI_MODEL=qwen2.5:3b-instruct` | roda offline; neste PC (i5, 16 GB, sem GPU) ~40 s por resposta curta no 3B |
| Google Gemini | cota grátis | `GEMINI_API_KEY=...` | rápido; bom custo-benefício em texto |
| Groq | cota grátis | `GROQ_API_KEY=...` | modelos abertos, latência baixa |
| OpenRouter | modelos `:free` | `OPENROUTER_API_KEY=...` | disponibilidade dos grátis varia |
| DeepSeek API | pago, barato | `DEEPSEEK_API_KEY=...` | mesma família do modelo deste chat |
| OpenAI | pago | `OPENAI_API_KEY=...` | referência de qualidade |

`GET /api/tutor/status` informa o modo atual (`offline`, `llm` ou `llm+web`), provedor e modelo; o painel do tutor mostra isso na interface.

Comportamento:
- **Sem chave**: o tutor responde em modo offline com gabarito, explicação da base e fonte (não inventa).
- **Com chave**: resposta em streaming, com prompt de professor VUNESP, citação de artigo e, se `TAVILY_API_KEY` existir, busca web com as fontes injetadas no contexto.
- **Limite**: 80 perguntas/dia por dispositivo+IP (memória do processo — em serverless, troque por tabela/Redis).
- **Segurança**: texto da web entra como dado, nunca como instrução; a chave fica só no servidor.

## Explicações

`src/data/explanations.json` guarda as explicações revisadas. Cobertura atual: **42/70** (Português 1–16, Informática 55–63, Atualidades 47–49, Matemática 52 e 54, Raciocínio Lógico 64–70, mais 17, 44, 45, 50, 51). Faltam as questões de Direito 18–43 e 46 e a 53 (depende da figura do caderno). Questões sem explicação mostram o gabarito, a alternativa correta e um aviso honesto; o botão do tutor permite aprofundar (com chave de IA) e o campo `revisado` existe para a fila de revisão humana.

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

1. Banco atual: 239 questões de 3 edições (2025, 2018, 2004). Ficaram de fora 2021 (gabarito oficial em imagem, sem texto) e 2006/2007 (provas com múltiplas versões e risco de cruzar gabarito errado). Entram numa próxima rodada com OCR/validação por versão.
2. Gabaritos: 2025 (VERSÃO 1, conferido 70/70), 2018 (versão 2) e 2004 (caderno único).
3. Explicações curadas cobrem 42 questões da edição 2025; nas demais o app mostra gabarito, alternativa correta e fonte, e o tutor (com chave) aprofunda. O restante depende do tutor.
4. Sem login: progresso é local ao navegador (exportável em JSON). Importação ainda não implementada.
5. Probabilidade de aprovação e módulo de redação estão fora do MVP (roadmap).
6. Direitos autorais: enunciados pertencem à VUNESP/TJSP; uso educacional com atribuição. Para produto comercial, avalie licenciamento.

## Roadmap

- Fase 2: provas 2006–2021 como acervo histórico (matriz própria), explicações revisadas, caderno de erros + SRS, Raio-X da banca, importação de progresso, redação com rubrica oficial.
- Fase 3: probabilidade com backtest, login/sync, backoffice de curadoria, atualidades mensais, relatório PDF.
