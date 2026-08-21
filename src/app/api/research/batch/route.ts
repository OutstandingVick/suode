import { getBatchPredictions } from "@/lib/server/batch-predictions";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: unknown };
    if (typeof body.query !== "string" || !body.query.trim()) {
      return Response.json({ error: "Describe the matches you want Suode to research." }, { status: 400 });
    }

    return Response.json(await getBatchPredictions(body.query), {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Batch research failed." }, { status: 502 });
  }
}
