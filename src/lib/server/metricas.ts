/** Contadores diários em memória (sem PII). Zeram na virada do dia UTC. */
type Estado = {
  dia: string;
  chamadas: number;
  fallbacks: number;
  erros: number;
};

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

let estado: Estado = { dia: hoje(), chamadas: 0, fallbacks: 0, erros: 0 };

function garantirDia(): void {
  const atual = hoje();
  if (estado.dia !== atual) {
    estado = { dia: atual, chamadas: 0, fallbacks: 0, erros: 0 };
  }
}

export const LIMITE_GLOBAL_DIARIO = Number(
  process.env.AI_LIMITE_GLOBAL_DIARIO ?? "2000",
);

export function registrarChamada(): void {
  garantirDia();
  estado.chamadas += 1;
}

export function registrarFallback(): void {
  garantirDia();
  estado.fallbacks += 1;
}

export function registrarErro(): void {
  garantirDia();
  estado.erros += 1;
}

export function limiteGlobalEstourado(): boolean {
  garantirDia();
  return estado.chamadas >= LIMITE_GLOBAL_DIARIO;
}

export function metricasHoje(): {
  chamadasHoje: number;
  fallbacksHoje: number;
  errosHoje: number;
  limiteGlobal: number;
} {
  garantirDia();
  return {
    chamadasHoje: estado.chamadas,
    fallbacksHoje: estado.fallbacks,
    errosHoje: estado.erros,
    limiteGlobal: LIMITE_GLOBAL_DIARIO,
  };
}
