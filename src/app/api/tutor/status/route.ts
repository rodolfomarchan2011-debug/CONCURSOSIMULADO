import { infoBaseLegal } from "@/lib/legal";
import { statusTutor } from "@/lib/server/ai-config";
import { metricasHoje } from "@/lib/server/metricas";
import { getModeloAtivo, getUltimaFalha } from "@/lib/server/modelo-estado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const info = infoBaseLegal();
  const status = statusTutor();
  return Response.json({
    ...status,
    ...metricasHoje(),
    modeloConfigurado: status.modelo,
    modeloAtivo: getModeloAtivo() ?? status.modelo,
    ultimaFalha: getUltimaFalha(),
    baseLegal: {
      artigos: info.artigos,
      fontes: info.fontes,
    },
  });
}
