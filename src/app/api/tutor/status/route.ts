import { infoBaseLegal } from "@/lib/legal";
import { statusTutor } from "@/lib/server/ai-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const info = infoBaseLegal();
  return Response.json({
    ...statusTutor(),
    baseLegal: {
      artigos: info.artigos,
      fontes: info.fontes,
    },
  });
}
