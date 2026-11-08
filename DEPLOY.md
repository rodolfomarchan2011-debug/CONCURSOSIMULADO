# Colocar no celular (iPhone e Android)

Resumo: **não precisa de APK**. O app é um PWA (web app instalável): você publica em um link HTTPS e adiciona à tela de início nos dois sistemas. O mesmo link serve iPhone e Android, com ícone, tela cheia e funcionamento offline das questões. O tutor de IA precisa de internet e de um provedor hospedado (o Ollama roda só no PC).

## 1. Publicar (Vercel, plano gratuito)

### Opção A — pelo painel (recomendada)

1. Crie um repositório no GitHub e envie este projeto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/tjsp-escrevente.git
   git push -u origin master
   ```
2. Acesse <https://vercel.com/new>, conecte o GitHub e importe o repositório.
3. A Vercel detecta Next.js sozinha. Não mude build nem output.
4. Em **Environment Variables**, adicione (Production e Preview):
   - `GEMINI_API_KEY` = sua chave do Google AI Studio (**grátis**), ou
   - `GROQ_API_KEY` = chave da Groq (**grátis**), ou
   - `DEEPSEEK_API_KEY` = chave paga da DeepSeek, ou
   - `OPENROUTER_API_KEY` = chave do OpenRouter.
   - `AI_MODEL` (opcional): `gemini-2.5-flash`, `llama-3.3-70b-versatile`, `deepseek-chat` etc.
   - `AI_MAX_TOKENS` (opcional): `700`.
   - `TAVILY_API_KEY` (opcional): busca web nas dúvidas.
   - **Não defina `AI_BASE_URL`** na Vercel: essa variável aponta para o Ollama local (`127.0.0.1`) e não existe no servidor.
5. Clique em **Deploy**. Sai um link tipo `https://tjsp-escrevente.vercel.app`.

### Opção B — pela CLI

```bash
pnpm dlx vercel login
pnpm dlx vercel env add GEMINI_API_KEY production   # cole a chave
pnpm dlx vercel --prod
```

Cada push no GitHub gera um novo deploy automático.

## 2. Instalar no celular

### iPhone (Safari)

1. Abra o link no **Safari** (não no Instagram/WhatsApp).
2. Toque em **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**.
3. Abre em tela cheia, com ícone próprio. Depois do primeiro acesso, as questões ficam em cache para uso offline.

### Android (Chrome)

1. Abra o link no **Chrome**.
2. Menu **⋮** → **Instalar app** (ou **Adicionar à tela inicial**).
3. Confirme. O app aparece na gaveta como um app normal.

> APK de verdade só seria necessário para publicar na Play Store. Para uso pessoal, o PWA instalado é equivalente e mais rápido de atualizar. No iPhone não existe APK: o caminho é PWA ou App Store (TestFlight/App Store exige conta de desenvolvedor).

## 3. IA respondendo no celular

O celular não roda Ollama. Use um provedor com API:

| Provedor | Custo | Chave |
| --- | --- | --- |
| Google Gemini (AI Studio) | cota gratuita | <https://aistudio.google.com/apikey> |
| Groq | cota gratuita | <https://console.groq.com/keys> |
| OpenRouter | modelos `:free` | <https://openrouter.ai/keys> |
| DeepSeek | pago, barato | <https://platform.deepseek.com> |

Depois de configurar, confira em `https://SEU-LINK/api/tutor/status`. Deve responder algo como:

```json
{"modo":"llm","provedor":"gemini","modelo":"gemini-2.5-flash","buscaWeb":false}
```

Se responder `"modo":"offline"`, a chave não foi aplicada (ou faltou redeploy).

## 4. O que funciona offline

- Simulado, treino, correção, explicações curadas, resultado.
- Progresso salvo no navegador (IndexedDB) — inclusive se o celular perder conexão no meio do simulado.
- Tutor de IA **não** funciona offline (depende do provedor).

## 5. Limites e cuidados

- **Progresso é por aparelho/navegador**: iPhone e Android não sincronizam. Use “Exportar progresso” (JSON) na tela de Resultados e “Importar JSON” no outro aparelho — ou, no futuro, login.
- **Sem login**: quem tiver o link acessa o app, mas não vê seus dados (ficam no seu navegador).
- **Cota gratuita**: Gemini/Groq têm limite por minuto/dia. Se estourar, o tutor avisa; as questões continuam funcionando.
- **Tempo de função**: o tutor tem limite de 60 s por resposta na Vercel. Modelos gratuitos costumam responder em 2–10 s.
- **Rate limit**: 80 perguntas/dia por dispositivo+IP, em memória (reinicia a cada instância). Para uso sério, troque por banco/Redis.
- **Atualizações**: após um novo deploy, se o celular mostrar versão antiga, feche e abra o app duas vezes (o service worker troca o cache).

## 6. Domínio próprio (opcional)

Na Vercel: **Settings → Domains** → adicione seu domínio e configure o DNS. HTTPS é automático.
