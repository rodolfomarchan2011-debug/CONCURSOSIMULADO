/** Estado em processo da cadeia de modelos (sem PII). */
export interface FalhaModelo {
  modelo: string;
  status: number;
  motivo: string;
  em: number;
}

let modeloAtivo: string | null = null;
let ultimaFalha: FalhaModelo | null = null;

export function getModeloAtivo(): string | null {
  return modeloAtivo;
}

export function setModeloAtivo(modelo: string): void {
  modeloAtivo = modelo;
}

export function registrarFalhaModelo(falha: FalhaModelo): void {
  ultimaFalha = falha;
}

export function getUltimaFalha(): FalhaModelo | null {
  return ultimaFalha;
}
