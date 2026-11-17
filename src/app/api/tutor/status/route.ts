import { infoBaseLegal } from "@/lib/legal";
import { statusTutor } from "@/lib/server/ai-config";
import { metricasHoje } from "@/lib/server/metricas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const info = infoBaseLegal();
  return Response.json({
    ...statusTutor(),
    ...metricasHoje(),
    baseLegal: {
      artigos: info.artigos,
      fontes: info.fontes,
    },
  });
}
