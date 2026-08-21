import { ApiFootballError } from "@/lib/server/api-football";
import { getDeepResearch } from "@/lib/server/research";

export async function GET(_request: Request, context: RouteContext<"/api/research/[id]">) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "Invalid fixture ID." }, { status: 400 });

  try {
    return Response.json(await getDeepResearch(Number(id)), {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (error) {
    const status = error instanceof ApiFootballError && error.status === 429 ? 429 : 502;
    return Response.json({ error: error instanceof Error ? error.message : "Deep research failed." }, { status });
  }
}
