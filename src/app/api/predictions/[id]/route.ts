import { ApiFootballError } from "@/lib/server/api-football";
import { getPrediction, PREDICTION_CACHE_SECONDS } from "@/lib/server/predictions";

export async function GET(_request: Request, context: RouteContext<"/api/predictions/[id]">) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "Fixture ID must be a positive number." }, { status: 400 });
  }

  try {
    return Response.json(await getPrediction(Number(id)), {
      headers: {
        "Cache-Control": `private, max-age=${PREDICTION_CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    const status = error instanceof ApiFootballError && error.status === 429 ? 429 : 502;
    const message = error instanceof Error ? error.message : "Unable to load the prediction.";
    return Response.json({ error: message }, { status });
  }
}
