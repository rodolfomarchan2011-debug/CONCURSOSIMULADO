export interface Provedor {
  nome: string;
  url: string;
  chave: string;
  modelo: string;
}

function base(valor: string): string {
  return valor.replace(/\/+$/, "");
}

/**
 * Resolve o provedor de IA a partir do ambiente. A ordem permite trocar de
 * provedor sem mexer no código — basta uma combinação de variáveis.
 *
 * Genérico (qualquer endpoint compatível com OpenAI, inclusive Ollama):
 *   AI_BASE_URL, AI_API_KEY (opcional), AI_MODEL
 * Presets: GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY,
 *          OPENROUTER_API_KEY.
 */
export function provedor(): Provedor | null {
  const generico = process.env.AI_BASE_URL?.trim();
  if (generico) {
    return {
      nome: process.env.AI_PROVEDOR_NOME ?? "custom",
      url: `${base(generico)}/chat/completions`,
      chave: process.env.AI_API_KEY ?? "ollama",
      modelo: process.env.AI_MODEL ?? "qwen2.5:3b-instruct",
    };
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return {
      nome: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      chave: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY!,
      modelo: process.env.AI_MODEL ?? "gemini-2.5-flash",
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      nome: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      chave: process.env.GROQ_API_KEY,
      modelo: process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      nome: "openai",
      url: `${base(process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1")}/chat/completions`,
      chave: process.env.OPENAI_API_KEY,
      modelo: process.env.AI_MODEL ?? "gpt-4o-mini",
    };
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return {
      nome: "deepseek",
      url: `${base(process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1")}/chat/completions`,
      chave: process.env.DEEPSEEK_API_KEY,
      modelo: process.env.AI_MODEL ?? "deepseek-chat",
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      nome: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      chave: process.env.OPENROUTER_API_KEY,
      modelo: process.env.AI_MODEL ?? "deepseek/deepseek-chat-v3-0324:free",
    };
  }

  return null;
}

export function maxTokens(): number {
  const n = Number(process.env.AI_MAX_TOKENS ?? "900");
  return Number.isFinite(n) && n > 0 ? Math.min(4000, Math.floor(n)) : 900;
}

export function statusTutor() {
  const cfg = provedor();
  return {
    modo: cfg ? (process.env.TAVILY_API_KEY ? "llm+web" : "llm") : "offline",
    provedor: cfg?.nome ?? null,
    modelo: cfg?.modelo ?? null,
    buscaWeb: Boolean(process.env.TAVILY_API_KEY),
  };
}
